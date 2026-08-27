from talk import ipa_to_talk, segment


def test_stress_lands_on_the_vowel_not_an_onset_consonant():
    # IPA marks the stressed syllable with a leading tick. Talk puts the
    # stress on that syllable's vowel, past any onset consonants.
    assert ipa_to_talk("ʔeˈmet") == "'eme<^>t"
    assert ipa_to_talk("ˈmama") == "ma<^>ma"


def test_the_stressed_sound_is_always_a_vowel():
    for ipa in ["ʔeˈmet", "ˈmama", "uˈǁɔːlɔ", "ɬaɡaˈniːpʰa"]:
        stressed = [
            s
            for s in segment(ipa_to_talk(ipa))
            if any(m.feature == "stress" for m in s.modifiers)
        ]
        assert len(stressed) == 1
        assert stressed[0].kind == "vowel"
