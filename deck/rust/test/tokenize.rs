use talk::{combine, ipa_to_talk, segment, tokenize, Kind};

/// The chunk sequence a talk string tokenizes into.
fn chunks(talk: &str) -> Vec<String> {
  segment(talk).into_iter().map(|sound| sound.talk).collect()
}

fn features(talk: &str) -> Vec<Vec<String>> {
  segment(talk)
    .iter()
    .map(|sound| {
      sound
        .modifiers
        .iter()
        .map(|modifier| modifier.feature.clone())
        .collect()
    })
    .collect()
}

fn expect(got: Vec<String>, want: &[&str]) {
  assert_eq!(got, want.iter().map(|s| s.to_string()).collect::<Vec<_>>());
}

// ─── chunking keeps each base with its modifiers ─────────────────────────────

#[test]
fn an_aspirated_consonant_is_one_chunk() {
  expect(chunks("th~a"), &["th~", "a"]);
}

#[test]
fn a_labialized_consonant_is_one_chunk() {
  expect(chunks("kw~a"), &["kw~", "a"]);
}

#[test]
fn a_pharyngealized_consonant_is_one_chunk() {
  expect(chunks("sQ~a"), &["sQ~", "a"]);
}

#[test]
fn a_voiceless_marked_sonorant_is_one_chunk() {
  expect(chunks("mh!im"), &["mh!", "i", "m"]);
}

#[test]
fn an_ejective_is_one_chunk() {
  expect(chunks("t!arEba"), &["t!", "a", "r", "E", "b", "a"]);
}

#[test]
fn stacked_consonant_modifiers_stay_in_one_chunk() {
  expect(chunks("txy~h~im"), &["t", "xy~h~", "i", "m"]);
}

#[test]
fn a_vowel_keeps_its_stress_mark() {
  expect(chunks("txando^"), &["t", "x", "a", "n", "d", "o^"]);
}

#[test]
fn a_vowel_keeps_tone_length_and_nasal_marks_in_one_chunk() {
  expect(chunks("a~+_"), &["a~+_"]);
  expect(
    chunks("txya@+a-a++u"),
    &["t", "x", "y", "a@+", "a-", "a++", "u"],
  );
}

// ─── clicks are single chunks ────────────────────────────────────────────────

#[test]
fn does_not_split_a_click_off_its_base_letter() {
  expect(chunks("p*at*"), &["p*", "a", "t*"]);
  expect(chunks("k*"), &["k*"]);
  expect(chunks("c*a"), &["c*", "a"]);
}

// ─── symbols, numerals, and space ────────────────────────────────────────────

#[test]
fn passes_symbols_through_as_their_own_chunks() {
  expect(chunks("\\. 7"), &["\\.", " ", "7"]);
}

#[test]
fn marks_symbols_as_symbol_sounds() {
  let sounds = segment("\\. 7");

  assert!(sounds.iter().all(|sound| sound.kind == Kind::Symbol));
}

// ─── real words ──────────────────────────────────────────────────────────────

#[test]
fn chunks_real_words() {
  let cases: [(&str, &[&str]); 5] = [
    ("siqk", &["s", "i", "q", "k"]),
    ("aiyuQaK", &["a", "i", "y", "u", "Q", "a", "K"]),
    ("HEth~Ah", &["H", "E", "th~", "A", "h"]),
    ("s'oQya~te", &["s", "'", "o", "Q", "y", "a~", "t", "e"]),
    ("batO_'aH", &["b", "a", "t", "O_", "'", "a", "H"]),
  ];

  for (word, want) in cases {
    expect(chunks(word), want);
  }
}

// ─── sound structure ─────────────────────────────────────────────────────────

#[test]
fn exposes_the_base_and_modifier_features() {
  let sounds = segment("th~a");
  let first = &sounds[0];

  assert_eq!(first.base.map(|phone| phone.talk.as_str()), Some("t"));
  assert_eq!(first.kind, Kind::Consonant);
  assert_eq!(features("th~a")[0], vec!["aspirated"]);
}

#[test]
fn exposes_vowel_modifier_features() {
  let sounds = segment("a~+_");
  let first = &sounds[0];

  assert_eq!(first.kind, Kind::Vowel);
  assert_eq!(first.base.map(|phone| phone.talk.as_str()), Some("a"));

  let mut got = features("a~+_")[0].clone();

  got.sort();

  assert_eq!(got, vec!["high-tone", "long", "nasalized"]);
}

#[test]
fn every_non_raw_chunk_equals_its_base_plus_modifiers_in_canonical_order() {
  for sound in segment("txya@+a-a++u th~a p*a") {
    if let (false, Some(base)) = (sound.raw, sound.base) {
      assert_eq!(sound.talk, combine(&base.talk, &sound.modifiers, &sound.pre));
    }
  }
}

// ─── canonicalization ────────────────────────────────────────────────────────

#[test]
fn tokenizing_is_idempotent_on_canonical_talk() {
  for word in ["th~a", "kw~asQ~o", "a~+_", "p*at*", "mh!im"] {
    assert_eq!(chunks(word).concat(), word);
  }
}

#[test]
fn ipa_to_talk_output_tokenizes_back_to_the_same_chunks() {
  for ipa in ["tʰa", "kʷasˤo", "ˈmama", "ãtu"] {
    let talk = ipa_to_talk(ipa);

    assert_eq!(chunks(&talk).concat(), talk);
  }
}

#[test]
fn tokenize_is_an_alias_for_segment() {
  assert_eq!(tokenize("th~a"), segment("th~a"));
}

// ─── detailed sound parsing (ported from the v1 tokenizer suite) ─────────────

