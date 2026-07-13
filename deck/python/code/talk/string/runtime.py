"""The runtime state: every lookup the conversions need, built once."""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass

from ..trie import Trie, TrieBuilder, build_trie
from .data import modifiers, phones, token_entries
from .symbol import build_symbols
from .type import Modifier, Phone, SymbolEntry, Unit


@dataclass
class Runtime:
    symbols: list[SymbolEntry]
    consonant_modifiers: list[Modifier]
    vowel_modifiers: list[Modifier]
    # Sound starters (a base or a symbol), keyed by talk.
    talk_starter: Trie[Unit]
    # Affixes, keyed by talk. Matched only after a base, because a modifier
    # like `h~` shares its spelling with the base `h~` (ɦ), so which one is
    # meant depends on position.
    talk_modifier: Trie[Modifier]
    # Every unit keyed by IPA. IPA has no base/affix spelling clash, so one
    # trie scans the whole string.
    ipa_unit: Trie[Unit]
    machine_by_talk: dict[str, str]


def nfd(text: str) -> str:
    """Normalize so precomposed and combining IPA forms match the same keys."""
    return unicodedata.normalize("NFD", text)


def _rank(phone: Phone) -> tuple[int, int, int]:
    """Rank a phone as a talk-spelling representative (lower is plainer): a
    real (non-provisional) sound, the shortest IPA, ideally spelled the same
    in IPA and talk."""
    return (
        1 if phone.provisional else 0,
        len(nfd(phone.ipa)),
        0 if phone.ipa == phone.talk else 1,
    )


def _pick_representatives() -> list[Phone]:
    """One representative phone per talk spelling (talk -> ipa is many to one),
    so decomposing a sound picks its plainest base."""
    by_talk: dict[str, Phone] = {}

    for phone in phones:
        current = by_talk.get(phone.talk)

        if current is None:
            by_talk[phone.talk] = phone
            continue

        if _rank(phone) < _rank(current):
            by_talk[phone.talk] = phone

    return list(by_talk.values())


def _bootstrap() -> Runtime:
    symbols = build_symbols()

    starter: TrieBuilder[Unit] = TrieBuilder()

    for phone in _pick_representatives():
        starter.add(phone.talk, Unit(role="phone", phone=phone))

    for symbol in symbols:
        starter.add(symbol.talk, Unit(role="symbol", symbol=symbol))

    ipa: TrieBuilder[Unit] = TrieBuilder()

    for phone in phones:
        ipa.add(nfd(phone.ipa), Unit(role="phone", phone=phone))

    for modifier in modifiers:
        if modifier.ipa:
            ipa.add(nfd(modifier.ipa), Unit(role="modifier", modifier=modifier))

    for symbol in symbols:
        ipa.add(nfd(symbol.ipa), Unit(role="symbol", symbol=symbol))

    machine_by_talk: dict[str, str] = {}

    for entry in token_entries:
        machine_by_talk[entry.talk] = entry.token

    return Runtime(
        symbols=symbols,
        consonant_modifiers=[m for m in modifiers if m.base == "consonant"],
        vowel_modifiers=[m for m in modifiers if m.base == "vowel"],
        talk_starter=starter.build(),
        talk_modifier=build_trie([(m.talk, m) for m in modifiers]),
        ipa_unit=ipa.build(),
        machine_by_talk=machine_by_talk,
    )


R = _bootstrap()
