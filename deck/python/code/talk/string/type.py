"""Shared types for the talk encoding."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

Kind = Literal["consonant", "vowel", "symbol"]


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
    base: Literal["consonant", "vowel"]
    feature: str
    slot: str
    order: int
    prefix: Optional[bool] = None
    attaches: Optional[Attaches] = None


@dataclass
class Sound:
    talk: str
    ipa: str
    simple: str
    machine: str
    kind: Kind
    modifiers: list[Modifier] = field(default_factory=list)
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
class TokenEntry:
    """A frozen talk-sound to Hangul code point (token) assignment."""

    talk: str
    token: str


@dataclass
class Unit:
    """A unit the scanner can match: a base sound, an affix, or a symbol."""

    role: Literal["phone", "modifier", "symbol"]
    phone: Optional[Phone] = None
    modifier: Optional[Modifier] = None
    symbol: Optional[SymbolEntry] = None
