from __future__ import annotations

from .type import Modifier


def combine(base_talk: str, mods: list[Modifier]) -> str:
    """A sound is a base plus its modifiers in a fixed slot order, so any set
    of modifiers has exactly one talk spelling."""
    ordered = sorted(mods, key=lambda m: m.order)

    return base_talk + "".join(m.talk for m in ordered)
