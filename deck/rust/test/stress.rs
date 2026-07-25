use talk::{ipa_to_talk, segment, Kind};

#[test]
fn stress_lands_on_the_syllable_vowel_not_an_onset_consonant() {
  // IPA marks the stressed syllable with a leading tick. Talk puts the stress
  // on that syllable's vowel, past any onset consonants.
  assert_eq!(ipa_to_talk("ʔeˈmet"), "'eme^t");
  assert_eq!(ipa_to_talk("ˈmama"), "ma^ma");
}

#[test]
fn always_marks_a_vowel_as_the_stressed_sound() {
  for ipa in ["ʔeˈmet", "ˈmama", "uˈǁɔːlɔ", "ɬaɡaˈniːpʰa"] {
    let talk = ipa_to_talk(ipa);
    let stressed: Vec<_> = segment(&talk)
      .into_iter()
      .filter(|sound| {
        sound
          .modifiers
          .iter()
          .any(|modifier| modifier.feature == "stress")
      })
      .collect();

    assert_eq!(stressed.len(), 1, "{ipa}");
    assert_eq!(stressed[0].kind, Kind::Vowel, "{ipa}");
  }
}
