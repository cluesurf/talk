//! The IPA articulatory axes, and where each mark can attach.
//!
//! talk's own modifiers carry `attaches` rules in `modifiers.json`. IPA's
//! diacritics have no such data anywhere, so the rules are written out here
//! and follow the same shape, which is what makes the two notations
//! countable by one model.
//!
//! An AXIS is a dimension a sound varies along. A sound takes at most one
//! mark per axis, so `̟` advanced and `̠` retracted are alternatives rather
//! than a pair that can co-occur. That single constraint is what makes the
//! space finite.
//!
//! Mirrors `code/space/axis.ts` in the TypeScript port.

use std::sync::OnceLock;

use crate::string::types::Form;

/// Where a mark may attach. An empty field means no restriction.
#[derive(Debug, Clone, Default)]
pub struct Attachment {
  pub place: Option<Vec<&'static str>>,
  pub not_place: Option<Vec<&'static str>>,
  pub manner: Option<Vec<&'static str>>,
  pub not_manner: Option<Vec<&'static str>>,
  pub voicing: Option<Vec<&'static str>>,
  pub form: Option<Form>,
}

/// A set of marks sharing one attachment rule, within an axis.
#[derive(Debug, Clone)]
pub struct MarkGroup {
  pub marks: Vec<&'static str>,
  pub rule: Attachment,
}

pub const CORONAL: [&str; 4] =
  ["dental", "alveolar", "postalveolar", "retroflex"];

pub const OBSTRUENT: [&str; 6] = [
  "plosive",
  "fricative",
  "sibilant-fricative",
  "non-sibilant-fricative",
  "lateral-fricative",
  "affricate",
];

pub const SONORANT: [&str; 7] = [
  "nasal",
  "approximant",
  "fricative-approximant",
  "trill",
  "tap-flap",
  "lateral-approximant",
  "lateral-tap-flap",
];

/// Places behind the oral cavity, where most secondary articulation fails.
pub const BACK_PLACES: [&str; 2] = ["pharyngeal-epiglottal", "glottal"];

/// Axes that describe the SYLLABLE rather than the segment. The `band` tier
/// excludes these; `mesh` includes them.
pub const SUPRASEGMENTAL: [&str; 4] =
  ["duration", "syllabicity", "stress", "tone"];

