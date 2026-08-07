"""Talk to sounds."""

from __future__ import annotations

from .combine import combine
from .runtime import R, modifier_attaches, pick_modifier
from .type import NO_CODE, Modifier, Phone, Sound, SymbolEntry


def make_sound(
    base: Phone,
    mods: list[Modifier],
    pre: list[Modifier] | None = None,
) -> Sound:
    talk = combine(base.talk, mods, pre)
    ordered = sorted(mods, key=lambda m: m.order)
    leading = sorted(pre or [], key=lambda m: -m.order)

    prefix = [m for m in ordered if m.prefix]
    suffix = [m for m in ordered if not m.prefix]

    ipa = (
        "".join(m.ipa for m in leading)
        + "".join(m.ipa for m in prefix)
        + base.ipa
        + "".join(m.ipa for m in suffix)
    )

    simple = (
        "".join(m.simple for m in leading)
        + "".join(m.simple for m in prefix)
        + base.simple
        + "".join(m.simple for m in suffix)
    )

    return Sound(
        talk=talk,
        ipa=ipa,
        simple=simple,
        machine=R.machine_by_talk.get(talk, NO_CODE),
        kind=base.form,
        base=base,
        modifiers=ordered,
        pre=leading,
        raw=False,
    )


def _raw_sound(entry: SymbolEntry) -> Sound:
    return Sound(
        talk=entry.talk,
        ipa=entry.ipa,
        simple=entry.simple,
        machine=R.machine_by_talk.get(entry.talk, NO_CODE),
        kind="symbol",
        modifiers=[],
        pre=[],
        raw=True,
    )


def segment(text: str) -> list[Sound]:
    """Split a talk string into sounds. A single starter lookup gives the base
    (or a symbol); a base then swallows the modifiers that follow it, and the
    sound is re-emitted in canonical order."""
    sounds: list[Sound] = []

    # Modifiers seen before a base, which modify what FOLLOWS: `h~k` is
    # pre-aspirated, `n~d` prenasalized. No affix spelling is also a
    # starter spelling, so a modifier match here is unambiguous; where both
    # match, the longer one wins, as everywhere else in the scan.
    leading: list[Modifier] = []

    i = 0
    length = len(text)

    while i < length:
        start = R.talk_starter.match_at(text, i)
        start_length = 0 if start is None else R.talk_starter.matched_length

        ahead = R.talk_modifier.match_at(text, i)
        ahead_length = 0 if ahead is None else R.talk_modifier.matched_length

        if ahead is not None and ahead_length > start_length:
            # Only a pre-modifier if a base actually follows AND can carry
            # it. Without the first check the longer match wins too
            # eagerly: `h!!` is `h` with extra-short, but `h!` is also the
            # voiceless affix, and taking it would leave a stray `!`.
            after = R.talk_starter.match_at(text, i + ahead_length)

            if after is not None and after.role == "phone":
                assert after.phone is not None
                modifier = pick_modifier(ahead, after.phone.form)

                if modifier is not None and modifier_attaches(
                    after.phone, modifier
                ):
                    leading.append(modifier)
                    i += ahead_length
                    continue

        if start is None:
            # Unknown character: carry it through so nothing is silently
            # dropped.
            ch = text[i]
            i += 1
            sounds.append(_raw_sound(SymbolEntry(ch, ch, ch)))
            continue

        # `start_length` was captured BEFORE the lookahead above, because
        # `match_at` stores its result on the trie: probing for a base
        # after a candidate pre-modifier overwrites `matched_length`, and
        # reading it here would advance by the wrong amount, sometimes by
        # zero.
        i += start_length

        if start.role == "phone":
            assert start.phone is not None
            mods: list[Modifier] = []

            while True:
                options = R.talk_modifier.match_at(text, i)

                if options is None:
                    break

                # A spelling can mean different things by base form (`@` is
                # non-syllabic on a vowel, syllabic on a consonant), so the
                # base decides which reading applies. A spelling with no
                # reading for this form is not an affix here.
                mod = pick_modifier(options, start.phone.form)

                if mod is None:
                    break

                # Attachment breaks a TIE here; it does not reject. The
                # rules keep the enumeration conservative, and a parser
                # enforcing them would refuse valid input wherever a
                # phone's features are incomplete. So a mark moves to the
                # following base only when that base can carry it and this
                # one cannot.
                if not modifier_attaches(start.phone, mod):
                    after = R.talk_starter.match_at(
                        text, i + R.talk_modifier.matched_length
                    )

                    if (
                        after is not None
                        and after.role == "phone"
                        and after.phone is not None
                        and modifier_attaches(after.phone, mod)
                    ):
                        break

                mods.append(mod)
                i += R.talk_modifier.matched_length

            sounds.append(make_sound(start.phone, mods, leading))
            leading = []
        elif start.role == "symbol":
            assert start.symbol is not None
            sounds.append(_raw_sound(start.symbol))

    # A pre-modifier with nothing after it modifies nothing. Carry the
    # spelling through rather than dropping it, so a caller sees the input
    # was incomplete instead of losing it.
    for modifier in leading:
        sounds.append(
            _raw_sound(
                SymbolEntry(modifier.talk, modifier.ipa, modifier.simple)
            )
        )

    return sounds
