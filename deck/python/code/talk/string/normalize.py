"""Fold the many ways IPA gets written down into the one this library reads.

Mirrors ``code/string/normalize.ts`` in the TypeScript port.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass

# Characters that mean the same thing as a character the parser knows, and
# are replaced one for one.
#
# WITHDRAWN SYMBOLS. ``ʆ`` and ``ʓ`` carried the palatal hook, which the IPA
# withdrew in 1989 in favour of a following superscript j.
#
# SANCTIONED ABBREVIATIONS. ``ɚ`` and ``ɝ`` are the IPA's own shorthand for a
# rhotic schwa.
#
# LOOKALIKES. A transcription typed on a normal keyboard reaches for ASCII
# ``g``, ``:`` and ``'`` where the IPA wants ``ɡ``, ``ː`` and ``ʼ``.
REPLACE: dict[str, str] = {
    # Withdrawn 1989, palatal hook.
    "ʆ": "ʃʲ",
    "ʓ": "ʒʲ",
    # IPA-sanctioned abbreviations for rhotic vowels.
    "ɚ": "ə˞",
    "ɝ": "ɜ˞",
    # ASCII lookalikes.
    "g": "ɡ",
    ":": "ː",
    "'": "ʼ",
    "?": "ʔ",
    ",": "̩",
    # Pre-aspiration, which this encoding does not separate from aspiration.
    "ʱ": "ʰ",
    # Sinological letters for the alveolo-palatal series, approximate.
    "ȵ": "ɲ",
    "ȶ": "c",
    "ȡ": "ɟ",
    "ȴ": "ʎ",
    # ARCHIPHONEMES, the one lossy choice in this table. `R` is an
    # underspecified rhotic, `N` a placeless nasal, `ᴅ` an underspecified
    # stop. Each stands for a SET of realizations the source declined to
    # choose between, so picking one asserts what the description refused
    # to. Mapped anyway, because a caller matching against a catalog needs
    # a segment rather than a failure.
    "R": "r",
    "N": "n",
    "ᴅ": "d",
}

# Superscript digits, which several sources use for tone instead of Chao
# letters. `ma³³` and `ma˧˧` are the same word.
TONE_DIGIT: dict[str, str] = {
    "1": "˩",
    "2": "˨",
    "3": "˧",
    "4": "˦",
    "5": "˥",
}

SUPERSCRIPT_DIGIT: dict[str, str] = {
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
}

# The ring above is the same feature as the ring below, voiceless. IPA uses
# the one above when a descender leaves no room underneath.
RING_ABOVE = "̊"
RING_BELOW = "̥"

# Not phonetic content: the ties binding an affricate, and the marks some
# sources use for syllable and morpheme edges.
DROP = frozenset(["͡", "͜", ".", "‿"])

# Fine phonetic detail talk does not encode, removed so the segment
# underneath still resolves. LOSSY and deliberately so.
DETAIL = frozenset(
    [
        "̤",  # breathy
        "̠",  # retracted
        "̰",  # creaky
        "̟",  # advanced
        "̺",  # apical
        "̻",  # laminal
        "̞",  # lowered
        "̈",  # centralized
        "˞",  # rhotic
        "̙",  # retracted tongue root
        "̝",  # raised
        "˔",  # raised, spacing form
        "˕",  # lowered, spacing form
        "̜",  # less rounded
        "↓",  # downstep
        "̽",  # mid-centralized
        "̹",  # more rounded
        "̘",  # advanced tongue root
        "̬",  # voiced, redundant against the base
        "̚",  # no audible release
        "̼",  # linguolabial
        # Phoible's own extensions, defined on its conventions page.
        "͈",  # fortis
        "͉",  # lenis
        "͓",  # frictionalized
        "͇",  # non-sibilant coronal
        "ᴱ",  # sphincteric phonation
    ]
)


# The canonical order for the marks that follow a base, by articulatory
# axis, innermost first.
#
# Combining marks sharing a Unicode combining class keep their input order
# under NFD, so `n̪̥` and `n̥̪` stay two strings for one sound. Worse, the
# parser matches greedily: one reads as the phone `n̪` plus voiceless, the
# other as `n̥` plus dental, giving `n$h!` and `nh!$`.
#
# Mirrors talk's modifier `order` field so an IPA string and its tone
# spelling agree on sequence. A mark absent here sorts last, by codepoint.
MARK_ORDER = [
    # Place detail, closest to the articulation itself.
    "\u032a",  # dental
    "\u033c",  # linguolabial
    "\u033a",  # apical
    "\u033b",  # laminal
    "\u031f",  # advanced
    "\u0320",  # retracted
    "\u031d",  # raised
    "\u031e",  # lowered
    "\u0308",  # centralized
    "\u033d",  # mid-centralized
    "\u0318",  # advanced tongue root
    "\u0319",  # retracted tongue root
    # Secondary articulation.
    "ʲ",
    "ˠ",
    "ˤ",
    "ᶣ",
    "ʷ",
    "\u0339",  # more rounded
    "\u031c",  # less rounded
    # Laryngeal.
    "ʰ",
    "ʱ",
    "ʼ",
    "ˀ",
    # Phonation.
    "\u0325",  # voiceless
    "\u032c",  # voiced
    "\u0324",  # breathy
    "\u0330",  # creaky
    # Manner detail and release.
    "\u0348",  # fortis
    "\u0349",  # lenis
    "\u0353",  # frictionalized
    "\u0347",  # non-sibilant
    "ⁿ",
    "ˡ",
    "\u031a",  # no audible release
    "\u02de",  # rhotic
    # Nasality, then the suprasegmentals last.
    "\u0303",
    "\u0329",  # syllabic
    "\u032f",  # non-syllabic
    "ː",
    "ˑ",
    "\u0306",  # extra-short
    "˥",
    "˦",
    "˧",
    "˨",
    "˩",
]

MARK_RANK = {mark: index for index, mark in enumerate(MARK_ORDER)}


def _rank_of(character: str) -> int:
    return MARK_RANK.get(character, len(MARK_ORDER) + ord(character))


def _is_affix(character: str) -> bool:
    return unicodedata.category(character) in ("Mn", "Lm", "Sk")


def _is_base(character: str) -> bool:
    return unicodedata.category(character).startswith("L")


def _order_marks(text: str) -> str:
    """Put the affixes following each base into canonical order.

    Only a run that FOLLOWS a base is sorted. A leading modifier is a
    different sound rather than a reordering: `ʰk` is pre-aspirated and
    `kʰ` post-aspirated, so moving one to the other would change what was
    said.
    """
    out: list[str] = []
    run: list[str] = []
    after_base = False

    def flush() -> None:
        nonlocal run
        if not run:
            return
        if after_base:
            run.sort(key=_rank_of)
        out.extend(run)
        run = []

    for character in text:
        if _is_affix(character) and (after_base or run):
            run.append(character)
            continue

        flush()
        out.append(character)
        after_base = _is_base(character)

    flush()

    return "".join(out)


@dataclass
class NormalizeIpaOptions:
    """bare_digit_tone reads bare digits as tone, off by default because a
    bare digit is ambiguous. keep_detail leaves the unencoded detail in
    place so a caller can audit what this encoding drops."""

    bare_digit_tone: bool = False
    keep_detail: bool = False


def normalize_ipa(
    text: str, options: NormalizeIpaOptions | None = None
) -> str:
    """Normalize an IPA string into the form the parser reads.

    Idempotent, and returns NFD because every combining mark in the tries is
    stored decomposed.
    """
    opts = options or NormalizeIpaOptions()

    # Two passes, because a replacement can itself contain something the
    # second pass acts on: `ɚ` expands to `ə˞`, and the rhoticity hook is
    # then dropped like any other unencoded detail.
    source: list[str] = []

    for character in text:
        digit = SUPERSCRIPT_DIGIT.get(character)

        if digit is not None:
            source.append(TONE_DIGIT[digit])
            continue

        source.append(REPLACE.get(character, character))

    out: list[str] = []

    for character in unicodedata.normalize("NFD", "".join(source)):
        if character in DROP:
            continue

        if not opts.keep_detail and character in DETAIL:
            continue

        if character == RING_ABOVE:
            out.append(RING_BELOW)
            continue

        if opts.bare_digit_tone and character in TONE_DIGIT:
            out.append(TONE_DIGIT[character])
            continue

        out.append(character)

    return _order_marks("".join(out))
