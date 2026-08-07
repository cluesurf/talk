//! The public conversions.

use crate::string::combine::combine;
use crate::string::runtime::{nfd, runtime};
use crate::string::sound::segment;
use crate::string::types::{Modifier, Phone, Sound, SymbolEntry, Unit};

pub fn tokenize(text: &str) -> Vec<Sound> {
  segment(text)
}

pub fn talk_to_ipa(text: &str) -> String {
  segment(text)
    .iter()
    .map(|sound| sound.ipa.as_str())
    .collect()
}

pub fn readable(text: &str) -> String {
  segment(text)
    .iter()
    .map(|sound| sound.simple.as_str())
    .collect()
}

pub fn machine(text: &str) -> String {
  segment(text)
    .iter()
    .map(|sound| sound.machine.as_str())
    .collect()
}

pub fn machine_outputs(text: &str) -> Vec<String> {
  segment(text)
    .into_iter()
    .map(|sound| sound.machine)
    .collect()
}

/// One unit of parsed IPA: a sound, a passthrough symbol, or unknown input.
///
/// `base` carries the [`Phone`] matched from the IPA trie DIRECTLY, not
/// one recovered from a talk spelling. That distinction matters: talk is
/// a deliberately coarse encoding and several IPA vowels share a code
/// (`ɨ`, `y` and `ʏ` are all `i$`; six vowels are `O`). Going
/// IPA -> talk -> Phone therefore loses the exact vowel, while this keeps
/// it.
#[derive(Debug, Clone, PartialEq)]
pub enum IpaUnit {
  Phone {
    base: &'static Phone,
    modifiers: Vec<&'static Modifier>,
  },
  Symbol(&'static SymbolEntry),
  Unknown(char),
}

/// Parse IPA into base sounds and their modifiers.
///
/// `kʰ` is one unit: base `k` with the `aspirated` modifier. `iː` is base
/// `i` with `long`. This is what a caller needs to match IPA against a
/// catalog that stores base sounds and modifier flags separately, rather
/// than one row per composed symbol.
///
/// Unknown input is carried through as [`IpaUnit::Unknown`] rather than
/// dropped, so the caller can see what failed instead of silently losing
/// it.
pub fn parse_ipa(text: &str) -> Vec<IpaUnit> {
  let state = runtime();
  let input = nfd(text);
  let mut out: Vec<IpaUnit> = Vec::new();

  let mut base: Option<&'static Phone> = None;
  let mut mods: Vec<&'static Modifier> = Vec::new();
  // Prefix modifiers waiting for a base.
  let mut pending: Vec<&'static Modifier> = Vec::new();

  let mut i = 0;

  while i < input.len() {
    let Some((&unit, length)) = state.ipa_unit.match_at(&input, i) else {
      flush_units(&mut out, &mut base, &mut mods);

      let character = input[i..].chars().next().expect("in-bounds character");

      out.push(IpaUnit::Unknown(character));
      i += character.len_utf8();

      continue;
    };

    i += length;

    match unit {
      Unit::Phone(phone) => {
        // A base begins a new sound. A held stress mark belongs on the
        // vowel of the syllable, so it skips any onset consonants and
        // lands on the next vowel.
        flush_units(&mut out, &mut base, &mut mods);
        base = Some(phone);

        if phone.form == crate::string::types::Form::Vowel {
          mods = std::mem::take(&mut pending);
        } else {
          mods = Vec::new();
        }
      }
      Unit::Modifier(modifier) => {
        if modifier.prefix {
          // Attaches to the following base (stress precedes the
          // vowel).
          flush_units(&mut out, &mut base, &mut mods);
          pending.push(modifier);
        } else if base.is_some() {
          mods.push(modifier);
        }
      }
      Unit::Symbol(symbol) => {
        flush_units(&mut out, &mut base, &mut mods);
        out.push(IpaUnit::Symbol(symbol));
      }
    }
  }

  flush_units(&mut out, &mut base, &mut mods);

  out
}

/// IPA to talk spelling.
///
/// The same walk as [`parse_ipa`], rendered. Kept as one scanner so the
/// two cannot drift.
pub fn ipa_to_talk(text: &str) -> String {
  let mut out = String::new();

  for unit in parse_ipa(text) {
    match unit {
      IpaUnit::Phone { base, modifiers } => {
        out.push_str(&combine(&base.talk, &modifiers));
      }
      IpaUnit::Symbol(symbol) => out.push_str(&symbol.talk),
      IpaUnit::Unknown(character) => out.push(character),
    }
  }

  out
}

fn flush_units(
  out: &mut Vec<IpaUnit>,
  base: &mut Option<&'static Phone>,
  mods: &mut Vec<&'static Modifier>,
) {
  if let Some(phone) = base.take() {
    out.push(IpaUnit::Phone {
      base: phone,
      modifiers: std::mem::take(mods),
    });
  }

  mods.clear();
}
