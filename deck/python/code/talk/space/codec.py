"""Dense integer codes for every system of both notations.

The code is COMPUTED, not looked up. ``ipa mesh`` holds 166 million
sounds, which no table wants to be, so each code is a mixed-radix index: a
base picks an offset, and each axis contributes a digit whose radix is how
many marks that axis offers THAT base. Attachment rules make the radix
ragged, so the offsets are prefix sums over per-base products.

The result is a bijection onto ``[0, producible)``, which is what makes
the byte widths in ``byte_width`` tight rather than generous.

Mirrors ``code/space/codec.ts`` in the TypeScript port.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import unicodedata

from ..string.type import NO_CODE


def _nfd(text: str) -> str:
    return unicodedata.normalize("NFD", text)


#: The block ``machine_text`` draws from: contiguous CJK ideographs.
#: Printable, no control characters, no combining marks and no case
#: folding, so a database can index it with trigrams.
_TEXT_BASE = 0x4E00
from .model import (
    ModelAxis,
    ModelBase,
    Notation,
    Tier,
    axes_for,
    model_for,
)


@dataclass(frozen=True)
class Composition:
    """A sound broken into the parts a code is built from."""

    base: str
    #: One mark per axis, or ``None`` where the axis is unmarked.
    marks: list[Optional[str]]


def _radix(axis: ModelAxis, base: ModelBase) -> int:
    """How many marks an axis offers a base, plus the option of none."""
    return 1 + sum(1 for mark in axis.marks if mark.allows(base))


@dataclass(frozen=True)
class Layout:
    bases: list[ModelBase]
    axes: list[ModelAxis]
    #: Radix per base, per axis.
    radices: list[list[int]]
    #: Where each base's block starts.
    offsets: list[int]
    size: int


_LAYOUTS: dict[str, Layout] = {}


def _layout_for(type: Notation, system: Tier) -> Layout:
    """The offset table for a tier, built once."""
    key = f"{type}:{system}"

    if key in _LAYOUTS:
        return _LAYOUTS[key]

    bases = model_for(type).bases
    axes = axes_for(type, system)

    radices: list[list[int]] = []
    offsets: list[int] = []
    size = 0

    for base in bases:
        row = [_radix(axis, base) for axis in axes]

        offsets.append(size)
        radices.append(row)

        product = 1
        for options in row:
            product *= options

        size += product

    layout = Layout(
        bases=bases, axes=axes, radices=radices, offsets=offsets, size=size
    )
    _LAYOUTS[key] = layout

    return layout


def size_of(*, type: Notation, system: Tier) -> int:
    """How many codes a tier has, which is the producible count."""
    if system == "seed":
        return len(model_for(type).units)

    return _layout_for(type, system).size


def byte_width(*, type: Notation, system: Tier) -> int:
    """Bytes one code needs, so a caller can pack to a fixed width.

    Sized to the tier rather than to a single global width, since ``tone
    seed`` fits in one byte and ``ipa mesh`` needs four.
    """
    size = max(2, size_of(type=type, system=system))
    bits = (size - 1).bit_length()

    return max(1, min(4, -(-bits // 8)))


def encode_unit(
    *, composition: Composition, type: Notation, system: Tier
) -> int:
    """Turn a composition into its code.

    Raises on a base or mark the tier does not hold, because a silent
    fallback would put a wrong sound at a real code.
    """
    if system == "seed":
        units = model_for(type).units

        if composition.base not in units:
            raise ValueError(f"unknown seed unit {composition.base}")

        return units.index(composition.base)

    layout = _layout_for(type, system)

    at = next(
        (
            index
            for index, base in enumerate(layout.bases)
            if base.key == composition.base
        ),
        None,
    )

    if at is None:
        raise ValueError(f"unknown base {composition.base}")

    base = layout.bases[at]
    row = layout.radices[at]
    local = 0

    for axis_at, axis in enumerate(layout.axes):
        chosen = (
            composition.marks[axis_at]
            if axis_at < len(composition.marks)
            else None
        )

        # Digit 0 is "unmarked"; the allowed marks follow in their stable
        # order, so a digit means the same thing for every base offering it.
        digit = 0

        if chosen is not None:
            seen = 0

            for mark in axis.marks:
                if not mark.allows(base):
                    continue

                seen += 1

                if mark.key == chosen:
                    digit = seen
                    break

            if digit == 0:
                raise ValueError(
                    f"{chosen} does not attach to {composition.base}"
                )

        local = local * row[axis_at] + digit

    return layout.offsets[at] + local


def decode_unit(*, code: int, type: Notation, system: Tier) -> Composition:
    """Turn a code back into its composition."""
    if system == "seed":
        units = model_for(type).units

        if code < 0 or code >= len(units):
            raise ValueError(f"code {code} out of range")

        return Composition(base=units[code], marks=[])

    layout = _layout_for(type, system)

    if code < 0 or code >= layout.size:
        raise ValueError(f"code {code} out of range")

    # The offsets ascend, so the base is the last block starting at or
    # before the code.
    low = 0
    high = len(layout.offsets) - 1

    while low < high:
        middle = -(-(low + high) // 2)

        if layout.offsets[middle] <= code:
            low = middle
        else:
            high = middle - 1

    base = layout.bases[low]
    row = layout.radices[low]

    local = code - layout.offsets[low]
    marks: list[Optional[str]] = [None] * len(layout.axes)

    for axis_at in range(len(layout.axes) - 1, -1, -1):
        digit = local % row[axis_at]
        local //= row[axis_at]

        if digit == 0:
            continue

        allowed = [
            mark
            for mark in layout.axes[axis_at].marks
            if mark.allows(base)
        ]
        marks[axis_at] = allowed[digit - 1].key

    return Composition(base=base.key, marks=marks)


def composition_of(
    *, sound, type: Notation, system: Tier
) -> Optional[Composition]:
    """The composition of a parsed sound, ready to encode.

    A ``Sound`` already carries its base and modifiers; this only has to
    put one mark per axis in the order the codec expects, leaving unmarked
    axes ``None``.
    """
    if sound.base is None:
        return None

    axes = axes_for(type, system)

    # The model keys IPA bases by their IPA spelling and tone bases by
    # their talk spelling, so the composition has to match the notation it
    # is being encoded in.
    def key_of(value) -> str:
        return _nfd(value.ipa) if type == "ipa" else value.talk

    return Composition(
        base=key_of(sound.base),
        marks=[
            next(
                (
                    key_of(mod)
                    for mod in sound.modifiers
                    # Fine detail contributes no digit to the TONE space,
                    # which is deliberately coarser and does not hold
                    # these marks. It has to be skipped rather than left
                    # to fail: `encode_unit` raises on a mark its axis
                    # does not offer, so a breathy `b` would have no code
                    # at all instead of encoding as the `b` it coarsens
                    # to. That is what every phonetic index built on
                    # these codes has always meant by it.
                    #
                    # The IPA space is lossless and keys its axes off the
                    # IPA marks themselves, so it still encodes the
                    # detail it can hold.
                    if mod.slot == axis.name
                    and not (type == "tone" and mod.detail)
                ),
                None,
            )
            for axis in axes
        ],
    )


def code_of(*, sound, type: Notation, system: Tier) -> int:
    """The machine code for a parsed sound, computed rather than looked up.

    This is what removed the registry: ``tokens.json`` held 91,332 assigned
    codes and inlined 4.5MB into every bundle, for an answer the model can
    derive. A sound outside the space yields ``NO_CODE``.
    """
    composition = composition_of(sound=sound, type=type, system=system)

    if composition is None:
        return NO_CODE

    try:
        return encode_unit(
            composition=composition, type=type, system=system
        )
    except ValueError:
        return NO_CODE


def machine(*, text: str, type: Notation, system: Tier) -> list[int]:
    """Encode a whole string at a notation and tier.

    The input is read as the notation says: an IPA string for ``ipa``, a
    tone string for ``tone``. At ``seed`` a sound yields SEVERAL codes, one
    per atomic unit, because that tier holds parts rather than wholes.

    A unit the tier cannot hold yields ``NO_CODE``, so the list always
    lines up with the input and a caller can see what failed.
    """
    from ..string.read import read_sounds

    out: list[int] = []

    def push(unit: str) -> None:
        try:
            out.append(
                encode_unit(
                    composition=Composition(base=unit, marks=[]),
                    type=type,
                    system=system,
                )
            )
        except ValueError:
            out.append(NO_CODE)

    for sound in read_sounds(text=text, type=type):
        if sound.base is None:
            out.append(NO_CODE)
            continue

        if system == "seed":
            # The base and each mark are separate units here. IPA seed
            # units are single codepoints, so a multi-character base
            # contributes its parts.
            if type == "ipa":
                for character in _nfd(sound.base.ipa):
                    push(character)
                for mod in sound.modifiers:
                    for character in _nfd(mod.ipa):
                        push(character)
            else:
                push(sound.base.talk)
                for mod in sound.modifiers:
                    push(mod.talk)

            continue

        out.append(code_of(sound=sound, type=type, system=system))

    return out


def machine_text(*, text: str, type: Notation, system: Tier) -> str:
    """Encode as text: a fixed number of characters per code.

    The list form is what a model consumes; this is what a text index
    consumes. A fixed width means a match on a character boundary is
    always a match on a unit boundary.
    """
    width = byte_width(type=type, system=system)
    out: list[str] = []

    for raw in machine(text=text, type=type, system=system):
        code = size_of(type=type, system=system) if raw < 0 else raw

        # Six bits per character, so the block stays inside one contiguous
        # run of printable CJK.
        for at in range(width - 1, -1, -1):
            out.append(chr(_TEXT_BASE + ((code >> (at * 6)) & 0x3F)))

    return "".join(out)


def machine_bytes(*, text: str, type: Notation, system: Tier) -> bytes:
    """Encode as bytes, the tier's fixed width per code, big-endian."""
    return pack(
        codes=machine(text=text, type=type, system=system),
        type=type,
        system=system,
    )


def pack(*, codes: list[int], type: Notation, system: Tier) -> bytes:
    """Pack codes to the system's fixed byte width, big-endian."""
    width = byte_width(type=type, system=system)
    out = bytearray()

    for code in codes:
        out.extend(code.to_bytes(width, "big"))

    return bytes(out)


def unpack(*, data: bytes, type: Notation, system: Tier) -> list[int]:
    """Read codes back from a fixed-width buffer."""
    width = byte_width(type=type, system=system)

    return [
        int.from_bytes(data[at : at + width], "big")
        for at in range(0, len(data) - width + 1, width)
    ]
