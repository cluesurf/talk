//! Shared types for the talk encoding.
//!
//! Named `types` rather than `type` because `type` is a Rust keyword.

use serde::Deserialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
  Consonant,
  Vowel,
  Symbol,
}

/// The two phonetic forms. `Kind` adds `Symbol` on top of these.
///
/// `Any` is only ever a MODIFIER's base, never a phone's: it marks a feature
/// that is not about articulation and so attaches to either form. Length and
/// stress are the two, `b_` being a geminate and `b^` a stressed onset.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Form {
  Consonant,
  Vowel,
  Any,
}

impl From<Form> for Kind {
  fn from(form: Form) -> Kind {
    match form {
      Form::Consonant => Kind::Consonant,
      // A sound's form is never `Any`; only a modifier's base is.
      Form::Vowel | Form::Any => Kind::Vowel,
    }
  }
}

impl Kind {
  pub fn as_str(self) -> &'static str {
    match self {
      Kind::Consonant => "consonant",
      Kind::Vowel => "vowel",
      Kind::Symbol => "symbol",
    }
  }
}

#[derive(Debug, Clone, Deserialize)]
pub struct Phone {
  pub ipa: String,
  pub talk: String,
  pub xsampa: String,
  pub simple: String,
  pub form: Form,
  pub place: Option<String>,
  pub manner: Option<String>,
  pub voicing: Option<String>,
  pub height: Option<String>,
  pub backness: Option<String>,
  pub roundedness: Option<String>,
  #[serde(default)]
  pub provisional: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Attaches {
  pub place: Option<Vec<String>>,
  pub not_place: Option<Vec<String>>,
  pub manner: Option<Vec<String>>,
  pub voicing: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Modifier {
  pub ipa: String,
  pub talk: String,
  pub xsampa: String,
  pub simple: String,
  pub base: Form,
  pub feature: String,
  pub slot: String,
  pub order: i64,
  #[serde(default)]
  pub prefix: bool,
  pub attaches: Option<Attaches>,
  /// Fine phonetic detail: parsed and spelled, but outside the tone code
  /// space.
  ///
  /// The IPA notation is lossless and the tone notation deliberately
  /// coarser. Every mark here is real and gets reported by `parse_ipa`, but
  /// the tone codes are budgeted at one byte for `seed` and two for `band`
  /// and `mesh`, and twenty-five more axes would multiply that space past
  /// both. So they contribute a spelling and never a digit, and a tone
  /// string carrying one has no tone code.
  #[serde(default)]
  pub detail: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Sound {
  pub talk: String,
  pub ipa: String,
  pub simple: String,
  pub machine: i64,
  pub kind: Kind,
  pub base: Option<&'static Phone>,
  pub modifiers: Vec<&'static Modifier>,
  /// Modifiers preceding the base: pre-aspiration, prenasalization and the
  /// like. Kept apart from `modifiers` because position carries meaning,
  /// `ʰk` and `kʰ` being different sounds.
  pub pre: Vec<&'static Modifier>,
  pub raw: bool,
}

// `Phone` and `Modifier` are interned in the runtime, so a sound's base and
// modifiers are compared by identity rather than field by field.
impl PartialEq for Phone {
  fn eq(&self, other: &Phone) -> bool {
    std::ptr::eq(self, other)
  }
}

impl Eq for Phone {}

impl PartialEq for Modifier {
  fn eq(&self, other: &Modifier) -> bool {
    std::ptr::eq(self, other)
  }
}

impl Eq for Modifier {}

/// A non-phonetic passthrough sound (punctuation, digit, space).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SymbolEntry {
  pub talk: String,
  pub ipa: String,
  pub simple: String,
}

/// A canonical sound with its spellings, minus the machine code point.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SoundInfo {
  pub talk: String,
  pub ipa: String,
  pub simple: String,
  pub kind: Kind,
}

/// The machine code space: 24 bits, so every code serializes to exactly three
/// bytes and the inventory has room to grow by two orders of magnitude.
pub const CODE_LIMIT: i64 = 0xff_ffff;

/// The code for a sound with no assignment, which is anything outside the
/// enumerated inventory. Distinct from code 0, which is a real sound.
pub const NO_CODE: i64 = -1;

/// A unit the scanner can match: a base sound, an affix, or a passthrough
/// symbol.
#[derive(Debug, Clone, Copy)]
pub enum Unit {
  Phone(&'static Phone),
  Modifier(&'static Modifier),
  Symbol(&'static SymbolEntry),
}
