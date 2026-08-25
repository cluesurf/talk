"""The public conversions."""

from __future__ import annotations

from dataclasses import dataclass

from .combine import combine
from .normalize import NormalizeIpaOptions, normalize_ipa
from .runtime import R, modifier_attaches, nfd
from .sound import segment
from .type import CODE_LIMIT, Modifier, Phone, Sound, SymbolEntry


def tokenize(text: str) -> list[Sound]:
    return segment(text)


def talk_to_ipa(text: str) -> str:
    return "".join(s.ipa for s in segment(text))


def readable(text: str) -> str:
    return "".join(s.simple for s in segment(text))


def machine(text: str) -> list[int]:
    """Encode as machine codes, one 24-bit integer per sound.

    A sound outside the enumerated inventory yields ``NO_CODE``, so the list
    always has one entry per sound and a caller can see what failed instead
    of silently losing a position.
    """
    return [s.machine for s in segment(text)]


def machine_bytes(text: str) -> bytes:
    """Encode as machine codes packed to three bytes each, big-endian.

    A code is 24 bits by construction, so the buffer is exactly three times
    the sound count with no framing needed. ``NO_CODE`` has no three-byte
    form, so an unassigned sound is written as ``CODE_LIMIT``.
    """
    out = bytearray()

    for raw in machine(text):
        code = CODE_LIMIT if raw < 0 else raw
        out.append((code >> 16) & 0xFF)
        out.append((code >> 8) & 0xFF)
        out.append(code & 0xFF)

    return bytes(out)


def machine_codes(data: bytes) -> list[int]:
    """Decode a three-byte-per-code buffer back into machine codes."""
    return [
        (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]
        for i in range(0, len(data) - 2, 3)
    ]


# The block machine text encodes into: 4,096 contiguous CJK ideographs
# starting at U+4E00. Printable, no control characters, no combining marks
# and no case folding, so a database can hold it in an ordinary text column
# and index it with trigrams.
_TEXT_BASE = 0x4E00
_TEXT_SHIFT = 12
_TEXT_MASK = 0xFFF


def machine_text(text: str) -> str:
    """Encode as machine text: two characters per sound, fixed width.

    A fixed width per sound is what makes prefix and substring search
    meaningful, since a match on a character boundary is always a match on a
    sound boundary.
    """
    out: list[str] = []

    for raw in machine(text):
        code = CODE_LIMIT if raw < 0 else raw
        out.append(chr(_TEXT_BASE + ((code >> _TEXT_SHIFT) & _TEXT_MASK)))
        out.append(chr(_TEXT_BASE + (code & _TEXT_MASK)))

    return "".join(out)


def machine_text_codes(text: str) -> list[int]:
    """Decode machine text back into machine codes."""
    return [
        ((ord(text[i]) - _TEXT_BASE) << _TEXT_SHIFT)
        | (ord(text[i + 1]) - _TEXT_BASE)
        for i in range(0, len(text) - 1, 2)
    ]


@dataclass(frozen=True)
class IpaUnit:
    """One unit of parsed IPA: a sound, a passthrough symbol, or unknown input.

    ``base`` carries the Phone matched from the IPA trie DIRECTLY, not one
    recovered from a talk spelling. That distinction matters: talk is a
    deliberately coarse encoding and several IPA vowels share a code
    (``ɨ``, ``y`` and ``ʏ`` are all ``i$``; six vowels are ``O``). Going
    IPA -> talk -> Phone therefore loses the exact vowel, while this keeps
    it.
    """

    role: str  # "phone" | "symbol" | "unknown"
    base: Phone | None = None
    modifiers: tuple[Modifier, ...] = ()
    #: Modifiers preceding the base: pre-aspiration, prenasalization and
    #: the like. Position carries meaning, ``ʰk`` and ``kʰ`` differing.
    pre: tuple[Modifier, ...] = ()
    symbol: SymbolEntry | None = None
    text: str | None = None


#: Stands in when the lookahead finds nothing, so the role test below has
#: something to read.
_NOT_PHONE = IpaUnit(role="unknown")


def parse_ipa(
    text: str, options: NormalizeIpaOptions | None = None
) -> list[IpaUnit]:
    """Parse IPA into base sounds and their modifiers.

    ``kʰ`` is one unit: base ``k`` with the ``aspirated`` modifier. ``iː``
    is base ``i`` with ``long``. This is what a caller needs to match IPA
    against a catalog that stores base sounds and modifier flags
    separately, rather than one row per composed symbol.

    Unknown input is carried through as ``unknown`` rather than dropped,
    so the caller can see what failed instead of silently losing it.

    ``options`` is passed to ``normalize_ipa``.
    """
    input_text = normalize_ipa(text, options)
    out: list[IpaUnit] = []

    base: Phone | None = None
    mods: list[Modifier] = []
    pre: list[Modifier] = []
    pending: list[Modifier] = []  # prefix modifiers waiting for a base
    leading: list[Modifier] = []  # pre-modifiers waiting for a base

    def flush() -> None:
        nonlocal base, mods, pre

        if base is not None:
            out.append(
                IpaUnit(
                    role="phone",
                    base=base,
                    modifiers=tuple(mods),
                    pre=tuple(pre),
                )
            )

        base = None
        mods = []
        pre = []

    i = 0
    length = len(input_text)

    while i < length:
        unit = R.ipa_unit.match_at(input_text, i)

        if unit is None:
            flush()
            out.append(IpaUnit(role="unknown", text=input_text[i]))
            i += 1
            continue

        i += R.ipa_unit.matched_length

        if unit.role == "phone":
            # A base begins a new sound. A held stress mark belongs on the
            # vowel of the syllable, so it skips any onset consonants and
            # lands on the next vowel.
            flush()
            base = unit.phone
            pre = leading
            leading = []
            if base.form == "vowel":
                mods = pending
                pending = []
            else:
                mods = []
        elif unit.role == "modifier":
            assert unit.modifier is not None
            if unit.modifier.prefix:
                # Attaches to the following base (stress precedes the vowel).
                flush()
                pending.append(unit.modifier)
            elif base is not None and (
                modifier_attaches(base, unit.modifier)
                # Attachment breaks a tie rather than rejecting: without a
                # base ahead that can carry the mark, it stays here.
                or (R.ipa_unit.match_at(input_text, i) or _NOT_PHONE).role
                != "phone"
            ):
                mods.append(unit.modifier)
            else:
                # Either nothing precedes it, or what precedes it cannot
                # carry it. Both mean the mark belongs to what FOLLOWS:
                # `ʰk` is pre-aspirated, `aʰk` is `a` then `ʰk`.
                leading.append(unit.modifier)
        else:
            assert unit.symbol is not None
            flush()
            out.append(IpaUnit(role="symbol", symbol=unit.symbol))

    flush()

    return out


def ipa_to_talk(text: str) -> str:
    """IPA to talk spelling.

    The same walk as :func:`parse_ipa`, rendered. Kept as one scanner so
    the two cannot drift.
    """
    out: list[str] = []

    for unit in parse_ipa(text):
        if unit.role == "phone":
            assert unit.base is not None
            out.append(
                combine(
                    unit.base.talk,
                    list(unit.modifiers),
                    list(unit.pre),
                )
            )
        elif unit.role == "symbol":
            assert unit.symbol is not None
            out.append(unit.symbol.talk)
        else:
            assert unit.text is not None
            out.append(unit.text)

    return "".join(out)
