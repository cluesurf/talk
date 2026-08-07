"""The public conversions."""

from __future__ import annotations

from dataclasses import dataclass

from .combine import combine
from .runtime import R, nfd
from .sound import segment
from .type import Modifier, Phone, Sound, SymbolEntry


def tokenize(text: str) -> list[Sound]:
    return segment(text)


def talk_to_ipa(text: str) -> str:
    return "".join(s.ipa for s in segment(text))


def readable(text: str) -> str:
    return "".join(s.simple for s in segment(text))


def machine(text: str) -> str:
    return "".join(s.machine for s in segment(text))


def machine_outputs(text: str) -> list[str]:
    return [s.machine for s in segment(text)]


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
    symbol: SymbolEntry | None = None
    text: str | None = None


def parse_ipa(text: str) -> list[IpaUnit]:
    """Parse IPA into base sounds and their modifiers.

    ``kʰ`` is one unit: base ``k`` with the ``aspirated`` modifier. ``iː``
    is base ``i`` with ``long``. This is what a caller needs to match IPA
    against a catalog that stores base sounds and modifier flags
    separately, rather than one row per composed symbol.

    Unknown input is carried through as ``unknown`` rather than dropped,
    so the caller can see what failed instead of silently losing it.
    """
    input_text = nfd(text)
    out: list[IpaUnit] = []

    base: Phone | None = None
    mods: list[Modifier] = []
    pending: list[Modifier] = []  # prefix modifiers waiting for a base

    def flush() -> None:
        nonlocal base, mods

        if base is not None:
            out.append(
                IpaUnit(role="phone", base=base, modifiers=tuple(mods))
            )

        base = None
        mods = []

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
            elif base is not None:
                mods.append(unit.modifier)
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
            out.append(combine(unit.base.talk, list(unit.modifiers)))
        elif unit.role == "symbol":
            assert unit.symbol is not None
            out.append(unit.symbol.talk)
        else:
            assert unit.text is not None
            out.append(unit.text)

    return "".join(out)
