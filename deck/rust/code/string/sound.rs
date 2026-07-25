//! Talk to sounds.

use crate::string::combine::combine;
use crate::string::runtime::runtime;
use crate::string::types::{Kind, Modifier, Phone, Sound, SymbolEntry, Unit};

pub fn make_sound(base: &'static Phone, mods: Vec<&'static Modifier>) -> Sound {
  let talk = combine(&base.talk, &mods);

  let mut ordered = mods;

  ordered.sort_by_key(|modifier| modifier.order);

  let spell = |pick: fn(&Modifier) -> bool, of: fn(&Modifier) -> &str| -> String {
    ordered
      .iter()
      .filter(|modifier| pick(modifier))
      .map(|modifier| of(modifier))
      .collect()
  };

  let is_prefix: fn(&Modifier) -> bool = |modifier| modifier.prefix;
  let is_suffix: fn(&Modifier) -> bool = |modifier| !modifier.prefix;

  let ipa = format!(
    "{}{}{}",
    spell(is_prefix, |m| &m.ipa),
    base.ipa,
    spell(is_suffix, |m| &m.ipa)
  );

  let simple = format!(
    "{}{}{}",
    spell(is_prefix, |m| &m.simple),
    base.simple,
    spell(is_suffix, |m| &m.simple)
  );

  Sound {
    machine: machine_of(&talk),
    talk,
    ipa,
    simple,
    kind: base.form.into(),
    base: Some(base),
    modifiers: ordered,
    raw: false,
  }
}

fn raw_sound(entry: &SymbolEntry) -> Sound {
  Sound {
    talk: entry.talk.clone(),
    ipa: entry.ipa.clone(),
    simple: entry.simple.clone(),
    machine: machine_of(&entry.talk),
    kind: Kind::Symbol,
    base: None,
    modifiers: Vec::new(),
    raw: true,
  }
}

fn machine_of(talk: &str) -> String {
  runtime()
    .machine_by_talk
    .get(talk)
    .map(|token| token.to_string())
    .unwrap_or_default()
}

/// Split a talk string into sounds. A single starter lookup gives the base (or
/// a symbol); a base then swallows the modifiers that follow it, and the sound
/// is re-emitted in canonical order.
pub fn segment(text: &str) -> Vec<Sound> {
  let state = runtime();
  let mut sounds = Vec::new();
  let mut i = 0;

  while i < text.len() {
    let Some((&start, length)) = state.talk_starter.match_at(text, i) else {
      // Unknown character: carry it through so nothing is silently
      // dropped.
      let character = text[i..].chars().next().expect("in-bounds character");

      i += character.len_utf8();

      let character = character.to_string();

      sounds.push(raw_sound(&SymbolEntry {
        talk: character.clone(),
        ipa: character.clone(),
        simple: character,
      }));

      continue;
    };

    i += length;

    match start {
      Unit::Phone(phone) => {
        let mut mods = Vec::new();

        while let Some((&modifier, length)) = state.talk_modifier.match_at(text, i) {
          mods.push(modifier);
          i += length;
        }

        sounds.push(make_sound(phone, mods));
      }
      Unit::Symbol(symbol) => sounds.push(raw_sound(symbol)),
      // The starter trie only holds phones and symbols.
      Unit::Modifier(_) => {}
    }
  }

  sounds
}
