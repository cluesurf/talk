"""Dense integer codes for every tier of both notations.

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


def _layout_for(notation: Notation, tier: Tier) -> Layout:
    """The offset table for a tier, built once."""
    key = f"{notation}:{tier}"

    if key in _LAYOUTS:
        return _LAYOUTS[key]

    bases = model_for(notation).bases
    axes = axes_for(notation, tier)

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


def size_of(*, notation: Notation, tier: Tier) -> int:
    """How many codes a tier has, which is the producible count."""
    if tier == "seed":
        return len(model_for(notation).units)

    return _layout_for(notation, tier).size


def byte_width(*, notation: Notation, tier: Tier) -> int:
    """Bytes one code needs, so a caller can pack to a fixed width.

    Sized to the tier rather than to a single global width, since ``tone
    seed`` fits in one byte and ``ipa mesh`` needs four.
    """
    size = max(2, size_of(notation=notation, tier=tier))
    bits = (size - 1).bit_length()

    return max(1, min(4, -(-bits // 8)))


def encode_unit(
    *, composition: Composition, notation: Notation, tier: Tier
) -> int:
    """Turn a composition into its code.

    Raises on a base or mark the tier does not hold, because a silent
    fallback would put a wrong sound at a real code.
    """
    if tier == "seed":
        units = model_for(notation).units

        if composition.base not in units:
            raise ValueError(f"unknown seed unit {composition.base}")

        return units.index(composition.base)

    layout = _layout_for(notation, tier)

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


def decode_unit(*, code: int, notation: Notation, tier: Tier) -> Composition:
    """Turn a code back into its composition."""
    if tier == "seed":
        units = model_for(notation).units

        if code < 0 or code >= len(units):
            raise ValueError(f"code {code} out of range")

        return Composition(base=units[code], marks=[])

    layout = _layout_for(notation, tier)

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


def pack(*, codes: list[int], notation: Notation, tier: Tier) -> bytes:
    """Pack codes to the tier's fixed byte width, big-endian."""
    width = byte_width(notation=notation, tier=tier)
    out = bytearray()

    for code in codes:
        out.extend(code.to_bytes(width, "big"))

    return bytes(out)


def unpack(*, data: bytes, notation: Notation, tier: Tier) -> list[int]:
    """Read codes back from a fixed-width buffer."""
    width = byte_width(notation=notation, tier=tier)

    return [
        int.from_bytes(data[at : at + width], "big")
        for at in range(0, len(data) - width + 1, width)
    ]
