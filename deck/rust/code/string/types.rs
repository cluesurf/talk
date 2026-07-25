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
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Form {
  Consonant,
  Vowel,
}

impl From<Form> for Kind {
  fn from(form: Form) -> Kind {
    match form {
      Form::Consonant => Kind::Consonant,
      Form::Vowel => Kind::Vowel,
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
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Sound {
  pub talk: String,
  pub ipa: String,
  pub simple: String,
  pub machine: String,
  pub kind: Kind,
  pub base: Option<&'static Phone>,
  pub modifiers: Vec<&'static Modifier>,
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

/// A frozen talk-sound to Hangul code point (token) assignment.
#[derive(Debug, Clone, Deserialize)]
pub struct TokenEntry {
  pub talk: String,
  pub token: String,
}

/// A unit the scanner can match: a base sound, an affix, or a passthrough
/// symbol.
#[derive(Debug, Clone, Copy)]
pub enum Unit {
  Phone(&'static Phone),
  Modifier(&'static Modifier),
  Symbol(&'static SymbolEntry),
}
