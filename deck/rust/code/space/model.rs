//! One shape for both notations, so the codec is written once.
//!
//! A sound is a BASE plus at most one mark per AXIS. That is all the codec
//! needs to know, and both notations fit it: talk's slots and modifiers,
//! and IPA's axes and diacritics.
//!
//! Which marks an axis offers depends on the base, because attachment
//! rules stop a mark applying where the articulation cannot support it. So
//! the radix is per base, not global, and the codec is mixed-radix over a
//! ragged table rather than a flat product.
//!
//! Mirrors `code/space/model.ts` in the TypeScript port.

use std::collections::BTreeMap;
use std::sync::OnceLock;

use unicode_normalization::UnicodeNormalization;

use super::axis::{Attachment, BaseFeatures, attaches, ipa_axes};
use crate::string::data::{modifiers, phones};
use crate::string::runtime::{modifier_attaches, runtime};
use crate::string::types::{Form, Modifier};

/// Which notation the units are spelled in.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Notation {
  Ipa,
  Tone,
}

/// How much of a sound one code holds.
///
///   seed  one atomic unit: a base, or a single mark
///   band  a base with its segmental marks, no suprasegmentals
///   mesh  a base with everything
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Tier {
  Seed,
  Band,
  Mesh,
}

/// A base sound, spelled in whichever notation is in play.
#[derive(Debug, Clone)]
pub struct ModelBase {
  pub key: String,
  pub form: Form,
  pub place: Option<String>,
  pub manner: Option<String>,
  pub voicing: Option<String>,
}

impl ModelBase {
  fn features(&self) -> BaseFeatures<'_> {
    BaseFeatures {
      form: self.form,
      place: self.place.as_deref(),
      manner: self.manner.as_deref(),
      voicing: self.voicing.as_deref(),
    }
  }
}

