"""Fold the many ways IPA gets written down into the one this library reads.

Mirrors ``code/string/normalize.ts`` in the TypeScript port.

The tables here are the whole of it. A caller reading IPA from many
sources needs the same folding a caller reading one source needs, plus the
things only a messy source does, and splitting those across two
implementations is how they drift.

Where a comment gives a count, it was measured across 3,896,910 IPA
strings drawn from several hundred sources rather than reasoned about.
"""

from __future__ import annotations

import re
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
    # Sinological letters for the alveolo-palatal series, written as the
    # palatal plus the advancing mark. `ȵ` is nearer `ɲ̟` than `ɲ`, and the
    # advancement now has a modifier to land on, so it is kept.
    "ȵ": "ɲ̟",
    "ȶ": "c̟",
    "ȡ": "ɟ̟",
    "ȴ": "ʎ̟",
    # GREEK LETTERS THAT ARE NOT IPA.
    #
    # Three Greek letters ARE official IPA and are deliberately absent:
    # β the voiced bilabial fricative, θ the voiceless dental, and χ the
    # voiceless uvular. Together they account for 166,790 uses across 171
    # languages, so folding them would rewrite correct transcription.
    "γ": "ɣ",  # U+03B3 -> U+0263 voiced velar fricative, 26 uses
    "δ": "ð",  # U+03B4 -> U+00F0 voiced dental fricative, 77 uses
    "ϕ": "ɸ",  # U+03D5 -> U+0278 voiceless bilabial fricative
    "ε": "ɛ",  # U+03B5 -> U+025B open-mid front unrounded
    "ι": "ɪ",  # U+03B9 -> U+026A near-close near-front unrounded
    "υ": "ʊ",  # U+03C5 -> U+028A near-close near-back rounded
    "α": "ɑ",  # U+03B1 -> U+0251 open back unrounded
    # φ is the ambiguous one and IS folded: every observed use is the
    # bilabial fricative. λ is deliberately NOT folded, because
    # Americanist notation uses it for `tɬ` and other sources for `ʎ`.
    "φ": "ɸ",
    # CYRILLIC LOOKALIKES. `ӕ` renders identically to the Latin `æ` IPA
    # wants. 83 uses, all in one language.
    "ӕ": "æ",  # U+04D5 -> U+00E6
    "Ӕ": "Æ",
    # TYPOGRAPHIC QUOTES. A source that ran through a word processor has
    # the curly apostrophe where IPA wants the ejective mark. 570 uses.
    "\u2019": "ʼ",
    "\u2018": "ʼ",
    "`": "ʼ",
    "´": "ʼ",
    '"': "ˈ",  # ASCII double quote -> primary stress
}

# Characters carrying nothing recoverable, removed before anything else.
#
# PRIVATE USE AREA. A font assigns these whatever glyph it likes and no two
# agree, so a source using one meant a symbol its own font drew and nothing
# downstream can know which. 98 such characters were observed in five
# languages.
PRIVATE_USE = re.compile(
    "[\ue000-\uf8ff]|[\U000f0000-\U000ffffd]|[\U00100000-\U0010fffd]"
)

# Delimiters WRAPPING the whole string, which say what kind of
# transcription it is rather than form part of it. 6,903 uses across four
# languages.
#
# Stripped only when they wrap. A slash INSIDE a string separates two
# readings, and cutting it would join them into a word that is neither.
WRAPPING_DELIMITER = re.compile(r"^\s*([/\[])(.+)([/\]])\s*$", re.DOTALL)

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

# Fine phonetic detail used to be stripped here so the segment underneath
# still resolved. It no longer is, and there is no option to bring it back.
#
# Every mark that was dropped now has an entry in modifiers.json, so `b̤`
# reads as `b` plus breathy and a caller sees the feature instead of
# losing it. Breathy voice is contrastive across South Asia and creaky
# voice across Mesoamerica, so the old default merged phonemes that
# contrast.
#
# A caller wanting `b̤` to MATCH `b` wants the tone encoding, which is
# coarse by design and gives both the same code.


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
    # Part of a base's own spelling rather than a mark on it, so it sorts
    # innermost and stays next to the letter it belongs to. `ç` is one
    # phone, and sorting any other mark inside it splits it into `c` plus a
    # cedilla the tries have never heard of.
    "\u0327",  # cedilla
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
    "ᴱ",  # sphincteric
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
    "↓",  # downstep, which lowers the register of everything after it
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
    bare digit is ambiguous: `a1` is a tone in one source and an index in
    another. Superscript digits are unambiguous and always converted."""

    bare_digit_tone: bool = False


def normalize_ipa(
    text: str, options: NormalizeIpaOptions | None = None
) -> str:
    """Normalize an IPA string into the form the parser reads.

    Idempotent, and returns NFD because every combining mark in the tries is
    stored decomposed.
    """
    opts = options or NormalizeIpaOptions()

    # Before anything else: drop the private-use characters no reader can
    # resolve, and unwrap the delimiters that say what kind of
    # transcription this is. Both are about the string rather than in it.
    stripped = PRIVATE_USE.sub("", text)
    wrapped = WRAPPING_DELIMITER.match(stripped)
    bare = wrapped.group(2) if wrapped else stripped

    # Two passes, because a replacement can itself contain something the
    # second pass acts on: `ȵ` expands to `ɲ̟`, and the advancing mark then
    # has to decompose and sort with the rest of its run.
    source: list[str] = []

    for character in bare:
        digit = SUPERSCRIPT_DIGIT.get(character)

        if digit is not None:
            source.append(TONE_DIGIT[digit])
            continue

        source.append(REPLACE.get(character, character))

    out: list[str] = []

    for character in unicodedata.normalize("NFD", "".join(source)):
        if character in DROP:
            continue

        if character == RING_ABOVE:
            out.append(RING_BELOW)
            continue

        if opts.bare_digit_tone and character in TONE_DIGIT:
            out.append(TONE_DIGIT[character])
            continue

        out.append(character)

    return _order_marks("".join(out))
