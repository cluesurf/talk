"""Shared types for the talk encoding."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

Kind = Literal["consonant", "vowel", "symbol"]

# The machine code space: 24 bits, so every code serializes to exactly three
# bytes and the inventory has room to grow by two orders of magnitude.
CODE_LIMIT = 0xFFFFFF

# The code for a sound with no assignment, which is anything outside the
# enumerated inventory. Distinct from code 0, which is a real sound.
NO_CODE = -1


@dataclass
class Phone:
    ipa: str
    talk: str
    xsampa: str
    simple: str
    form: Literal["consonant", "vowel"]
    place: Optional[str] = None
    manner: Optional[str] = None
    voicing: Optional[str] = None
    height: Optional[str] = None
    backness: Optional[str] = None
    roundedness: Optional[str] = None
    provisional: Optional[bool] = None


@dataclass
class Attaches:
    place: Optional[list[str]] = None
    not_place: Optional[list[str]] = None
    manner: Optional[list[str]] = None
    voicing: Optional[list[str]] = None


@dataclass
class Modifier:
    ipa: str
    talk: str
    xsampa: str
    simple: str
    base: Literal["consonant", "vowel", "any"]
    feature: str
    slot: str
    order: int
    prefix: Optional[bool] = None
    attaches: Optional[Attaches] = None
    # Fine phonetic detail: parsed and spelled, but outside the tone code
    # space.
    #
    # The IPA notation is lossless and the tone notation deliberately
    # coarser. Every mark here is real and gets reported by parse_ipa, but
    # the tone codes are budgeted at one byte for `seed` and two for
    # `band` and `mesh`, and twenty-five more axes would multiply that
    # space past both. So they contribute a spelling and never a digit,
    # and a tone string carrying one has no tone code.
    detail: Optional[bool] = None


@dataclass
class Sound:
    talk: str
    ipa: str
    simple: str
    machine: int
    kind: Kind
    modifiers: list[Modifier] = field(default_factory=list)
    #: Modifiers preceding the base: pre-aspiration, prenasalization and
    #: the like. Kept apart from ``modifiers`` because position carries
    #: meaning, ``ʰk`` and ``kʰ`` being different sounds.
    pre: list[Modifier] = field(default_factory=list)
    base: Optional[Phone] = None
    raw: Optional[bool] = None


@dataclass
class SymbolEntry:
    """A non-phonetic passthrough sound (punctuation, digit, space)."""

    talk: str
    ipa: str
    simple: str


@dataclass
class SoundInfo:
    """A canonical sound with its spellings, minus the token code point."""

    talk: str
    ipa: str
    simple: str
    kind: Kind


@dataclass
class Unit:
    """A unit the scanner can match: a base sound, an affix, or a symbol."""

    role: Literal["phone", "modifier", "symbol"]
    phone: Optional[Phone] = None
    modifier: Optional[Modifier] = None
    symbol: Optional[SymbolEntry] = None
