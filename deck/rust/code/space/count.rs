//! How big the sound space is, under every reading of the question.
//!
//! Three counts matter and they differ by orders of magnitude, so a design
//! that says "the inventory" without saying which one is under-specified:
//!
//!   ATTESTED    what some documented language is recorded saying
//!   PRODUCIBLE  what a human vocal tract can make
//!   PERMITTED   what the notation can write, articulation ignored
//!
//! A conlang tool needs PRODUCIBLE, because a designed language draws from
//! sounds nobody happens to use. A corpus index needs ATTESTED. A
//! validator needs PERMITTED.
//!
//! Mirrors `code/space/index.ts` in the TypeScript port.

use std::collections::{HashMap, HashSet};

use unicode_normalization::UnicodeNormalization;

use super::axis::{BaseFeatures, SUPRASEGMENTAL, attaches, ipa_axes};
use super::model::{Notation, Tier};
use crate::string::convert::ipa_to_talk;
use crate::string::data::{modifiers, phones};
use crate::string::runtime::{modifier_attaches, runtime};
use crate::string::sound::{make_sound, segment};
use crate::string::types::{Form, Modifier};

/// Which question is being asked about the space.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Space {
  Producible,
  Permitted,
}

/// talk's slots that describe the syllable rather than the segment.
const TONE_SUPRA: [&str; 4] = ["duration", "stress", "tone", "syllabicity"];

/// The character capacity each tier was designed to encode into.
pub fn capacity(tier: Tier) -> u64 {
  match tier {
    // Hangul syllables with no final consonant, 19 x 21.
    Tier::Seed => 399,
    // Hangul syllables with a vertical medial and a final, 8 x 19 x 27.
    Tier::Band => 4104,
    // Hangul syllables with a compound medial and a final.
    Tier::Mesh => 4104,
  }
}

/// Bytes a count needs, for the tiers that outgrow a character space.
pub fn bytes_for(count: u64) -> usize {
  let bits = 64 - count.max(2).saturating_sub(1).leading_zeros() as usize;

  ((bits + 7) / 8).max(1)
}

fn nfd(text: &str) -> String {
  text.nfd().collect()
}

