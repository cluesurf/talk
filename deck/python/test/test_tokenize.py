import pytest

from talk import combine, ipa_to_talk, segment, tokenize


def chunks(talk_text):
    return [s.talk for s in segment(talk_text)]


def shape(talk_text):
    return [
        {
            "talk": s.talk,
            "kind": s.kind,
            "base": s.base.talk if s.base else None,
            "features": [m.feature for m in s.modifiers],
        }
        for s in segment(talk_text)
    ]


# ─── chunking keeps each base with its modifiers ────────────────────────


def test_an_aspirated_consonant_is_one_chunk():
    assert chunks("th~a") == ["th~", "a"]


def test_a_labialized_consonant_is_one_chunk():
    assert chunks("kw~a") == ["kw~", "a"]


def test_a_pharyngealized_consonant_is_one_chunk():
    assert chunks("sQ~a") == ["sQ~", "a"]


def test_a_voiceless_marked_sonorant_is_one_chunk():
    assert chunks("mh!im") == ["mh!", "i", "m"]


def test_an_ejective_is_one_chunk():
    assert chunks("t!arEba") == ["t!", "a", "r", "E", "b", "a"]


def test_stacked_consonant_modifiers_stay_in_one_chunk():
    assert chunks("txy~h~im") == ["t", "xy~h~", "i", "m"]


def test_a_vowel_keeps_its_stress_mark():
    assert chunks("txando^") == ["t", "x", "a", "n", "d", "o^"]


def test_a_vowel_keeps_tone_length_and_nasal_marks_in_one_chunk():
    assert chunks("a~+_") == ["a~+_"]
    assert chunks("txya@+a-a++u") == ["t", "x", "y", "a@+", "a-", "a++", "u"]


# ─── clicks are single chunks ───────────────────────────────────────────


def test_does_not_split_a_click_off_its_base_letter():
    assert chunks("p*at*") == ["p*", "a", "t*"]
    assert chunks("k*") == ["k*"]
    assert chunks("c*a") == ["c*", "a"]


# ─── symbols, numerals, and space ───────────────────────────────────────


def test_passes_symbols_numerals_and_space_through():
    assert chunks("\\. 7") == ["\\.", " ", "7"]
    dot, space, seven = segment("\\. 7")
    assert dot.kind == "symbol"
    assert space.kind == "symbol"
    assert seven.kind == "symbol"


# ─── real words ─────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "word,expected",
    [
        ("siqk", ["s", "i", "q", "k"]),
        ("aiyuQaK", ["a", "i", "y", "u", "Q", "a", "K"]),
        ("HEth~Ah", ["H", "E", "th~", "A", "h"]),
        ("s'oQya~te", ["s", "'", "o", "Q", "y", "a~", "t", "e"]),
        ("batO_'aH", ["b", "a", "t", "O_", "'", "a", "H"]),
    ],
)
def test_real_words(word, expected):
    assert chunks(word) == expected


# ─── sound structure ────────────────────────────────────────────────────


def test_exposes_the_base_and_modifier_features():
    sound = segment("th~a")[0]
    assert sound.base.talk == "t"
    assert sound.kind == "consonant"
    assert [m.feature for m in sound.modifiers] == ["aspirated"]


def test_exposes_vowel_modifier_features():
    sound = segment("a~+_")[0]
    assert sound.kind == "vowel"
    assert sound.base.talk == "a"
    assert {m.feature for m in sound.modifiers} == {
        "nasalized",
        "high-tone",
        "long",
    }


def test_every_non_raw_chunk_equals_base_plus_modifiers():
    for sound in segment("txya@+a-a++u th~a p*a"):
        if not sound.raw and sound.base:
            assert sound.talk == combine(sound.base.talk, sound.modifiers)


# ─── canonicalization ───────────────────────────────────────────────────


def test_tokenizing_is_idempotent_on_canonical_talk():
    for word in ["th~a", "kw~asQ~o", "a~+_", "p*at*", "mh!im"]:
        assert "".join(chunks(word)) == word


def test_ipa_to_talk_output_tokenizes_back_to_the_same_chunks():
    for ipa in ["tʰa", "kʷasˤo", "ˈmama", "ãtu"]:
        talk_text = ipa_to_talk(ipa)
        assert "".join(chunks(talk_text)) == talk_text


