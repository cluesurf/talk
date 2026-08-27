"""Talk to sounds."""

from __future__ import annotations

import re

from .combine import combine
from ..space.codec import code_of
from .runtime import R, modifier_attaches, pick_modifier
from .type import NO_CODE, Modifier, Phone, Sound, SymbolEntry


class _Parsed:
    """The two fields ``code_of`` reads, without building a whole Sound."""

    __slots__ = ("base", "modifiers")

    def __init__(self, base, modifiers):
        self.base = base
        self.modifiers = modifiers


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
        machine=code_of(
            sound=_Parsed(base, ordered), type="tone", system="mesh"
        ),
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
        # A passthrough symbol is not a sound, so it has no code.
        machine=NO_CODE,
        kind="symbol",
        modifiers=[],
        pre=[],
        raw=True,
    )


def _read_run(
    run: str,
    form: str,
    base: Phone | None = None,
    loose: bool = False,
) -> list[Modifier] | None:
    """The modifiers inside one pair of brackets, or None when the contents
    are not a clean run of them.

    ORDER IS FREE ON THE WAY IN. ``combine`` writes the canonical order, so a
    stored sound has one spelling, but a person typing ``k<hw>`` and a person
    typing ``k<wh>`` mean the same thing and both should parse.

    ``base`` is the phone the run FOLLOWS, and is given only in that
    position. A run written after a base is claiming those marks belong to
    it, and a mark whose ``attaches`` rule rules that out means the claim is
    wrong: the run is really the leading run of whatever comes next.

    LOOSE IS THE LAST READING BEFORE GIVING UP. The encoder writes marks that
    have no reading for their base's form: ``iʲ`` comes back as ``i<y^>`` and
    palatalization is spelled for a consonant. Refusing left the bracket to
    leak out one raw character at a time, which is strictly worse than
    reading it as what it plainly says.
    """
    if not run:
        return None

    out: list[Modifier] = []
    at = 0

    while at < len(run):
        options = R.talk_modifier.match_at(run, at)

        if options is None:
            return None

        one = pick_modifier(options, form)

        if one is None and loose:
            one = options[0]

        if one is None:
            return None

        if base is not None and not modifier_attaches(base, one):
            return None

        out.append(one)
        at += R.talk_modifier.matched_length

    return out or None


def _run_span(text: str, at: int) -> tuple[str, int] | None:
    """The body and end of a bracketed modifier run starting at ``at``.

    A SCAN, NOT A SEARCH. Searching for the next ``>`` finds a closing
    bracket anywhere ahead, so a stray ``<`` with its match far downstream
    would swallow every sound between them. Walking forward stops at the
    first character that cannot be inside a run, so an unclosed ``<`` fails
    here and is carried through as an ordinary character.

    Runs do not nest. A ``<`` inside one is malformed, not a sub-run.
    """
    if at >= len(text) or text[at] != "<":
        return None

    index = at + 1

    while index < len(text):
        one = text[index]

        if one == ">":
            if index == at + 1:
                return None
            return text[at + 1 : index], index + 1

        if one == "<":
            return None

        index += 1

    return None


#: A binder, alone or at the end of a run it shares with modifiers.
#: ``tx<B>`` is a bare affricate and ``ts<hB>`` an aspirated one, where the
#: ``h`` belongs to the whole group. The binder is written last because it
#: acts on everything before it.
_BINDER = re.compile(r"^(.*?)B(\d*)$")


def _binder_reach(run: str) -> int | None:
    """How many sounds a binder joins, or None when the run is not a binder.

    WHY IT COUNTS BACKWARD. A tie in IPA sits BETWEEN the letters it joins,
    so ``t͡ʃ`` says nothing about how far the binding reaches. Naming the
    count instead makes a doubly-articulated ``k͡p`` and a three-part cluster
    equally sayable, and puts the binder after its material.
    """
    found = _BINDER.match(run)

    if not found:
        return None

    reach = int(found.group(2)) if found.group(2) else 2

    return reach if reach >= 2 else None


def _binder_marks(run: str) -> str:
    """The marks a binder run carries before its ``B``."""
    found = _BINDER.match(run)

    return found.group(1) if found else ""


def _bind_sounds(parts: list[Sound]) -> Sound:
    """Several sounds joined into one, as a tie does.

    THE TIE BINDS THE BASES AND THE MARKS HOIST OUT. ``t<h>x<B>`` is an
    aspirated affricate and comes back ``t͡ʃʰ``, not ``tʰ͡ʃ``. A tie says two
    LETTERS are one segment, so a mark between them breaks the thing it is
    asserting.
    """
    talk = "".join(one.talk for one in parts)
    simple = "".join(one.simple for one in parts)

    bases = [one.base.ipa if one.base else one.ipa for one in parts]
    marks = [m.ipa for one in parts for m in one.modifiers]
    pre = [m.ipa for one in parts for m in one.pre]

    ipa = "".join(pre) + "\u0361".join(bases) + "".join(marks)
    count = len(parts) if len(parts) > 2 else ""

    # ONE PAIR OF BRACKETS PER BASE, the same rule the modifiers follow. The
    # binder used to open its own pair, so an aspirated affricate came back
    # ``ts<h><B>`` with two runs on one sound. It joins the run that is
    # already there instead: ``ts<hB>``.
    bound = (
        f"{talk[:-1]}B{count}>" if talk.endswith(">") else f"{talk}<B{count}>"
    )

    return _raw_sound(SymbolEntry(bound, ipa, simple))


