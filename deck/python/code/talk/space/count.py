"""How big the sound space is, under every reading of the question.

Three counts matter and they differ by orders of magnitude, so a design
that says "the inventory" without saying which one is under-specified:

  ATTESTED    what some documented language is recorded saying
  PRODUCIBLE  what a human vocal tract can make
  PERMITTED   what the notation can write, articulation ignored

A conlang tool needs PRODUCIBLE, because a designed language draws from
sounds nobody happens to use. A corpus index needs ATTESTED. A validator
needs PERMITTED.

Crossed with three TIERS of granularity and two NOTATIONS, that is
eighteen numbers, and this computes all of them.

Mirrors ``code/space/index.ts`` in the TypeScript port.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass
from typing import Iterable, Literal, Optional

from .axis import IPA_AXES, SUPRASEGMENTAL, attaches
from .codec import size_of
from .model import TONE_SUPRA, Notation, Tier, model_for
from ..string.convert import ipa_to_talk
from ..string.data import modifiers, phones
from ..string.runtime import R, modifier_attaches
from ..string.sound import make_sound, segment

Space = Literal["attested", "producible", "permitted"]

#: IPA marks that are suprasegmental, so ``band`` can strip them from a
#: source string.
_IPA_SUPRA_MARKS = frozenset(
    mark
    for axis, groups in IPA_AXES.items()
    if axis in SUPRASEGMENTAL
    for group in groups
    for mark in group.marks
)

#: The character capacity each tier was designed to encode into.
CAPACITY: dict[str, int] = {
    # Hangul syllables with no final consonant, 19 x 21.
    "seed": 399,
    # Hangul syllables with a vertical medial and a final, 8 x 19 x 27.
    "band": 4104,
    # Hangul syllables with a compound medial and a final, 8 x 19 x 27.
    "mesh": 4104,
}


def _nfd(text: str) -> str:
    return unicodedata.normalize("NFD", text)


def bytes_for(count: int) -> int:
    """Bytes a count needs, for the tiers that outgrow a character space."""
    return max(1, -(-max(2, count - 1).bit_length() // 8))


def _slot_combos(mods: list) -> list[list]:
    """Choose none or one modifier from each slot, in every combination."""
    by_slot: dict[str, list] = {}
    for mod in mods:
        by_slot.setdefault(mod.slot, []).append(mod)

    combos: list[list] = [[]]

    for options in by_slot.values():
        nxt: list[list] = []
        for combo in combos:
            nxt.append(combo)
            for option in options:
                nxt.append(combo + [option])
        combos = nxt

    return combos


def _tone_producible(tier: Tier) -> int:
    if tier == "seed":
        return len(R.starter_phones) + len(modifiers)

    seen: set[str] = set()

    for base in R.starter_phones:
        pool = [
            mod
            for mod in (
                R.consonant_modifiers
                if base.form == "consonant"
                else R.vowel_modifiers
            )
            if modifier_attaches(base, mod)
            and (tier == "mesh" or mod.slot not in TONE_SUPRA)
        ]

        for combo in _slot_combos(pool):
            seen.add(make_sound(base, combo).talk)

    return len(seen)


def _ipa_producible(tier: Tier) -> int:
    if tier == "seed":
        seen: set[str] = set()

        for phone in phones:
            seen.update(_nfd(phone.ipa))

        for groups in IPA_AXES.values():
            for group in groups:
                for mark in group.marks:
                    seen.update(_nfd(mark))

        return len(seen)

    # The chart is the producible base inventory: the IPA assigns a symbol
    # only to an articulation a human can make, and the impossible cells
    # are shaded with no symbol at all.
    total = 0

    for base in phones:
        ways = 1

        for axis, groups in IPA_AXES.items():
            if tier == "band" and axis in SUPRASEGMENTAL:
                continue

            options = sum(
                len(group.marks)
                for group in groups
                if attaches(base, group.rule)
            )

            # Plus the option of leaving this axis unmarked.
            ways *= options + 1

        total += ways

    return total


def _tone_permitted(tier: Tier) -> int:
    if tier == "seed":
        return len(R.starter_phones) + len(modifiers)

    by_slot: dict[str, int] = {}

    for mod in list(R.consonant_modifiers) + list(R.vowel_modifiers):
        if tier == "band" and mod.slot in TONE_SUPRA:
            continue
        by_slot[mod.slot] = by_slot.get(mod.slot, 0) + 1

    factor = 1
    for options in by_slot.values():
        factor *= options + 1

    return len(R.starter_phones) * factor


def _ipa_permitted(tier: Tier) -> int:
    if tier == "seed":
        return _ipa_producible("seed")

    factor = 1

    for axis, groups in IPA_AXES.items():
        if tier == "band" and axis in SUPRASEGMENTAL:
            continue

        marks = sum(len(group.marks) for group in groups)
        factor *= marks + 1

    return len(phones) * factor


def unit_for(
    *, phoneme: str, notation: Notation, tier: Tier
) -> Optional[list[str]]:
    """Reduce one source phoneme to the unit a tier would hold.

    Returns ``None`` when the notation cannot read it, so a caller counting
    attested units does not credit input that never resolved.
    """
    if notation == "ipa":
        decomposed = list(_nfd(phoneme))

        if tier == "seed":
            return decomposed
        if tier == "mesh":
            return [_nfd(phoneme)]

        stripped = "".join(
            character
            for character in decomposed
            if character not in _IPA_SUPRA_MARKS
        )

        return [stripped] if stripped else None

    talk = ipa_to_talk(phoneme)

    if not talk:
        return None

    sounds = segment(talk)

    if tier == "seed":
        out: list[str] = []
        for sound in sounds:
            if sound.base is None:
                out.append(sound.talk)
                continue
            out.append(sound.base.talk)
            out.extend(mod.talk for mod in sound.modifiers)
        return out

    parts: list[str] = []

    for sound in sounds:
        if sound.base is None:
            parts.append(sound.talk)
            continue

        mods = [
            mod
            for mod in sound.modifiers
            if tier == "mesh" or mod.slot not in TONE_SUPRA
        ]
        parts.append(sound.base.talk + "".join(mod.talk for mod in mods))

    return ["".join(parts)]


def count_attested(
    *, phonemes: Iterable[str], notation: Notation, tier: Tier
) -> int:
    """How many distinct units a corpus attests at a tier.

    The corpus is passed in rather than read, because the phoneme lists
    this is measured against (Phoible and the like) are far too large to
    ship and change independently of the library.
    """
    seen: set[str] = set()

    for phoneme in phonemes:
        units = unit_for(phoneme=phoneme, notation=notation, tier=tier)

        if units is None:
            continue

        seen.update(units)

    return len(seen)


def count_space(*, notation: Notation, tier: Tier, space: Space) -> int:
    """How many units exist at a tier, under one reading of "exist".

    ``attested`` needs a corpus and is not answerable here; use
    ``count_attested`` for it.
    """
    if space == "attested":
        raise ValueError("attested needs a corpus, use count_attested")

    if space == "producible":
        return (
            _ipa_producible(tier)
            if notation == "ipa"
            else _tone_producible(tier)
        )

    return (
        _ipa_permitted(tier) if notation == "ipa" else _tone_permitted(tier)
    )


@dataclass(frozen=True)
class SpaceReport:
    notation: str
    tier: str
    attested: Optional[int]
    producible: int
    permitted: int


def report_space(
    phonemes: Optional[Iterable[str]] = None,
) -> list[SpaceReport]:
    """Every count, for every notation and tier.

    Pass a corpus to fill the attested column; without one it is ``None``,
    since nothing in the library knows what languages say.
    """
    corpus = list(phonemes) if phonemes is not None else None
    out: list[SpaceReport] = []

    for notation in ("ipa", "tone"):
        for tier in ("seed", "band", "mesh"):
            out.append(
                SpaceReport(
                    notation=notation,
                    tier=tier,
                    attested=(
                        count_attested(
                            phonemes=corpus, notation=notation, tier=tier
                        )
                        if corpus is not None
                        else None
                    ),
                    producible=count_space(
                        notation=notation, tier=tier, space="producible"
                    ),
                    permitted=count_space(
                        notation=notation, tier=tier, space="permitted"
                    ),
                )
            )

    return out
