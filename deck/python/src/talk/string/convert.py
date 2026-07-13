"""The public conversions."""

from __future__ import annotations

from .combine import combine
from .runtime import R, nfd
from .sound import segment
from .type import Modifier, Phone, Sound


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


def ipa_to_talk(text: str) -> str:
    input_text = nfd(text)
    out: list[str] = []

    base: Phone | None = None
    mods: list[Modifier] = []
    pending: list[Modifier] = []  # prefix modifiers waiting for a base

    def flush() -> None:
        nonlocal base, mods

        if base is not None:
            out.append(combine(base.talk, mods))

        base = None
        mods = []

    i = 0
    length = len(input_text)

    while i < length:
        unit = R.ipa_unit.match_at(input_text, i)

        if unit is None:
            # Unknown IPA: carry it through.
            flush()
            out.append(input_text[i])
            i += 1
            continue

        i += R.ipa_unit.matched_length

        if unit.role == "phone":
            # A base begins a new sound.
            flush()
            base = unit.phone
            mods = pending
            pending = []
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
            out.append(unit.symbol.talk)

    flush()

    return "".join(out)
