//! Talk to sounds.

use crate::string::combine::combine;
use crate::string::runtime::{modifier_attaches, pick_modifier, runtime};
use crate::string::types::{NO_CODE, Kind, Modifier, Phone, Sound, SymbolEntry, Unit};

pub fn make_sound(
  base: &'static Phone,
  mods: Vec<&'static Modifier>,
  pre: Vec<&'static Modifier>,
) -> Sound {
  let talk = combine(&base.talk, &mods, &pre);

  let mut ordered = mods;

  ordered.sort_by_key(|modifier| modifier.order);

  let mut leading = pre;

  leading.sort_by_key(|modifier| std::cmp::Reverse(modifier.order));

  let lead = |of: fn(&Modifier) -> &str| -> String {
    leading.iter().map(|modifier| of(modifier)).collect()
  };

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
    "{}{}{}{}",
    lead(|m| &m.ipa),
    spell(is_prefix, |m| &m.ipa),
    base.ipa,
    spell(is_suffix, |m| &m.ipa)
  );

  let simple = format!(
    "{}{}{}{}",
    lead(|m| &m.simple),
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
    pre: leading,
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
    pre: Vec::new(),
    raw: true,
  }
}

fn machine_of(talk: &str) -> i64 {
  runtime()
    .machine_by_talk
    .get(talk)
    .copied()
    .unwrap_or(NO_CODE)
}

/// Split a talk string into sounds. A single starter lookup gives the base (or
/// a symbol); a base then swallows the modifiers that follow it, and the sound
/// is re-emitted in canonical order.
pub fn segment(text: &str) -> Vec<Sound> {
  let state = runtime();
  let mut sounds = Vec::new();
  // Modifiers seen before a base, which modify what FOLLOWS: `h~k` is
  // pre-aspirated, `n~d` prenasalized.
  let mut leading: Vec<&'static Modifier> = Vec::new();

  let mut i = 0;

  while i < text.len() {
    // A modifier spelling that outruns the starter match, and is followed
    // by a base that can carry it, modifies what FOLLOWS. No affix
    // spelling is also a starter spelling, so this is unambiguous.
    let start_length = state
      .talk_starter
      .match_at(text, i)
      .map(|(_, length)| length)
      .unwrap_or(0);

    if let Some((options, ahead)) = state.talk_modifier.match_at(text, i) {
      if ahead > start_length {
        // Only a pre-modifier if a base actually follows AND can carry it.
        // Without the first check the longer match wins too eagerly:
        // `h!!` is `h` with extra-short, but `h!` is also the voiceless
        // affix, and taking it would leave a stray `!`.
        if let Some((Unit::Phone(next), _)) =
          state.talk_starter.match_at(text, i + ahead)
        {
          if let Some(modifier) = pick_modifier(options, next.form) {
            if modifier_attaches(next, modifier) {
              leading.push(modifier);
              i += ahead;
              continue;
            }
          }
        }
      }
    }

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

        while let Some((options, length)) = state.talk_modifier.match_at(text, i) {
          // A spelling can mean different things by base form (`@` is
          // non-syllabic on a vowel, syllabic on a consonant), so the base
          // decides which reading applies. A spelling with no reading for
          // this form is not an affix here, and ends the sound.
          let Some(modifier) = pick_modifier(options, phone.form) else {
            break;
          };

          // Attachment breaks a TIE here; it does not reject. The rules
          // keep the enumeration conservative, and a parser enforcing them
          // would refuse valid input wherever a phone's features are
          // incomplete. So a mark moves to the following base only when
          // that base can carry it and this one cannot.
          if !modifier_attaches(phone, modifier) {
            let after = state.talk_starter.match_at(text, i + length);

            if let Some((Unit::Phone(next), _)) = after {
              if modifier_attaches(next, modifier) {
                break;
              }
            }
          }

          mods.push(modifier);
          i += length;
        }

        sounds.push(make_sound(phone, mods, std::mem::take(&mut leading)));
      }
      Unit::Symbol(symbol) => sounds.push(raw_sound(symbol)),
      // The starter trie only holds phones and symbols.
      Unit::Modifier(_) => {}
    }
  }

  // A pre-modifier with nothing after it modifies nothing. Carry the
  // spelling through rather than dropping it, so a caller sees the input
  // was incomplete instead of losing it.
  for modifier in leading {
    sounds.push(raw_sound(&SymbolEntry {
      talk: modifier.talk.clone(),
      ipa: modifier.ipa.clone(),
      simple: modifier.simple.clone(),
    }));
  }

  sounds
}
