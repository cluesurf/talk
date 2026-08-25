"""Every valid canonical sound. Used by the token build and available to
consumers who want the full inventory."""

from __future__ import annotations

from .runtime import R
from .sound import make_sound
from .type import Modifier, Phone, SoundInfo


def _attaches(base: Phone, mod: Modifier) -> bool:
    a = mod.attaches

    if a is None:
        return True

    if a.place is not None and (base.place or "") not in a.place:
        return False

    if a.not_place is not None and (base.place or "") in a.not_place:
        return False

    if a.manner is not None and (base.manner or "") not in a.manner:
        return False

    if a.voicing is not None and (base.voicing or "") not in a.voicing:
        return False

    return True


def _slot_combos(mods: list[Modifier]) -> list[list[Modifier]]:
    """Choose none or one modifier from each slot, in every combination."""
    by_slot: dict[str, list[Modifier]] = {}

    for mod in mods:
        by_slot.setdefault(mod.slot, []).append(mod)

    combos: list[list[Modifier]] = [[]]

    for options in by_slot.values():
        nxt: list[list[Modifier]] = []

        for combo in combos:
            nxt.append(combo)

            for option in options:
                nxt.append([*combo, option])

        combos = nxt

    return combos


def enumerate_sounds() -> list[SoundInfo]:
    """Every valid canonical sound, in a stable order. Deduped by talk."""
    seen: set[str] = set()
    out: list[SoundInfo] = []

    def add(base: Phone, mods: list[Modifier]) -> None:
        sound = make_sound(base, mods)

        if sound.talk in seen:
            return

        seen.add(sound.talk)
        out.append(
            SoundInfo(
                talk=sound.talk,
                ipa=sound.ipa,
                simple=sound.simple,
                kind=sound.kind,
            )
        )

    for base in R.starter_phones:
        pool = (
            R.consonant_modifiers
            if base.form == "consonant"
            else R.vowel_modifiers
        )
        # Fine detail is left out, for the same reason it is left out of
        # the tone axes: this is the ENCODED inventory, and each detail
        # slot multiplies the cross product rather than adding to it. A
        # detail mark is still parsed, still spelled, and still reported.
        usable = [m for m in pool if not m.detail and _attaches(base, m)]

        for combo in _slot_combos(usable):
            add(base, combo)

    for symbol in R.symbols:
        if symbol.talk in seen:
            continue

        seen.add(symbol.talk)
        out.append(
            SoundInfo(
                talk=symbol.talk,
                ipa=symbol.ipa,
                simple=symbol.simple,
                kind="symbol",
            )
        )

    return out
