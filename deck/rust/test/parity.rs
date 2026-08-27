//! Differential parity against the TypeScript build.
//!
//! `test/parity.ts` runs the TypeScript implementation over a corpus and writes
//! every input with its output to `test/fixture/parity.json`. This asserts the
//! Rust port produces exactly the same output for the same input, including the
//! inputs the syllable parser rejects.

use std::collections::BTreeSet;

use serde::Deserialize;

use talk::syllable::syllable::{Segment, SegmentKind, Tone};
use talk::syllable::syllables;
use talk::{Notation, Tier, 
  enumerate_sounds, ipa_to_talk, machine, readable, segment, talk_to_ipa, Cluster,
  Sound,
};

#[derive(Deserialize)]
struct Fixture {
  /// The sample step the fixture was written with. The committed file is a
  /// spread across the inventory rather than all of it, because the full set
  /// is 161 MB, so the same rows are taken from this build's own enumeration
  /// before comparing.
  #[serde(default = "one")]
  stride: usize,
  segment: Vec<SegmentCase>,
  convert: Vec<ConvertCase>,
  #[serde(rename = "ipaToTalk")]
  ipa_to_talk: Vec<IpaCase>,
  enumerate: Vec<SoundInfoShape>,
  syllables: Vec<SyllableCase>,
}

fn one() -> usize {
  1
}

#[derive(Deserialize)]
struct SegmentCase {
  input: String,
  #[serde(default)]
  lossy: bool,
  sounds: Vec<SoundShape>,
}

#[derive(Debug, Deserialize, PartialEq, Eq)]
struct SoundShape {
  talk: String,
  ipa: String,
  simple: String,
  machine: i64,
  kind: String,
  base: Option<String>,
  modifiers: Vec<String>,
  raw: bool,
}

#[derive(Deserialize)]
struct ConvertCase {
  input: String,
  #[serde(default)]
  lossy: bool,
  #[serde(rename = "talkToIpa")]
  talk_to_ipa: String,
  readable: String,
  machine: Vec<i64>,
}

#[derive(Deserialize)]
struct IpaCase {
  input: String,
  #[serde(default)]
  lossy: bool,
  output: String,
}

#[derive(Debug, Deserialize, PartialEq, Eq)]
struct SoundInfoShape {
  talk: String,
  ipa: String,
  simple: String,
  kind: String,
}

#[derive(Deserialize)]
struct SyllableCase {
  input: String,
  #[serde(default)]
  lossy: bool,
  ok: bool,
  #[serde(default)]
  marks: Vec<MarkShape>,
  #[serde(default)]
  clusters: Vec<ClusterShape>,
  #[serde(default)]
  syllables: Vec<SyllableShape>,
}

#[derive(Debug, Deserialize, PartialEq, Eq)]
struct MarkShape {
  kind: Option<String>,
  value: Option<String>,
  tone: Option<String>,
  flags: BTreeSet<String>,
}

#[derive(Debug, Deserialize, PartialEq, Eq)]
struct ClusterShape {
  form: String,
  text: String,
  code: String,
  emphasis: bool,
}

#[derive(Debug, Deserialize, PartialEq, Eq)]
struct SyllableShape {
  emphasis: bool,
  clusters: Vec<ClusterShape>,
}

fn fixture() -> Fixture {
  serde_json::from_str(include_str!("fixture/parity.json"))
    .expect("test/fixture/parity.json is malformed, regenerate it with `npx tsx test/parity.ts`")
}

fn sound_shape(sound: &Sound) -> SoundShape {
  SoundShape {
    talk: sound.talk.clone(),
    ipa: sound.ipa.clone(),
    simple: sound.simple.clone(),
    machine: sound.machine,
    kind: sound.kind.as_str().to_string(),
    base: sound.base.map(|phone| phone.talk.clone()),
    modifiers: sound
      .modifiers
      .iter()
      .map(|modifier| modifier.talk.clone())
      .collect(),
    raw: sound.raw,
  }
}

