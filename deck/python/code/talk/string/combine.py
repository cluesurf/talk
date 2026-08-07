from __future__ import annotations

from .type import Modifier


def combine(
    base_talk: str,
    mods: list[Modifier],
    pre: list[Modifier] | None = None,
) -> str:
    """A sound is a base plus its modifiers in a fixed slot order, so any set
    of modifiers has exactly one talk spelling.

    ``pre`` holds the modifiers that come BEFORE the base. Position is a
    distinction, not a spelling choice: ``ʰk`` is pre-aspirated and ``kʰ``
    post-aspirated, ``ⁿd`` is prenasalized and ``dⁿ`` nasally released.
    They are different sounds, so they get different talk.
    """
    ordered = sorted(mods, key=lambda m: m.order)
    # Innermost last on the way in, so a pre-run mirrors the post-run.
    leading = sorted(pre or [], key=lambda m: -m.order)

    return (
        "".join(m.talk for m in leading)
        + base_talk
        + "".join(m.talk for m in ordered)
    )
