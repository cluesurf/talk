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


def test_keeps_tone_runs_in_source_order():
    """A tone contour is a SEQUENCE, and the run used to be sorted by pitch.

    `˩˩˦` is a rise and `˦˩˩` is a fall, spelled with the same three letters.
    Sorting them turned every rise into a fall across the corpus and the
    original could not be recovered.
    """
    # Thai, rising.
    assert normalize_ipa("la˦˥") == "la˦˥"
    assert normalize_ipa("tʰaːn˩˩˦") == "tʰaːn˩˩˦"
    assert normalize_ipa("muːn˧la˦˥tʰaːn˩˩˦") == "muːn˧la˦˥tʰaːn˩˩˦"

    # Mandarin third tone, a dip to the bottom and back up. Sorted it read 421.
    assert normalize_ipa("ma˨˩˦") == "ma˨˩˦"
    assert normalize_ipa("ma˧˥") == "ma˧˥"

    # Vietnamese hỏi, dipping-rising.
    assert normalize_ipa("maː˧˩˧") == "maː˧˩˧"

    # Downstep lowers the register of what follows, so which side of a tone
    # letter it sits on is the difference between two readings.
    assert normalize_ipa("a↓˥") == "a↓˥"
    assert normalize_ipa("a˥↓") == "a˥↓"

    # Two combining accents on one vowel spell a contour the same way two Chao
    # letters do, and neither appears in `MARK_ORDER`.
    assert normalize_ipa("a\u030b\u030f") == "a\u030b\u030f"
    assert normalize_ipa("a\u030f\u030b") == "a\u030f\u030b"


def test_still_sorts_tone_against_other_marks():
    """An equal rank holds a tone run together without stopping the group from
    sorting against the other marks, which is what makes the output canonical.
    """
    assert normalize_ipa("a˥ʰ") == normalize_ipa("aʰ˥")


def test_tone_normalizing_is_idempotent():
    """Applying it twice has to change nothing, or the export cannot apply it
    at more than one stage.
    """
    for one in ["ma˨˩˦", "tʰaːn˩˩˦", "a↓˥", "maː˧˩˧"]:
        once = normalize_ipa(one)
        assert normalize_ipa(once) == once


def test_drops_nothing():
    """Normalizing folds duplicate spellings. It does not delete information.

    ``DROP`` used to hold the tie above, the tie below, the syllable boundary
    and the link, and every one of them said something the source meant.
    """
    # The syllable boundary. 14,271 deletions in Thai alone.
    assert normalize_ipa("a.b") == "a.b"

    # The link between two words spoken as one.
    assert normalize_ipa("a‿b") == "a‿b"

    # The tie. `t͡ʃ` is one affricate where `tʃ` may be a stop meeting a
    # fricative across a boundary, so dropping it merged the two.
    assert normalize_ipa("t͡ʃ") == "t͡ʃ"
    assert normalize_ipa("k͡p") == "k͡p"


def test_folds_the_tie_below_onto_the_tie_above():
    """The one genuine fold of the four: the tie below IS the tie above,
    written underneath when a descender leaves no room."""
    assert normalize_ipa("t͜ʃ") == normalize_ipa("t͡ʃ")


def test_round_trips_the_tie_and_the_boundaries():
    """Keeping them is only half the job. They have to come back out too."""
    for one in ["t͡ʃa", "a.b", "a‿b"]:
        assert talk_to_ipa(ipa_to_talk(one)) == one