/// How a mark decides whether it attaches, which differs by notation.
#[derive(Debug, Clone)]
pub enum MarkRule {
  /// An IPA diacritic, checked against the rules in `axis.rs`.
  Ipa(Attachment),
  /// A talk modifier, checked against `modifiers.json`.
  Tone(&'static Modifier),
}

#[derive(Debug, Clone)]
pub struct ModelMark {
  pub key: String,
  rule: MarkRule,
}

impl ModelMark {
  pub fn allows(&self, base: &ModelBase) -> bool {
    match &self.rule {
      MarkRule::Ipa(rule) => attaches(&base.features(), rule),
      MarkRule::Tone(modifier) => {
        // The modifier's own form gate, then its attachment rule.
        let fits = match modifier.base {
          Form::Any => true,
          other => other == base.form,
        };

        if !fits {
          return false;
        }

        // `modifier_attaches` reads a Phone, so a stand-in carries the
        // features across.
        let phone = crate::string::types::Phone {
          ipa: String::new(),
          talk: base.key.clone(),
          xsampa: String::new(),
          simple: String::new(),
          form: base.form,
          place: base.place.clone(),
          manner: base.manner.clone(),
          voicing: base.voicing.clone(),
          height: None,
          backness: None,
          roundedness: None,
          provisional: false,
        };

        modifier_attaches(&phone, modifier)
      }
    }
  }
}

/// One articulatory dimension, and the marks that vary along it.
#[derive(Debug, Clone)]
pub struct ModelAxis {
  pub name: String,
  pub suprasegmental: bool,
  pub marks: Vec<ModelMark>,
}

#[derive(Debug, Clone)]
pub struct Model {
  pub bases: Vec<ModelBase>,
  pub axes: Vec<ModelAxis>,
  /// Every atomic unit: the bases and the marks, for the `seed` tier.
  pub units: Vec<String>,
}

/// talk's slots that describe the syllable rather than the segment.
const TONE_SUPRA: [&str; 4] = ["duration", "stress", "tone", "syllabicity"];

fn nfd(text: &str) -> String {
  text.nfd().collect()
}

fn tone_model() -> Model {
  let mut bases: Vec<ModelBase> = runtime()
    .starter_phones
    .iter()
    .map(|phone| ModelBase {
      key: phone.talk.clone(),
      form: phone.form,
      place: phone.place.clone(),
      manner: phone.manner.clone(),
      voicing: phone.voicing.clone(),
    })
    .collect();

  bases.sort_by(|a, b| a.key.cmp(&b.key));

  // Fine detail is spelled but not encoded. The tone space is budgeted at
  // two bytes and every slot multiplies it, so the marks that exist to be
  // reported rather than compared stay out of the axes and out of the
  // atoms. `code_of` then returns no code for a sound carrying one, which
  // is the honest answer for a notation that does not hold it.
  let coded: Vec<&'static Modifier> =
    modifiers().iter().filter(|one| !one.detail).collect();

  let mut by_slot: BTreeMap<&str, Vec<&'static Modifier>> = BTreeMap::new();

  for modifier in &coded {
    by_slot.entry(&modifier.slot).or_default().push(modifier);
  }

  let axes = by_slot
    .into_iter()
    .map(|(name, mut mods)| {
      mods.sort_by(|a, b| a.talk.cmp(&b.talk));

      ModelAxis {
        name: name.to_string(),
        suprasegmental: TONE_SUPRA.contains(&name),
        marks: mods
          .into_iter()
          .map(|modifier| ModelMark {
            key: modifier.talk.clone(),
            rule: MarkRule::Tone(modifier),
          })
          .collect(),
      }
    })
    .collect();

  let mut units: Vec<String> =
    bases.iter().map(|base| base.key.clone()).collect();
  let mut marks: Vec<String> =
    coded.iter().map(|m| m.talk.clone()).collect();

  marks.sort();
  marks.dedup();
  units.extend(marks);

  Model { bases, axes, units }
}

fn ipa_model() -> Model {
  let mut bases: Vec<ModelBase> = phones()
    .iter()
    .map(|phone| ModelBase {
      key: nfd(&phone.ipa),
      form: phone.form,
      place: phone.place.clone(),
      manner: phone.manner.clone(),
      voicing: phone.voicing.clone(),
    })
    .collect();

  bases.sort_by(|a, b| a.key.cmp(&b.key));

  let axes: Vec<ModelAxis> = ipa_axes()
    .iter()
    .map(|(name, groups)| {
      let mut pairs: Vec<(String, Attachment)> = groups
        .iter()
        .flat_map(|group| {
          group
            .marks
            .iter()
            .map(|mark| (nfd(mark), group.rule.clone()))
        })
        .collect();

      pairs.sort_by(|a, b| a.0.cmp(&b.0));

      ModelAxis {
        name: (*name).to_string(),
        suprasegmental: super::axis::SUPRASEGMENTAL.contains(name),
        marks: pairs
          .into_iter()
          .map(|(key, rule)| ModelMark { key, rule: MarkRule::Ipa(rule) })
          .collect(),
      }
    })
    .collect();

  // Atomic units are single codepoints, so a multi-character base
  // contributes its parts rather than itself.
  let mut atoms: Vec<String> = Vec::new();

  for base in &bases {
    for character in base.key.chars() {
      atoms.push(character.to_string());
    }
  }

  for axis in &axes {
    for mark in &axis.marks {
      for character in mark.key.chars() {
        atoms.push(character.to_string());
      }
    }
  }

  atoms.sort();
  atoms.dedup();

  Model { bases, axes, units: atoms }
}

/// The model for a notation, built once.
pub fn model_for(notation: Notation) -> &'static Model {
  static TONE: OnceLock<Model> = OnceLock::new();
  static IPA: OnceLock<Model> = OnceLock::new();

  match notation {
    Notation::Tone => TONE.get_or_init(tone_model),
    Notation::Ipa => IPA.get_or_init(ipa_model),
  }
}

/// The axes a tier includes. `seed` has none: it holds atoms.
pub fn axes_for(notation: Notation, tier: Tier) -> Vec<&'static ModelAxis> {
  if tier == Tier::Seed {
    return Vec::new();
  }

  model_for(notation)
    .axes
    .iter()
    .filter(|axis| tier == Tier::Mesh || !axis.suprasegmental)
    .collect()
}
