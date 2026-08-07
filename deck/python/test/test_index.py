import json
from importlib.resources import files

import talk
from talk import (
    normalize_ipa,
    enumerate_sounds,
    ipa_to_talk,
    machine,
    readable,
    segment,
    talk_to_ipa,
)


def _load(name):
    return json.loads((files("talk") / "base" / name).read_text("utf-8"))


PHONES = _load("phones.json")


def test_maps_every_chart_symbol_to_a_talk_spelling():
    assert [p for p in PHONES if not p["talk"]] == []


def test_maps_every_phone_ipa_back_to_its_own_talk_spelling():
    import unicodedata

    drift = []
    for p in PHONES:
        # A phone distinguished ONLY by a mark this encoding drops (the
        # raised `˔` on `ɹ̠˔`, `̝` on `ʟ̝`) collapses onto its plain base by
        # design. `normalize_ipa` changing the string is that condition.
        if normalize_ipa(p["ipa"]) != unicodedata.normalize("NFD", p["ipa"]):
            continue

        got = ipa_to_talk(p["ipa"])
        if got != p["talk"]:
            drift.append(f'{p["ipa"]}: {got} != {p["talk"]}')
    assert drift == []


def test_one_code_point_per_phone():
    bad = [p["talk"] for p in PHONES if len(machine(text=p["talk"], type="tone", system="mesh")) != 1]
    assert bad == []


def test_one_code_point_per_enumerated_sound():
    bad = [s.talk for s in enumerate_sounds() if len(machine(text=s.talk, type="tone", system="mesh")) != 1]
    assert bad == []


def test_never_gives_two_sounds_the_same_code():
    # The registry is gone, so this checks the COMPUTED codes are still a
    # bijection: what `tokens.json` used to guarantee by construction now
    # has to hold by arithmetic.
    seen = {}
    dupes = []

    for sound in talk.enumerate_sounds():
        codes = talk.machine(text=sound.talk, type="tone", system="mesh")

        if not codes or codes[0] < 0:
            continue

        prior = seen.get(codes[0])

        if prior is not None and prior != sound.talk:
            dupes.append(f"{prior} and {sound.talk} both -> {codes[0]}")
        else:
            seen[codes[0]] = sound.talk

    assert dupes == []


def test_ipa_to_talk_to_ipa_is_stable():
    for w in ["tʰa", "kʷasˤo", "ˈmama", "ãtu", "sˤuːl", "nʲokʰ"]:
        t = ipa_to_talk(w)
        assert ipa_to_talk(talk_to_ipa(t)) == t


def test_canonicalizes_modifier_order():
    assert ipa_to_talk("tʰʷ") == ipa_to_talk("tʷʰ")


def test_default_namespace_exposes_the_conversions():
    assert talk.ipa_to_talk("tʰ") == "th~"
    assert talk.talk_to_ipa("th~") == "tʰ"
    assert talk.readable("th~") == "tʰ"
    assert len(talk.machine(text="th~", type="tone", system="mesh")) == 1


def test_tokenizes_into_sounds_with_features():
    first = segment("th~a")[0]
    assert first.base.talk == "t"
    assert [m.feature for m in first.modifiers] == ["aspirated"]


def test_carries_symbols_and_numerals_through():
    assert readable("\\. 7") == ". 7"
