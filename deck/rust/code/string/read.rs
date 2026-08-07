//! Read a string as whichever notation it is written in.
//!
//! The two scanners return different shapes: `parse_ipa` gives units that
//! may be symbols or unknown text, `segment` gives Sounds. This flattens
//! both to the one thing an encoder needs, a base with its modifiers.

use crate::space::model::Notation;
use crate::string::convert::{IpaUnit, parse_ipa};
use crate::string::sound::segment;
use crate::string::types::{Modifier, Phone};

pub struct ReadSound {
  pub base: Option<&'static Phone>,
  pub modifiers: Vec<&'static Modifier>,
}

pub fn read_sounds(text: &str, notation: Notation) -> Vec<ReadSound> {
  if notation == Notation::Tone {
    return segment(text)
      .into_iter()
      .map(|sound| ReadSound {
        base: sound.base,
        modifiers: sound.modifiers,
      })
      .collect();
  }

  parse_ipa(text)
    .into_iter()
    .map(|unit| match unit {
      IpaUnit::Phone { base, modifiers, .. } => {
        ReadSound { base: Some(base), modifiers }
      }
      _ => ReadSound { base: None, modifiers: Vec::new() },
    })
    .collect()
}