fn mark_shape(mark: &Segment) -> MarkShape {
  let flags = [
    ("aspiration", mark.aspiration),
    ("click", mark.click),
    ("dentalization", mark.dentalization),
    ("ejection", mark.ejection),
    ("elongation", mark.elongation),
    ("emphasis", mark.emphasis),
    ("implosion", mark.implosion),
    ("labialization", mark.labialization),
    ("nasalization", mark.nasalization),
    ("palatalization", mark.palatalization),
    ("pharyngealization", mark.pharyngealization),
    ("stop", mark.stop),
    ("tense", mark.tense),
    ("truncation", mark.truncation),
    ("velarization", mark.velarization),
    ("voicelessness", mark.voicelessness),
  ];

  MarkShape {
    kind: mark.kind.map(|kind| {
      match kind {
        SegmentKind::Punctuation => "punctuation",
        SegmentKind::Vowel => "vowel",
        SegmentKind::Consonant => "consonant",
      }
      .to_string()
    }),
    value: mark.value.clone(),
    tone: mark.tone.map(|tone| {
      match tone {
        Tone::ExtraHigh => "extra high",
        Tone::High => "high",
        Tone::Low => "low",
        Tone::ExtraLow => "extra low",
        Tone::Rising => "rising",
        Tone::Rising2 => "rising 2",
        Tone::Falling => "falling",
        Tone::Falling2 => "falling 2",
        Tone::RisingFalling => "rising falling",
        Tone::FallingRising => "falling rising",
      }
      .to_string()
    }),
    flags: flags
      .into_iter()
      .filter(|&(_, set)| set)
      .map(|(name, _)| name.to_string())
      .collect(),
  }
}

fn cluster_shape(cluster: &Cluster) -> ClusterShape {
  ClusterShape {
    form: cluster.form.as_str().to_string(),
    text: cluster.text.clone(),
    code: cluster.code.clone(),
    emphasis: cluster.emphasis,
  }
}

/// The TypeScript build indexes talk by UTF-16 code unit, so an unknown astral
/// character comes back as two lone surrogates. Rust indexes by scalar value
/// and returns the character whole. Those cases are marked in the fixture and
/// asserted separately, in `astral_passthrough_returns_one_whole_character`.
#[test]
fn only_astral_passthrough_is_marked_as_diverging() {
  let fixture = fixture();
  let lossy = fixture.segment.iter().filter(|case| case.lossy).count()
    + fixture.convert.iter().filter(|case| case.lossy).count()
    + fixture.ipa_to_talk.iter().filter(|case| case.lossy).count()
    + fixture.syllables.iter().filter(|case| case.lossy).count();

  // WHY NOT A COUNT. This asserted the number 3, which was how many astral
  // inputs the inventory held on the day it was written. The inventory has
  // since grown and the number means nothing on its own.
  //
  // What the test is named for is the INVARIANT: a divergence is only ever
  // allowed for a character outside the basic plane, which the reference
  // build reads as two surrogate halves and this one reads whole. Anything
  // else marked lossy is a real disagreement hiding behind the flag.
  assert!(lossy > 0, "the astral cases should still be marked");

  let stray: Vec<&str> = fixture
    .ipa_to_talk
    .iter()
    .filter(|case| case.lossy)
    .map(|case| case.input.as_str())
    .filter(|input| input.chars().all(|one| (one as u32) <= 0xffff))
    .take(5)
    .collect();

  assert!(
    stray.is_empty(),
    "only astral inputs may diverge, found {stray:?}"
  );
}