/// Choose none or one modifier from each slot, in every combination.
fn slot_combos(mods: &[&'static Modifier]) -> Vec<Vec<&'static Modifier>> {
  let mut by_slot: HashMap<&str, Vec<&'static Modifier>> = HashMap::new();
  let mut order: Vec<&str> = Vec::new();

  for modifier in mods {
    if !by_slot.contains_key(modifier.slot.as_str()) {
      order.push(&modifier.slot);
    }
    by_slot.entry(&modifier.slot).or_default().push(modifier);
  }

  let mut combos: Vec<Vec<&'static Modifier>> = vec![Vec::new()];

  for slot in order {
    let options = &by_slot[slot];
    let mut next: Vec<Vec<&'static Modifier>> = Vec::new();

    for combo in &combos {
      next.push(combo.clone());

      for option in options {
        let mut grown = combo.clone();
        grown.push(option);
        next.push(grown);
      }
    }

    combos = next;
  }

  combos
}

fn tone_producible(tier: Tier) -> u64 {
  let state = runtime();

  if tier == Tier::Seed {
    return (state.starter_phones.len() + modifiers().len()) as u64;
  }

  let mut seen: HashSet<String> = HashSet::new();

  for base in &state.starter_phones {
    let pool: Vec<&'static Modifier> = if base.form == Form::Consonant {
      state.consonant_modifiers.clone()
    } else {
      state.vowel_modifiers.clone()
    }
    .into_iter()
    .filter(|modifier| {
      modifier_attaches(base, modifier)
        && (tier == Tier::Mesh
          || !TONE_SUPRA.contains(&modifier.slot.as_str()))
    })
    .collect();

    for combo in slot_combos(&pool) {
      seen.insert(make_sound(base, combo, Vec::new()).talk);
    }
  }

  seen.len() as u64
}

fn ipa_producible(tier: Tier) -> u64 {
  if tier == Tier::Seed {
    let mut seen: HashSet<char> = HashSet::new();

    for phone in phones() {
      seen.extend(nfd(&phone.ipa).chars());
    }

    for (_, groups) in ipa_axes() {
      for group in groups {
        for mark in &group.marks {
          seen.extend(nfd(mark).chars());
        }
      }
    }

    return seen.len() as u64;
  }

  // The chart is the producible base inventory: the IPA assigns a symbol
  // only to an articulation a human can make, and the impossible cells are
  // shaded with no symbol at all.
  let mut total: u64 = 0;

  for phone in phones() {
    let features = BaseFeatures {
      form: phone.form,
      place: phone.place.as_deref(),
      manner: phone.manner.as_deref(),
      voicing: phone.voicing.as_deref(),
    };

    let mut ways: u64 = 1;

    for (name, groups) in ipa_axes() {
      if tier == Tier::Band && SUPRASEGMENTAL.contains(name) {
        continue;
      }

      let options: u64 = groups
        .iter()
        .filter(|group| attaches(&features, &group.rule))
        .map(|group| group.marks.len() as u64)
        .sum();

      // Plus the option of leaving this axis unmarked.
      ways *= options + 1;
    }

    total += ways;
  }

  total
}

fn tone_permitted(tier: Tier) -> u64 {
  let state = runtime();

  if tier == Tier::Seed {
    return (state.starter_phones.len() + modifiers().len()) as u64;
  }

  let mut by_slot: HashMap<&str, u64> = HashMap::new();

  for modifier in
    state.consonant_modifiers.iter().chain(&state.vowel_modifiers)
  {
    if tier == Tier::Band && TONE_SUPRA.contains(&modifier.slot.as_str()) {
      continue;
    }

    *by_slot.entry(&modifier.slot).or_insert(0) += 1;
  }

  let factor: u64 = by_slot.values().map(|options| options + 1).product();

  state.starter_phones.len() as u64 * factor
}

fn ipa_permitted(tier: Tier) -> u64 {
  if tier == Tier::Seed {
    return ipa_producible(Tier::Seed);
  }

  let mut factor: u64 = 1;

  for (name, groups) in ipa_axes() {
    if tier == Tier::Band && SUPRASEGMENTAL.contains(name) {
      continue;
    }

    let marks: u64 =
      groups.iter().map(|group| group.marks.len() as u64).sum();

    factor *= marks + 1;
  }

  phones().len() as u64 * factor
}

/// How many units exist at a tier, under one reading of "exist".
///
/// `attested` needs a corpus and is not answerable here; use
/// [`count_attested`] for it.
pub fn count_space(notation: Notation, tier: Tier, space: Space) -> u64 {
  match (notation, space) {
    (Notation::Ipa, Space::Producible) => ipa_producible(tier),
    (Notation::Tone, Space::Producible) => tone_producible(tier),
    (Notation::Ipa, Space::Permitted) => ipa_permitted(tier),
    (Notation::Tone, Space::Permitted) => tone_permitted(tier),
  }
}

/// IPA marks that are suprasegmental, so `band` can strip them.
fn ipa_supra_marks() -> HashSet<String> {
  let mut out = HashSet::new();

  for (name, groups) in ipa_axes() {
    if !SUPRASEGMENTAL.contains(name) {
      continue;
    }

    for group in groups {
      for mark in &group.marks {
        out.insert(nfd(mark));
      }
    }
  }

  out
}

/// Reduce one source phoneme to the unit a tier would hold.
///
/// Returns `None` when the notation cannot read it, so a caller counting
/// attested units does not credit input that never resolved.
pub fn unit_for(
  phoneme: &str,
  notation: Notation,
  tier: Tier,
) -> Option<Vec<String>> {
  if notation == Notation::Ipa {
    let decomposed = nfd(phoneme);

    return match tier {
      Tier::Seed => {
        Some(decomposed.chars().map(|c| c.to_string()).collect())
      }
      Tier::Mesh => Some(vec![decomposed]),
      Tier::Band => {
        let supra = ipa_supra_marks();
        let stripped: String = decomposed
          .chars()
          .filter(|c| !supra.contains(&c.to_string()))
          .collect();

        if stripped.is_empty() { None } else { Some(vec![stripped]) }
      }
    };
  }

  let talk = ipa_to_talk(phoneme);

  if talk.is_empty() {
    return None;
  }

  let sounds = segment(&talk);

  if tier == Tier::Seed {
    let mut out = Vec::new();

    for sound in &sounds {
      match sound.base {
        None => out.push(sound.talk.clone()),
        Some(base) => {
          out.push(base.talk.clone());
          out.extend(sound.modifiers.iter().map(|m| m.talk.clone()));
        }
      }
    }

    return Some(out);
  }

  let mut parts = String::new();

  for sound in &sounds {
    match sound.base {
      None => parts.push_str(&sound.talk),
      Some(base) => {
        parts.push_str(&base.talk);

        for modifier in &sound.modifiers {
          if tier == Tier::Mesh
            || !TONE_SUPRA.contains(&modifier.slot.as_str())
          {
            parts.push_str(&modifier.talk);
          }
        }
      }
    }
  }

  Some(vec![parts])
}

/// How many distinct units a corpus attests at a tier.
///
/// The corpus is passed in rather than read, because the phoneme lists
/// this is measured against (Phoible and the like) are far too large to
/// ship and change independently of the library.
pub fn count_attested<'a>(
  phonemes: impl IntoIterator<Item = &'a str>,
  notation: Notation,
  tier: Tier,
) -> u64 {
  let mut seen: HashSet<String> = HashSet::new();

  for phoneme in phonemes {
    if let Some(units) = unit_for(phoneme, notation, tier) {
      seen.extend(units);
    }
  }

  seen.len() as u64
}
