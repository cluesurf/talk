//! The fixture is v1's `chunk()` output over a corpus, captured once. This
//! build must syllabify every word into the same clusters. Only the code points
//! differ between the two builds, so `form:text` is compared, not the code.

use serde::Deserialize;

use talk::syllables;

#[derive(Deserialize)]
struct Case {
  word: String,
  syllables: Vec<Vec<String>>,
}

fn shape(word: &str) -> Vec<Vec<String>> {
  syllables(word)
    .unwrap_or_else(|error| panic!("syllables({word:?}): {error}"))
    .syllables
    .iter()
    .map(|syllable| {
      syllable
        .clusters
        .iter()
        .map(|cluster| format!("{}:{}", cluster.form, cluster.text))
        .collect()
    })
    .collect()
}

#[test]
fn syllabification_matches_v1_exactly() {
  let cases: Vec<Case> = serde_json::from_str(include_str!("fixture/syllable-parity.json"))
    .expect("test/fixture/syllable-parity.json is malformed");

  assert!(!cases.is_empty(), "the fixture should not be empty");

  for case in cases {
    assert_eq!(shape(&case.word), case.syllables, "splits {}", case.word);
  }
}

#[test]
fn splits_into_onset_plus_nucleus_syllables() {
  let result = syllables("mama").expect("mama parses");
  let texts: Vec<String> = result
    .syllables
    .iter()
    .map(|syllable| {
      syllable
        .clusters
        .iter()
        .map(|cluster| cluster.text.as_str())
        .collect()
    })
    .collect();

  assert_eq!(texts, vec!["ma", "ma"]);
}

#[test]
fn keeps_a_whole_word_with_no_vowel_as_one_syllable() {
  let result = syllables("siqk").expect("siqk parses");

  assert_eq!(result.syllables.len(), 1);
}

#[test]
fn rejects_a_string_no_segment_spelling_covers() {
  assert!(syllables("zzz?").is_err());
}