def segment(text: str) -> list[Sound]:
    """Split a talk string into sounds. A single starter lookup gives the base
    (or a symbol); a base then swallows the bracketed run that follows it, and
    the sound is re-emitted in canonical order."""
    sounds: list[Sound] = []

    # Modifiers seen before a base, which modify what FOLLOWS: `<h>k` is
    # pre-aspirated, `<n>d` prenasalized.
    leading: list[Modifier] = []

    i = 0
    length = len(text)

    while i < length:
        start = R.talk_starter.match_at(text, i)
        start_length = 0 if start is None else R.talk_starter.matched_length

        # A BRACKETED RUN BEFORE A BASE is the pre-modifiers, `<h>k` for
        # pre-aspirated. Read whole, so the scan below never sees a bracket.
        if start_length == 0:
            span = _run_span(text, i)

            # A BINDER TIES WHAT CAME BEFORE IT, so it is read here rather
            # than as a modifier on a following base: `tx<B>` is one
            # affricate, and there is no base after the bracket to carry it.
            if span is not None:
                body, end = span
                reach = _binder_reach(body)

                if reach is not None and len(sounds) >= reach:
                    held_parts = sounds[len(sounds) - reach :]
                    del sounds[len(sounds) - reach :]
                    sounds.append(_bind_sounds(held_parts))
                    i = end
                    continue

            if span is not None:
                body, end = span
                after = R.talk_starter.match_at(text, end)

                if after is not None and after.role == "phone":
                    assert after.phone is not None
                    held = _read_run(body, after.phone.form)

                    if held is None:
                        held = _read_run(body, after.phone.form, None, True)

                    if held:
                        leading.extend(held)
                        i = end
                        continue

        if start is None:
            # Unknown character: carry it through so nothing is silently
            # dropped.
            ch = text[i]
            i += 1
            sounds.append(_raw_sound(SymbolEntry(ch, ch, ch)))
            continue

        # `start_length` was captured BEFORE the lookahead above, because
        # `match_at` stores its result on the trie.
        i += start_length

        if start.role == "phone":
            assert start.phone is not None
            span = _run_span(text, i)

            # A BINDER SHARING THE RUN. `ts<hB>` is an aspirated affricate:
            # the marks belong to the base they follow and the `B` ties it to
            # what came before. `_bind_sounds` hoists the marks onto the
            # group, so reading them here and binding after is the same.
            if span is not None:
                body, end = span
                reach = _binder_reach(body)

                if reach is not None:
                    marks = _binder_marks(body)
                    held: list[Modifier] | None = []

                    if marks:
                        held = _read_run(marks, start.phone.form)

                        if held is None:
                            held = _read_run(marks, start.phone.form, None, True)

                    if held is not None:
                        sounds.append(make_sound(start.phone, held, leading))
                        leading = []

                        if len(sounds) >= reach:
                            parts = sounds[len(sounds) - reach :]
                            del sounds[len(sounds) - reach :]
                            sounds.append(_bind_sounds(parts))

                        i = end
                        continue

            if span is not None:
                body, end = span

                # WHOSE MARK IS IT. A run after a base usually belongs to it,
                # and `attaches` settles the cases where it might not. But the
                # rule alone is too strong: the encoder spells b̥ as `b<v->`
                # and kǃʰ as `k!<h>`, and neither mark attaches to those bases
                # by rule, so refusing outright meant the tokenizer could not
                # read back what its own encoder writes.
                #
                # A mark is only handed on when there is somewhere for it to
                # GO: the next sound has to be a phone that accepts the whole
                # run.
                fits = _read_run(body, start.phone.form, start.phone)
                held = fits

                if held is None:
                    held = _read_run(body, start.phone.form)

                if held is None:
                    held = _read_run(body, start.phone.form, None, True)

                hand_on = False

                if held is not None and fits is None:
                    after = R.talk_starter.match_at(text, end)

                    hand_on = (
                        after is not None
                        and after.role == "phone"
                        and after.phone is not None
                        and _read_run(body, after.phone.form, after.phone)
                        is not None
                    )

                if held is not None and not hand_on:
                    sounds.append(make_sound(start.phone, held, leading))
                    leading = []
                    i = end
                    continue

            sounds.append(make_sound(start.phone, [], leading))
            leading = []
        elif start.role == "symbol":
            assert start.symbol is not None
            sounds.append(_raw_sound(start.symbol))

    # A pre-modifier with nothing after it modifies nothing. Carry the
    # spelling through rather than dropping it.
    for modifier in leading:
        sounds.append(
            _raw_sound(
                SymbolEntry(modifier.talk, modifier.ipa, modifier.simple)
            )
        )

    return sounds
