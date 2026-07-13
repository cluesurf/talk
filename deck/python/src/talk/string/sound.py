"""Talk to sounds."""

from __future__ import annotations

from .combine import combine
from .runtime import R
from .type import Modifier, Phone, Sound, SymbolEntry


def make_sound(base: Phone, mods: list[Modifier]) -> Sound:
    talk = combine(base.talk, mods)
    ordered = sorted(mods, key=lambda m: m.order)

    prefix = [m for m in ordered if m.prefix]
    suffix = [m for m in ordered if not m.prefix]

    ipa = (
        "".join(m.ipa for m in prefix)
        + base.ipa
        + "".join(m.ipa for m in suffix)
    )

    simple = (
        "".join(m.simple for m in prefix)
        + base.simple
        + "".join(m.simple for m in suffix)
    )

    return Sound(
        talk=talk,
        ipa=ipa,
        simple=simple,
        machine=R.machine_by_talk.get(talk, ""),
        kind=base.form,
        base=base,
        modifiers=ordered,
        raw=False,
    )


def _raw_sound(entry: SymbolEntry) -> Sound:
    return Sound(
        talk=entry.talk,
        ipa=entry.ipa,
        simple=entry.simple,
        machine=R.machine_by_talk.get(entry.talk, ""),
        kind="symbol",
        modifiers=[],
        raw=True,
    )


def segment(text: str) -> list[Sound]:
    """Split a talk string into sounds. A single starter lookup gives the base
    (or a symbol); a base then swallows the modifiers that follow it, and the
    sound is re-emitted in canonical order."""
    sounds: list[Sound] = []

    i = 0
    length = len(text)

    while i < length:
        start = R.talk_starter.match_at(text, i)

        if start is None:
            # Unknown character: carry it through so nothing is silently
            # dropped.
            ch = text[i]
            i += 1
            sounds.append(_raw_sound(SymbolEntry(ch, ch, ch)))
            continue

        i += R.talk_starter.matched_length

        if start.role == "phone":
            assert start.phone is not None
            mods: list[Modifier] = []

            while True:
                mod = R.talk_modifier.match_at(text, i)

                if mod is None:
                    break

                mods.append(mod)
                i += R.talk_modifier.matched_length

            sounds.append(make_sound(start.phone, mods))
        elif start.role == "symbol":
            assert start.symbol is not None
            sounds.append(_raw_sound(start.symbol))

    return sounds
