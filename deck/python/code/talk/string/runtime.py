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
    # One phone per talk spelling: the base inventory a talk string can
    # decompose into.
    base_phones: list[Phone]
    # The phones that BEGIN a sound: base_phones minus the ones already
    # reachable as another phone plus modifiers. The scanner and the
    # enumeration both work from this, so a sound has exactly one spelling
    # and that spelling re-parses to itself.
    starter_phones: list[Phone]
    consonant_modifiers: list[Modifier]
    vowel_modifiers: list[Modifier]
    # Sound starters (a base or a symbol), keyed by talk.
    talk_starter: Trie[Unit]
    # Affixes, keyed by talk. Matched only after a base, because a modifier
    # like `h~` shares its spelling with the base `h~` (ɦ), so which one is
    # meant depends on position.
    # The value is every modifier sharing that spelling, because one talk
    # affix can mean different things on a consonant and on a vowel. `@` is
    # syllabicity flipped away from the default: a vowel is syllabic unless
    # marked, a consonant is not, so `@` reads as non-syllabic on `i@` and
    # syllabic on `n@`. The base's form picks between them.
    talk_modifier: Trie[list[Modifier]]
    # Every unit keyed by IPA. IPA has no base/affix spelling clash, so one
    # trie scans the whole string.
    ipa_unit: Trie[Unit]
    machine_by_talk: dict[str, int]


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


def modifier_attaches(base: Phone, mod: Modifier) -> bool:
    """Whether a modifier can attach to a base, per its ``attaches`` rule.

    This is what decides an otherwise ambiguous sequence. ``pʰk`` is
    ``pʰ`` then ``k``, because a plosive takes aspiration. ``aʰk`` is
    ``a`` then ``ʰk``, because a vowel does not, so the mark must belong
    to what follows.
    """
    rule = mod.attaches

    if rule is None:
        return True
    if rule.place is not None and (base.place or "") not in rule.place:
        return False
    if rule.not_place is not None and (base.place or "") in rule.not_place:
        return False
    if rule.manner is not None and (base.manner or "") not in rule.manner:
        return False
    if rule.voicing is not None and (base.voicing or "") not in rule.voicing:
        return False

    return True


def _by_talk_spelling(items: list[Modifier]) -> list[tuple[str, list[Modifier]]]:
    """Group modifiers by talk spelling, so a spelling meaning one thing on a
    consonant and another on a vowel keeps both readings."""
    grouped: dict[str, list[Modifier]] = {}

    for modifier in items:
        grouped.setdefault(modifier.talk, []).append(modifier)

    return list(grouped.items())


def pick_modifier(
    options: list[Modifier], form: str
) -> Modifier | None:
    """Pick the reading of a talk affix that fits the base it follows. An
    ``any`` modifier applies to either form, so it is the fallback."""
    for modifier in options:
        if modifier.base == form:
            return modifier

    for modifier in options:
        if modifier.base == "any":
            return modifier

    return None


# Longest first, so a two-character affix is tried before its prefix.
_AFFIX_SPELLINGS = sorted(
    _by_talk_spelling(modifiers), key=lambda pair: -len(pair[0])
)


def _spell_ipa(base: Phone, mods: list[Modifier]) -> str:
    """The IPA a base plus modifiers spells, in the modifiers' declared
    order. Mirrors ``_spell`` in convert, kept here because runtime builds
    first."""
    ordered = sorted(mods, key=lambda m: m.order)

    return (
        "".join(m.ipa for m in ordered if m.prefix)
        + base.ipa
        + "".join(m.ipa for m in ordered if not m.prefix)
    )


def _reconstructible(phone: Phone, by_talk: dict[str, Phone]) -> bool:
    """Whether a phone's talk spelling is already reachable as another phone
    plus modifiers.

    Many phones are spelled compositionally: `p!` is `p` with the ejective
    affix, `mh!` is `m` with voiceless, `n$` is `n` with dental. Listing
    those as sound STARTERS makes segmentation ambiguous, because a starter
    is matched greedily and swallows an affix the next modifier needed.

    Such a phone stays in the IPA trie and in the enumerated inventory. It
    just does not begin a sound on its own.
    """
    for candidate_talk, candidate in by_talk.items():
        if candidate_talk == phone.talk:
            continue

        if not phone.talk.startswith(candidate_talk):
            continue

        rest = phone.talk[len(candidate_talk) :]
        found: list[Modifier] = []
        progressed = True

        while rest and progressed:
            progressed = False

            for affix, options in _AFFIX_SPELLINGS:
                if not rest.startswith(affix):
                    continue

                modifier = pick_modifier(options, candidate.form)

                if modifier is None:
                    continue

                found.append(modifier)
                rest = rest[len(affix) :]
                progressed = True
                break

        if rest:
            continue

        # The spelling decomposes, but that only makes the phone REDUNDANT
        # if the composition also names the same sound. `y$` decomposes into
        # `y` plus dental, yet the phone is ɥ, so it is a sound in its own
        # right and has to keep starting one.
        if nfd(_spell_ipa(candidate, found)) == nfd(phone.ipa):
            return True

    return False


def _bootstrap() -> Runtime:
    symbols = build_symbols()

    base_phones = _pick_representatives()

    starter: TrieBuilder[Unit] = TrieBuilder()

    by_talk = {p.talk: p for p in base_phones}
    starter_phones = [p for p in base_phones if not _reconstructible(p, by_talk)]

    for phone in starter_phones:
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

    machine_by_talk: dict[str, int] = {}

    for entry in token_entries:
        machine_by_talk[entry.talk] = entry.code

    return Runtime(
        symbols=symbols,
        base_phones=base_phones,
        starter_phones=starter_phones,
        consonant_modifiers=[
            m for m in modifiers if m.base in ("consonant", "any")
        ],
        vowel_modifiers=[m for m in modifiers if m.base in ("vowel", "any")],
        talk_starter=starter.build(),
        talk_modifier=build_trie(_by_talk_spelling(modifiers)),
        ipa_unit=ipa.build(),
        machine_by_talk=machine_by_talk,
    )


R = _bootstrap()
