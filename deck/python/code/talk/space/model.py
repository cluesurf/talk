"""One shape for both notations, so the codec is written once.

A sound is a BASE plus at most one mark per AXIS. That is all the codec
needs to know, and both notations fit it: talk's slots and modifiers, and
IPA's axes and diacritics.

Which marks an axis offers depends on the base, because attachment rules
stop a mark applying where the articulation cannot support it. So the
radix is per base, not global, and the codec is mixed-radix over a ragged
table rather than a flat product.

Mirrors ``code/space/model.ts`` in the TypeScript port.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass, field
from typing import Callable, Literal, Optional

from .axis import IPA_AXES, SUPRASEGMENTAL, attaches
from ..string.data import modifiers, phones
from ..string.runtime import R, modifier_attaches
from ..string.type import Phone

Notation = Literal["ipa", "tone"]

#: How much of a sound one code holds.
#:
#:   seed  one atomic unit: a base, or a single mark
#:   band  a base with its segmental marks, no suprasegmentals
#:   mesh  a base with everything
Tier = Literal["seed", "band", "mesh"]


@dataclass(frozen=True)
class ModelBase:
    """A base sound, spelled in whichever notation is in play."""

    key: str
    form: str
    place: Optional[str] = None
    manner: Optional[str] = None
    voicing: Optional[str] = None


@dataclass(frozen=True)
class ModelMark:
    key: str
    allows: Callable[[ModelBase], bool]


@dataclass(frozen=True)
class ModelAxis:
    """One articulatory dimension, and the marks that vary along it."""

    name: str
    suprasegmental: bool
    marks: list[ModelMark]


@dataclass(frozen=True)
class Model:
    bases: list[ModelBase]
    axes: list[ModelAxis]
    #: Every atomic unit: the bases and the marks, for the ``seed`` tier.
    units: list[str] = field(default_factory=list)


#: talk's slots that describe the syllable rather than the segment.
TONE_SUPRA = frozenset(["duration", "stress", "tone", "syllabicity"])


def _nfd(text: str) -> str:
    return unicodedata.normalize("NFD", text)


def _tone_model() -> Model:
    bases = sorted(
        (
            ModelBase(
                key=phone.talk,
                form=phone.form,
                place=phone.place,
                manner=phone.manner,
                voicing=phone.voicing,
            )
            for phone in R.starter_phones
        ),
        key=lambda base: base.key,
    )

    by_slot: dict[str, list] = {}
    for mod in modifiers:
        by_slot.setdefault(mod.slot, []).append(mod)

    def make_allows(mod) -> Callable[[ModelBase], bool]:
        def allows(base: ModelBase) -> bool:
            # The modifier's own form gate, then its attachment rule.
            if mod.base not in ("any", base.form):
                return False

            return modifier_attaches(
                Phone(
                    ipa="",
                    talk=base.key,
                    xsampa="",
                    simple="",
                    form=base.form,
                    place=base.place,
                    manner=base.manner,
                    voicing=base.voicing,
                ),
                mod,
            )

        return allows

    axes = [
        ModelAxis(
            name=name,
            suprasegmental=name in TONE_SUPRA,
            marks=[
                ModelMark(key=mod.talk, allows=make_allows(mod))
                for mod in sorted(mods, key=lambda m: m.talk)
            ],
        )
        for name, mods in sorted(by_slot.items())
    ]

    return Model(
        bases=bases,
        axes=axes,
        units=[base.key for base in bases]
        + sorted({mod.talk for mod in modifiers}),
    )


def _ipa_model() -> Model:
    bases = sorted(
        (
            ModelBase(
                key=_nfd(phone.ipa),
                form=phone.form,
                place=phone.place,
                manner=phone.manner,
                voicing=phone.voicing,
            )
            for phone in phones
        ),
        key=lambda base: base.key,
    )

    def make_allows(rule) -> Callable[[ModelBase], bool]:
        return lambda base: attaches(base, rule)

    axes = []
    for name, groups in sorted(IPA_AXES.items()):
        pairs = sorted(
            (
                (mark, group.rule)
                for group in groups
                for mark in group.marks
            ),
            key=lambda pair: pair[0],
        )
        axes.append(
            ModelAxis(
                name=name,
                suprasegmental=name in SUPRASEGMENTAL,
                marks=[
                    ModelMark(key=_nfd(mark), allows=make_allows(rule))
                    for mark, rule in pairs
                ],
            )
        )

    # Atomic units are single codepoints, so a multi-character base
    # contributes its parts rather than itself.
    atoms: set[str] = set()
    for base in bases:
        atoms.update(base.key)
    for axis in axes:
        for mark in axis.marks:
            atoms.update(mark.key)

    return Model(bases=bases, axes=axes, units=sorted(atoms))


_CACHE: dict[str, Model] = {}


def model_for(notation: Notation) -> Model:
    """The model for a notation, built once."""
    if notation not in _CACHE:
        _CACHE[notation] = (
            _tone_model() if notation == "tone" else _ipa_model()
        )

    return _CACHE[notation]


def axes_for(notation: Notation, tier: Tier) -> list[ModelAxis]:
    """The axes a tier includes. ``seed`` has none: it holds atoms."""
    if tier == "seed":
        return []

    axes = model_for(notation).axes

    if tier == "mesh":
        return axes

    return [axis for axis in axes if not axis.suprasegmental]