def test_tokenize_is_an_alias_for_segment():
    assert tokenize("th~a") == segment("th~a")


# ─── detailed sound parsing (ported from the v1 tokenizer suite) ─────────


def test_parses_a_bare_consonant_vowel_and_glottal_stop():
    assert shape("t") == [
        {"talk": "t", "kind": "consonant", "base": "t", "features": []}
    ]
    assert shape("a") == [
        {"talk": "a", "kind": "vowel", "base": "a", "features": []}
    ]
    assert shape("'") == [
        {"talk": "'", "kind": "consonant", "base": "'", "features": []}
    ]


def test_decomposes_a_consonant_secondary_articulation():
    assert shape("th~") == [
        {"talk": "th~", "kind": "consonant", "base": "t", "features": ["aspirated"]}
    ]
    assert shape("kw~") == [
        {"talk": "kw~", "kind": "consonant", "base": "k", "features": ["labialized"]}
    ]
    assert shape("dQ~") == [
        {
            "talk": "dQ~",
            "kind": "consonant",
            "base": "d",
            "features": ["pharyngealized"],
        }
    ]


def test_reads_a_chart_phone_back_as_one_sound_with_the_same_spelling():
    # Clicks, ejectives, the palatal nasal, retroflex, implosives and the
    # rounded front vowels are single chart phones. Some are ALSO spelled
    # compositionally (`t!` is `t` plus the ejective affix), and those are
    # read as base plus modifier so the affix stays visible to a longer
    # string. Either way it is one sound and it spells the same.
    for talk_text in ["t!", "ny~", "lQ~", "k*", "b?", "i$", "D"]:
        sounds = segment(talk_text)
        assert len(sounds) == 1
        assert sounds[0].talk == talk_text
        assert sounds[0].base is not None


def test_parses_vowel_suprasegmentals_as_base_plus_feature():
    assert shape("a^") == [
        {"talk": "a^", "kind": "vowel", "base": "a", "features": ["stress"]}
    ]
    assert shape("a_") == [
        {"talk": "a_", "kind": "vowel", "base": "a", "features": ["long"]}
    ]
    assert shape("a~") == [
        {"talk": "a~", "kind": "vowel", "base": "a", "features": ["nasalized"]}
    ]
    assert shape("i@") == [
        {"talk": "i@", "kind": "vowel", "base": "i", "features": ["non-syllabic"]}
    ]


def test_parses_the_four_register_tones():
    assert segment("a+")[0].modifiers[0].feature == "high-tone"
    assert segment("a++")[0].modifiers[0].feature == "extra-high-tone"
    assert segment("a-")[0].modifiers[0].feature == "low-tone"
    assert segment("a--")[0].modifiers[0].feature == "extra-low-tone"


def test_stacks_multiple_vowel_features_in_one_chunk():
    sound = segment("a~^_+")[0]
    assert sound.base.talk == "a"
    assert {m.feature for m in sound.modifiers} == {
        "nasalized",
        "stress",
        "long",
        "high-tone",
    }


def test_parses_sequences_spaces_symbols_and_numerals():
    assert [x["base"] for x in shape("tak")] == ["t", "a", "k"]
    assert [s.kind for s in segment("ma na")] == [
        "consonant",
        "vowel",
        "symbol",
        "consonant",
        "vowel",
    ]
    assert segment("\\.")[0].kind == "symbol"
    assert segment("3")[0].kind == "symbol"
    assert [s.kind for s in segment("ma\\.3")] == [
        "consonant",
        "vowel",
        "symbol",
        "symbol",
    ]


def test_handles_edge_cases():
    assert segment("") == []
    assert [x["base"] for x in shape("ieaou")] == ["i", "e", "a", "o", "u"]
    # n is its own consonant, never a modifier on the preceding m.
    assert [x["base"] for x in shape("mn")] == ["m", "n"]


def test_carries_an_unknown_mark_through_as_a_raw_symbol():
    # `.` and the contour-tone marks are not string-level modifiers, so they
    # pass through untouched rather than attaching to the vowel.
    assert [s.raw for s in segment("t.")] == [False, True]
    assert [s.raw for s in segment("a/")] == [False, True]
