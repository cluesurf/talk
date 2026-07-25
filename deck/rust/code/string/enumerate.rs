//! Every valid canonical sound. Used by the machine build and available to
//! consumers who want the full inventory.

use std::collections::HashSet;

use crate::string::data::phones;
use crate::string::runtime::runtime;
use crate::string::sound::make_sound;
use crate::string::types::{Form, Kind, Modifier, Phone, SoundInfo};

fn attaches(base: &Phone, modifier: &Modifier) -> bool {
  let Some(rule) = &modifier.attaches else {
    return true;
  };

  let place = base.place.as_deref().unwrap_or("");
  let holds = |list: &Option<Vec<String>>, value: &str| -> Option<bool> {
    list
      .as_ref()
      .map(|allowed| allowed.iter().any(|entry| entry == value))
  };

  if holds(&rule.place, place) == Some(false) {
    return false;
  }

  if holds(&rule.not_place, place) == Some(true) {
    return false;
  }

  if holds(&rule.manner, base.manner.as_deref().unwrap_or("")) == Some(false) {
    return false;
  }

  if holds(&rule.voicing, base.voicing.as_deref().unwrap_or("")) == Some(false) {
    return false;
  }

  true
}

/// Choose none or one modifier from each slot, in every combination.
fn slot_combos(mods: &[&'static Modifier]) -> Vec<Vec<&'static Modifier>> {
  // Slots keep first-seen order, so the combinations come out in a stable
  // order across runs.
  let mut slots: Vec<(&str, Vec<&'static Modifier>)> = Vec::new();

  for modifier in mods {
    match slots.iter_mut().find(|(slot, _)| *slot == modifier.slot) {
      Some((_, list)) => list.push(modifier),
      None => slots.push((&modifier.slot, vec![modifier])),
    }
  }

  let mut combos: Vec<Vec<&'static Modifier>> = vec![Vec::new()];

  for (_, options) in slots {
    let mut next = Vec::new();

    for combo in combos {
      // The bare combo first, then one extension per option in this
      // slot, matching the order the TypeScript build emits.
      let extensions: Vec<Vec<&'static Modifier>> = options
        .iter()
        .map(|option| {
          let mut extended = combo.clone();

          extended.push(option);
          extended
        })
        .collect();

      next.push(combo);
      next.extend(extensions);
    }

    combos = next;
  }

  combos
}

/// Every valid canonical sound, in a stable order. Deduped by talk.
pub fn enumerate_sounds() -> Vec<SoundInfo> {
  let state = runtime();
  let mut seen: HashSet<String> = HashSet::new();
  let mut out: Vec<SoundInfo> = Vec::new();

  for base in phones() {
    let pool = match base.form {
      Form::Consonant => &state.consonant_modifiers,
      Form::Vowel => &state.vowel_modifiers,
    };

    let usable: Vec<&'static Modifier> = pool
      .iter()
      .copied()
      .filter(|modifier| attaches(base, modifier))
      .collect();

    for combo in slot_combos(&usable) {
      let sound = make_sound(base, combo);

      if !seen.insert(sound.talk.clone()) {
        continue;
      }

      out.push(SoundInfo {
        talk: sound.talk,
        ipa: sound.ipa,
        simple: sound.simple,
        kind: sound.kind,
      });
    }
  }

  for symbol in state.symbols {
    if !seen.insert(symbol.talk.clone()) {
      continue;
    }

    out.push(SoundInfo {
      talk: symbol.talk.clone(),
      ipa: symbol.ipa.clone(),
      simple: symbol.simple.clone(),
      kind: Kind::Symbol,
    });
  }

  out
}
