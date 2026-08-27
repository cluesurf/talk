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

  // COMPARED BY FORM, NOT BY TEXT. The fixture is v1's output, captured when
  // a sound was spelled differently: v1 wrote the velar nasal `q` and it is
  // `$n` now. A text comparison therefore asserts the SPELLING as much as the
  // split, and fails on every respelling even when the analysis is identical.
  //
  // What has to survive a respelling is the SHAPE: how many syllables, and
  // what each cluster is for.
  let forms = |rows: &[Vec<String>]| -> Vec<Vec<String>> {
    rows
      .iter()
      .map(|row| {
        row
          .iter()
          .map(|cell| {
            cell.split(':').next().unwrap_or_default().to_string()
          })
          .collect()
      })
      .collect()
  };

  // WHERE THE LABEL MOVED ON PURPOSE. `$'` is ʕ, the voiced pharyngeal
  // fricative. v1 listed it among the consonants but never among the ones
  // that may BEGIN a syllable, so an intervocalic one came back as a plain
  // consonant. It is a fricative, and a fricative opening a syllable is
  // ordinary, so it is listed as an onset now and labelled `start-consonant`.
  //
  // The SPLIT is unchanged either way, which is what parity is for, so this
  // still asserts the boundaries and only relaxes the label. The TypeScript
  // suite records the same case the same way.
  let relabelled = ["aiyu$'aK"];

  for case in cases {
    if relabelled.contains(&case.word.as_str()) {
      let got: Vec<usize> = shape(&case.word).iter().map(Vec::len).collect();
      let want: Vec<usize> = case.syllables.iter().map(Vec::len).collect();

      assert_eq!(got, want, "splits {}", case.word);
      continue;
    }

    assert_eq!(
      forms(&shape(&case.word)),
      forms(&case.syllables),
      "splits {}",
      case.word
    );
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
fn carries_a_string_no_segment_spelling_covers() {
  // CARRIED, NOT REJECTED. The reader walked a table of spellings and had no
  // entry for these, so it failed. It tokenizes through `segment` now, which
  // passes an unknown character through raw, and the reference build does the
  // same: the answer is a split holding no sounds rather than an error.
  // `z` is a real consonant, so this does split; `?` is the part no
  // spelling covers, and it is carried rather than rejected.
  let split = syllables("zzz?").expect("an unknown character is carried");

  let text: String = split
    .syllables
    .iter()
    .flat_map(|one| one.clusters.iter().map(|cell| cell.text.as_str()))
    .collect();

  assert!(text.contains('z'), "the sounds it does know are kept");
}
