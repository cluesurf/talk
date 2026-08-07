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
use talk::{
  enumerate_sounds, ipa_to_talk, machine, readable, segment, talk_to_ipa, Cluster,
  Sound,
};

#[derive(Deserialize)]
struct Fixture {
  segment: Vec<SegmentCase>,
  convert: Vec<ConvertCase>,
  #[serde(rename = "ipaToTalk")]
  ipa_to_talk: Vec<IpaCase>,
  enumerate: Vec<SoundInfoShape>,
  syllables: Vec<SyllableCase>,
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

  assert_eq!(
    lossy, 3,
    "only the single astral talk input is expected to diverge, across the \
         three talk-side call groups"
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
  assert_eq!(machine(astral), vec![talk::NO_CODE]);

  assert!(
    syllables(astral).is_err(),
    "no segment spelling covers it, so syllabification rejects it"
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
      machine(&case.input),
      case.machine,
      "machine({:?})",
      case.input
    );
    assert_eq!(
      machine(&case.input),
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
  let got: Vec<SoundInfoShape> = enumerate_sounds()
    .into_iter()
    .map(|sound| SoundInfoShape {
      talk: sound.talk,
      ipa: sound.ipa,
      simple: sound.simple,
      kind: sound.kind.as_str().to_string(),
    })
    .collect();

  assert_eq!(got, fixture().enumerate);
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
