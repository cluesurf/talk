use std::collections::HashSet;

use talk::string::data::{phones, token_entries};
use talk::{enumerate_sounds, ipa_to_talk, machine, readable, segment, talk_to_ipa, Kind};

// ─── coverage ────────────────────────────────────────────────────────────────

#[test]
fn maps_every_phone_ipa_back_to_its_own_talk_spelling() {
  let drift: Vec<String> = phones()
    .iter()
    .filter_map(|phone| {
      let got = ipa_to_talk(&phone.ipa);

      (got != phone.talk).then(|| format!("{}: {got} != {}", phone.ipa, phone.talk))
    })
    .collect();

  assert_eq!(drift, Vec::<String>::new());
}

// ─── machine encoding ────────────────────────────────────────────────────────

#[test]
fn gives_exactly_one_code_point_per_phone() {
  let bad: Vec<&str> = phones()
    .iter()
    .filter(|phone| machine(&phone.talk).chars().count() != 1)
    .map(|phone| phone.talk.as_str())
    .collect();

  assert_eq!(bad, Vec::<&str>::new());
}

#[test]
fn gives_exactly_one_code_point_per_enumerated_sound() {
  let bad: Vec<String> = enumerate_sounds()
    .into_iter()
    .filter(|sound| machine(&sound.talk).chars().count() != 1)
    .map(|sound| sound.talk)
    .collect();

  assert_eq!(bad, Vec::<String>::new());
}

#[test]
fn never_assigns_the_same_code_point_twice() {
  let mut seen: HashSet<&str> = HashSet::new();
  let dupes: Vec<&str> = token_entries()
    .iter()
    .filter(|entry| !seen.insert(entry.token.as_str()))
    .map(|entry| entry.talk.as_str())
    .collect();

  assert_eq!(dupes, Vec::<&str>::new());
}

// ─── round trips ─────────────────────────────────────────────────────────────

#[test]
fn ipa_to_talk_to_ipa_is_stable() {
  for word in ["tʰa", "kʷasˤo", "ˈmama", "ãtu", "sˤuːl", "nʲokʰ"] {
    let talk = ipa_to_talk(word);

    // A second pass through talk to ipa to talk is a fixed point.
    assert_eq!(ipa_to_talk(&talk_to_ipa(&talk)), talk);
  }
}

#[test]
fn canonicalizes_modifier_order() {
  // Aspiration then labialization collapses to the canonical spelling.
  assert_eq!(ipa_to_talk("tʰʷ"), ipa_to_talk("tʷʰ"));
}

// ─── api ─────────────────────────────────────────────────────────────────────

#[test]
fn exposes_the_conversions_at_the_crate_root() {
  assert_eq!(ipa_to_talk("tʰ"), "th~");
  assert_eq!(talk_to_ipa("th~"), "tʰ");
  assert_eq!(readable("th~"), "tʰ");
  assert_eq!(machine("th~").chars().count(), 1);
}

#[test]
fn tokenizes_into_sounds_with_features() {
  let sounds = segment("th~a");
  let first = &sounds[0];

  assert_eq!(first.base.map(|phone| phone.talk.as_str()), Some("t"));
  assert_eq!(
    first
      .modifiers
      .iter()
      .map(|modifier| modifier.feature.as_str())
      .collect::<Vec<_>>(),
    vec!["aspirated"]
  );
}

#[test]
fn carries_symbols_and_numerals_through() {
  assert_eq!(readable("=. 7"), ". 7");
  assert_eq!(segment("=. 7")[0].kind, Kind::Symbol);
}