#[derive(Debug, PartialEq, Eq)]
struct Shape {
  talk: String,
  kind: Kind,
  base: Option<String>,
  features: Vec<String>,
}

fn shape(talk: &str) -> Vec<Shape> {
  segment(talk)
    .into_iter()
    .map(|sound| Shape {
      talk: sound.talk,
      kind: sound.kind,
      base: sound.base.map(|phone| phone.talk.clone()),
      features: sound
        .modifiers
        .iter()
        .map(|modifier| modifier.feature.clone())
        .collect(),
    })
    .collect()
}

fn one(talk: &str, kind: Kind, base: &str, features: &[&str]) -> Vec<Shape> {
  vec![Shape {
    talk: talk.to_string(),
    kind,
    base: Some(base.to_string()),
    features: features.iter().map(|f| f.to_string()).collect(),
  }]
}

#[test]
fn parses_a_bare_consonant_vowel_and_glottal_stop() {
  assert_eq!(shape("t"), one("t", Kind::Consonant, "t", &[]));
  assert_eq!(shape("a"), one("a", Kind::Vowel, "a", &[]));
  assert_eq!(shape("'"), one("'", Kind::Consonant, "'", &[]));
}

#[test]
fn decomposes_a_consonant_secondary_articulation_into_base_and_feature() {
  assert_eq!(
    shape("th~"),
    one("th~", Kind::Consonant, "t", &["aspirated"])
  );
  assert_eq!(
    shape("kw~"),
    one("kw~", Kind::Consonant, "k", &["labialized"])
  );
  assert_eq!(
    shape("dQ~"),
    one("dQ~", Kind::Consonant, "d", &["pharyngealized"])
  );
}

#[test]
fn reads_a_chart_phone_back_as_one_sound_with_the_same_spelling() {
  // Clicks, ejectives, the palatal nasal, retroflex, implosives and the
  // rounded front vowels are single chart phones. Some are ALSO spelled
  // compositionally (`t!` is `t` plus the ejective affix), and those are read
  // as base plus modifier so the affix stays visible to a longer string.
  // Either way it is one sound and it spells the same.
  for talk in ["t!", "ny~", "lQ~", "k*", "b?", "i$", "D"] {
    let sounds = segment(talk);

    assert_eq!(sounds.len(), 1, "segment({talk})");
    assert_eq!(sounds[0].talk, talk);
    assert!(sounds[0].base.is_some());
  }
}

#[test]
fn parses_vowel_suprasegmentals_as_base_plus_feature() {
  assert_eq!(shape("a^"), one("a^", Kind::Vowel, "a", &["stress"]));
  assert_eq!(shape("a_"), one("a_", Kind::Vowel, "a", &["long"]));
  assert_eq!(shape("a~"), one("a~", Kind::Vowel, "a", &["nasalized"]));
  assert_eq!(shape("i@"), one("i@", Kind::Vowel, "i", &["non-syllabic"]));
}

#[test]
fn parses_the_four_register_tones() {
  for (talk, feature) in [
    ("a+", "high-tone"),
    ("a++", "extra-high-tone"),
    ("a-", "low-tone"),
    ("a--", "extra-low-tone"),
  ] {
    assert_eq!(features(talk)[0], vec![feature]);
  }
}

#[test]
fn stacks_multiple_vowel_features_in_one_chunk() {
  let sounds = segment("a~^_+");

  assert_eq!(sounds[0].base.map(|phone| phone.talk.as_str()), Some("a"));

  let mut got = features("a~^_+")[0].clone();

  got.sort();

  assert_eq!(got, vec!["high-tone", "long", "nasalized", "stress"]);
}

#[test]
fn parses_sequences_spaces_symbols_and_numerals() {
  assert_eq!(
    shape("tak")
      .into_iter()
      .map(|s| s.base.unwrap_or_default())
      .collect::<Vec<_>>(),
    vec!["t", "a", "k"]
  );
  assert_eq!(
    segment("ma na").iter().map(|s| s.kind).collect::<Vec<_>>(),
    vec![
      Kind::Consonant,
      Kind::Vowel,
      Kind::Symbol,
      Kind::Consonant,
      Kind::Vowel
    ]
  );
  assert_eq!(segment("\\.")[0].kind, Kind::Symbol);
  assert_eq!(segment("3")[0].kind, Kind::Symbol);
  assert_eq!(
    segment("ma\\.3").iter().map(|s| s.kind).collect::<Vec<_>>(),
    vec![Kind::Consonant, Kind::Vowel, Kind::Symbol, Kind::Symbol]
  );
}

#[test]
fn handles_edge_cases() {
  assert!(segment("").is_empty());
  assert_eq!(
    shape("ieaou")
      .into_iter()
      .map(|s| s.base.unwrap_or_default())
      .collect::<Vec<_>>(),
    vec!["i", "e", "a", "o", "u"]
  );
  // n is its own consonant, never a modifier on the preceding m.
  assert_eq!(
    shape("mn")
      .into_iter()
      .map(|s| s.base.unwrap_or_default())
      .collect::<Vec<_>>(),
    vec!["m", "n"]
  );
}

#[test]
fn carries_an_unknown_mark_through_as_a_raw_symbol() {
  // `.` and the contour-tone marks are not string-level modifiers, so they
  // pass through untouched rather than attaching to the vowel.
  assert_eq!(
    segment("t.").iter().map(|s| s.raw).collect::<Vec<_>>(),
    vec![false, true]
  );
  assert_eq!(
    segment("a/").iter().map(|s| s.raw).collect::<Vec<_>>(),
    vec![false, true]
  );
}