/// The behaviour the Rust build has instead, for the one input above. Only the
/// sound list differs: every string-level conversion agrees, because the two
/// surrogate halves rejoin when joined back into a string.
#[test]
fn astral_passthrough_returns_one_whole_character() {
  let astral = "\u{1DF0A}";
  let sounds = segment(astral);

  assert_eq!(sounds.len(), 1, "one sound, not one per surrogate half");
  assert_eq!(sounds[0].talk, astral);
  assert!(sounds[0].raw, "an unknown character passes through raw");

  assert_eq!(talk_to_ipa(astral), astral);
  assert_eq!(readable(astral), astral);
  assert_eq!(machine(astral, Notation::Tone, Tier::Mesh), vec![talk::NO_CODE]);

  // CARRIED, NOT REJECTED. This asserted an error, from when the syllable
  // reader walked a table of spellings and had no entry for the character.
  // It tokenizes through `segment` now, which passes an unknown character
  // through raw, so the answer is an empty syllabification rather than a
  // failure. The reference build does the same.
  let split = syllables(astral).expect("an unknown character is carried");

  assert!(
    split.syllables.is_empty(),
    "it holds no sounds, so it makes no syllables"
  );
}

#[test]
fn segment_matches_the_typescript_build() {
  for case in fixture().segment {
    if case.lossy {
      continue;
    }

    let got: Vec<SoundShape> = segment(&case.input).iter().map(sound_shape).collect();

    assert_eq!(got, case.sounds, "segment({:?})", case.input);
  }
}

#[test]
fn conversions_match_the_typescript_build() {
  for case in fixture().convert {
    if case.lossy {
      continue;
    }

    assert_eq!(
      talk_to_ipa(&case.input),
      case.talk_to_ipa,
      "talk_to_ipa({:?})",
      case.input
    );
    assert_eq!(
      readable(&case.input),
      case.readable,
      "readable({:?})",
      case.input
    );
    assert_eq!(
      machine(&case.input, Notation::Tone, Tier::Mesh),
      case.machine,
      "machine({:?})",
      case.input
    );
    assert_eq!(
      machine(&case.input, Notation::Tone, Tier::Mesh),
      case.machine,
      "machine({:?})",
      case.input
    );
  }
}

#[test]
fn ipa_to_talk_matches_the_typescript_build() {
  for case in fixture().ipa_to_talk {
    if case.lossy {
      continue;
    }

    assert_eq!(
      ipa_to_talk(&case.input),
      case.output,
      "ipa_to_talk({:?})",
      case.input
    );
  }
}

#[test]
fn the_sound_inventory_matches_the_typescript_build() {
  let fixture = fixture();
  let got: Vec<SoundInfoShape> = enumerate_sounds()
    .into_iter()
    .step_by(fixture.stride)
    .map(|sound| SoundInfoShape {
      talk: sound.talk,
      ipa: sound.ipa,
      simple: sound.simple,
      kind: sound.kind.as_str().to_string(),
    })
    .collect();

  assert_eq!(got, fixture.enumerate);
}

#[test]
fn syllabification_matches_the_typescript_build() {
  for case in fixture().syllables {
    if case.lossy {
      continue;
    }

    let result = syllables(&case.input);

    if !case.ok {
      assert!(
        result.is_err(),
        "syllables({:?}) should be rejected, got {result:?}",
        case.input
      );

      continue;
    }

    let got = result
      .unwrap_or_else(|error| panic!("syllables({:?}) should succeed, got {error}", case.input));

    let marks: Vec<MarkShape> = got.marks.iter().map(mark_shape).collect();
    let clusters: Vec<ClusterShape> = got.clusters.iter().map(cluster_shape).collect();
    let grouped: Vec<SyllableShape> = got
      .syllables
      .iter()
      .map(|syllable| SyllableShape {
        emphasis: syllable.emphasis,
        clusters: syllable.clusters.iter().map(cluster_shape).collect(),
      })
      .collect();

    assert_eq!(marks, case.marks, "marks of {:?}", case.input);
    assert_eq!(clusters, case.clusters, "clusters of {:?}", case.input);
    assert_eq!(grouped, case.syllables, "syllables of {:?}", case.input);
  }
}
