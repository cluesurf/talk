//! The public conversions.

use crate::string::combine::combine;
use crate::string::runtime::{nfd, runtime};
use crate::string::sound::segment;
use crate::string::types::{Modifier, Phone, Sound, Unit};

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

pub fn ipa_to_talk(text: &str) -> String {
  let state = runtime();
  let input = nfd(text);
  let mut out = String::new();

  let mut base: Option<&'static Phone> = None;
  let mut mods: Vec<&'static Modifier> = Vec::new();
  // Prefix modifiers waiting for a base.
  let mut pending: Vec<&'static Modifier> = Vec::new();

  let mut i = 0;

  while i < input.len() {
    let Some((&unit, length)) = state.ipa_unit.match_at(&input, i) else {
      // Unknown IPA: carry it through.
      flush(&mut out, &mut base, &mut mods);

      let character = input[i..].chars().next().expect("in-bounds character");

      out.push(character);
      i += character.len_utf8();

      continue;
    };

    i += length;

    match unit {
      Unit::Phone(phone) => {
        // A base begins a new sound. A held stress mark belongs on the
        // vowel of the syllable, so it skips any onset consonants and
        // lands on the next vowel.
        flush(&mut out, &mut base, &mut mods);
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
          flush(&mut out, &mut base, &mut mods);
          pending.push(modifier);
        } else if base.is_some() {
          mods.push(modifier);
        }
      }
      Unit::Symbol(symbol) => {
        flush(&mut out, &mut base, &mut mods);
        out.push_str(&symbol.talk);
      }
    }
  }

  flush(&mut out, &mut base, &mut mods);

  out
}

fn flush(out: &mut String, base: &mut Option<&'static Phone>, mods: &mut Vec<&'static Modifier>) {
  if let Some(phone) = base.take() {
    out.push_str(&combine(&phone.talk, mods));
  }

  mods.clear();
}
