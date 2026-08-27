from __future__ import annotations

from .type import Modifier


def combine(
    base_talk: str,
    mods: list[Modifier],
    pre: list[Modifier] | None = None,
) -> str:
    """A sound is a base plus its modifiers in a fixed slot order, so any set
    of modifiers has exactly one talk spelling.

    THE MODIFIERS SHARE ONE PAIR OF BRACKETS. ``kʷʰ`` is ``k<wh>``, not
    ``k<w><h>``. Repeating the brackets per mark costs two characters each
    and says nothing extra: the run belongs to one base either way, and the
    contents are uniquely decodable, so the reader needs no separator to
    know where one mark ends and the next begins.

    WHY BRACKETS AT ALL. The marks used to be bare sigils and a run of them
    could not always be segmented back. Chao tone levels were ``++ + * - --``,
    so ``fu+++`` was both ``fu˥˦`` and ``fu˦˥`` and the reader had to guess: a
    rise read back as a fall. Delimiting the run ends the whole class of
    defect rather than the one instance of it, and ``()``, ``[]`` and ``{}``
    stay free for the regular expressions the search surface uses.

    ``pre`` holds the modifiers that come BEFORE the base, in their own
    brackets. Position is a distinction, not a spelling choice: ``ʰk`` is
    pre-aspirated and ``kʰ`` post-aspirated, ``ⁿd`` is prenasalized and
    ``dⁿ`` nasally released. They are different sounds, so they get
    different talk.
    """
    ordered = sorted(mods, key=lambda m: m.order)
    # Innermost last on the way in, so a pre-run mirrors the post-run.
    leading = sorted(pre or [], key=lambda m: -m.order)

    return (
        _wrap("".join(m.talk for m in leading))
        + base_talk
        + _wrap("".join(m.talk for m in ordered))
    )


def _wrap(run: str) -> str:
    """A run of modifier tokens, bracketed, or nothing when the run is empty."""
    return f"<{run}>" if run else ""