fn group(marks: &[&'static str], rule: Attachment) -> MarkGroup {
  MarkGroup { marks: marks.to_vec(), rule }
}

fn place(values: &[&'static str]) -> Attachment {
  Attachment { place: Some(values.to_vec()), ..Default::default() }
}

fn not_place(values: &[&'static str]) -> Attachment {
  Attachment { not_place: Some(values.to_vec()), ..Default::default() }
}

fn form(value: Form) -> Attachment {
  Attachment { form: Some(value), ..Default::default() }
}

fn joined(
  first: &[&'static str],
  second: &[&'static str],
) -> Vec<&'static str> {
  first.iter().chain(second.iter()).copied().collect()
}

/// Every IPA diacritic, by axis.
///
/// Rules mirror talk's `attaches` where the mark exists there, and are
/// stated here where talk has no equivalent because it drops the feature.
/// Each is a claim about articulation, so each is arguable: a reader who
/// disagrees should change the rule rather than the count.
pub fn ipa_axes() -> &'static Vec<(&'static str, Vec<MarkGroup>)> {
  static CELL: OnceLock<Vec<(&'static str, Vec<MarkGroup>)>> =
    OnceLock::new();

  CELL.get_or_init(|| {
    vec![
      (
        "centrality",
        vec![group(&["\u{0308}", "\u{033d}"], form(Form::Vowel))],
      ),
      (
        "dentality",
        vec![
          group(&["\u{032a}"], place(&["dental", "alveolar"])),
          group(&["\u{033c}"], place(&["bilabial", "alveolar"])),
        ],
      ),
      ("duration", vec![group(&["ː", "ˑ", "\u{0306}"], Attachment::default())]),
      (
        "frication",
        vec![
          group(&["\u{0353}"], form(Form::Consonant)),
          group(&["\u{0347}"], place(&CORONAL)),
        ],
      ),
      ("height", vec![group(&["\u{031d}", "\u{031e}"], Attachment::default())]),
      (
        "labial",
        vec![
          group(
            &["ʷ"],
            not_place(&joined(&["bilabial", "labiodental"], &BACK_PLACES)),
          ),
          // Degree of rounding only means something on a rounded
          // articulation.
          group(&["\u{0339}", "\u{031c}"], form(Form::Vowel)),
        ],
      ),
      (
        "laryngeal",
        vec![
          // Aspirated fricatives are attested in 41 phoible entries
          // (Burmese `sʰ`, Tibetan `ɕʰ` `xʰ` `ʂʰ`, Karen), so this is not
          // plosive-only.
          group(
            &["ʰ", "ʱ"],
            Attachment {
              manner: Some(OBSTRUENT.to_vec()),
              not_place: Some(vec!["glottal"]),
              ..Default::default()
            },
          ),
          group(
            &["ʼ"],
            Attachment {
              manner: Some(OBSTRUENT.to_vec()),
              voicing: Some(vec!["voiceless"]),
              not_place: Some(vec!["glottal"]),
              ..Default::default()
            },
          ),
          group(&["ˀ"], not_place(&["glottal"])),
        ],
      ),
      ("nasality", vec![group(
        &["\u{0303}"],
        Attachment { not_manner: Some(vec!["nasal"]), ..Default::default() },
      )]),
      (
        "phonation",
        vec![
          group(
            &["\u{0325}"],
            Attachment {
              manner: Some(SONORANT.to_vec()),
              voicing: Some(vec!["voiced"]),
              ..Default::default()
            },
          ),
          group(
            &["\u{032c}"],
            Attachment {
              voicing: Some(vec!["voiceless"]),
              ..Default::default()
            },
          ),
          // Breathy and creaky are kinds of voicing, so they need voicing.
          group(
            &["\u{0324}", "\u{0330}"],
            Attachment {
              voicing: Some(vec!["voiced"]),
              ..Default::default()
            },
          ),
        ],
      ),
      // A release is what follows a stop closure, so it needs a stop. A
      // nasal cannot have a nasal release, nor a lateral a lateral one.
      (
        "release",
        vec![
          group(
            &["ⁿ"],
            Attachment {
              manner: Some(vec!["plosive"]),
              not_manner: Some(vec!["nasal"]),
              ..Default::default()
            },
          ),
          group(
            &["ˡ"],
            Attachment {
              manner: Some(vec!["plosive"]),
              place: Some(CORONAL.to_vec()),
              ..Default::default()
            },
          ),
          group(
            &["\u{031a}"],
            Attachment {
              manner: Some(vec!["plosive"]),
              ..Default::default()
            },
          ),
        ],
      ),
      ("rhoticity", vec![group(&["\u{02de}"], form(Form::Vowel))]),
      ("stress", vec![group(&["\u{0301}", "\u{0300}"], Attachment::default())]),
      (
        "syllabicity",
        vec![
          group(
            &["\u{0329}"],
            Attachment {
              form: Some(Form::Consonant),
              manner: Some(SONORANT.to_vec()),
              ..Default::default()
            },
          ),
          group(&["\u{032f}"], form(Form::Vowel)),
        ],
      ),
      (
        "tension",
        vec![group(&["\u{0348}", "\u{0349}"], form(Form::Consonant))],
      ),
      (
        "tone",
        vec![group(&["˥", "˦", "˧", "˨", "˩"], form(Form::Vowel))],
      ),
      (
        "tongue-body",
        vec![
          group(&["ʲ"], not_place(&joined(&["palatal"], &BACK_PLACES))),
          group(
            &["ˠ", "ˤ"],
            not_place(&joined(&["velar"], &BACK_PLACES)),
          ),
          group(
            &["ᶣ"],
            not_place(&joined(
              &["bilabial", "palatal", "labial-velar", "labial-palatal"],
              &BACK_PLACES,
            )),
          ),
        ],
      ),
      (
        "tongue-position",
        vec![group(&["\u{031f}", "\u{0320}"], Attachment::default())],
      ),
      // Apical and laminal say where the coronal closure is made, so they
      // mean nothing off the coronal region.
      (
        "tongue-shape",
        vec![group(&["\u{033a}", "\u{033b}"], place(&CORONAL))],
      ),
      (
        "tongue-root",
        vec![group(&["\u{0318}", "\u{0319}"], form(Form::Vowel))],
      ),
    ]
  })
}

/// The features a base carries, as the rules read them.
pub struct BaseFeatures<'a> {
  pub form: Form,
  pub place: Option<&'a str>,
  pub manner: Option<&'a str>,
  pub voicing: Option<&'a str>,
}

/// Whether a base with these features can take a mark under this rule.
pub fn attaches(base: &BaseFeatures, rule: &Attachment) -> bool {
  if let Some(want) = rule.form {
    if base.form != want {
      return false;
    }
  }

  let place = base.place.unwrap_or("");
  let manner = base.manner.unwrap_or("");
  let voicing = base.voicing.unwrap_or("");

  if let Some(allowed) = &rule.place {
    if !allowed.contains(&place) {
      return false;
    }
  }

  if let Some(denied) = &rule.not_place {
    if denied.contains(&place) {
      return false;
    }
  }

  if let Some(allowed) = &rule.manner {
    if !allowed.contains(&manner) {
      return false;
    }
  }

  if let Some(denied) = &rule.not_manner {
    if denied.contains(&manner) {
      return false;
    }
  }

  if let Some(allowed) = &rule.voicing {
    if !allowed.contains(&voicing) {
      return false;
    }
  }

  true
}
