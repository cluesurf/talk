//! The runtime state: every lookup the conversions need, built once.

use std::collections::HashMap;
use std::sync::OnceLock;

use unicode_normalization::UnicodeNormalization;

use crate::string::data::{modifiers, phones, token_entries};
use crate::string::symbol::symbols;
use crate::string::types::{Form, Modifier, Phone, SymbolEntry, Unit};
use crate::trie::{build_trie, Trie, TrieBuilder};

pub struct Runtime {
  pub symbols: &'static [SymbolEntry],
  pub consonant_modifiers: Vec<&'static Modifier>,
  pub vowel_modifiers: Vec<&'static Modifier>,
  /// Sound starters (a base or a symbol), keyed by talk.
  pub talk_starter: Trie<Unit>,
  /// Affixes, keyed by talk. Matched only after a base, because a modifier
  /// like `h~` shares its spelling with the base `h~` (ɦ), so which one is
  /// meant depends on position.
  pub talk_modifier: Trie<&'static Modifier>,
  /// Every unit keyed by IPA. IPA has no base/affix spelling clash, so one
  /// trie scans the whole string.
  pub ipa_unit: Trie<Unit>,
  pub machine_by_talk: HashMap<&'static str, &'static str>,
}

/// Normalize so precomposed and combining IPA forms match the same keys.
pub fn nfd(text: &str) -> String {
  text.nfd().collect()
}

/// Rank a phone as a talk-spelling representative (lower is plainer): a real
/// (non-provisional) sound, the shortest IPA, ideally spelled the same in IPA
/// and talk.
///
/// IPA length is counted in UTF-16 code units, as the TypeScript build does, so
/// the astral click letters rank the same in both.
fn rank(phone: &Phone) -> (u8, usize, u8) {
  (
    phone.provisional as u8,
    nfd(&phone.ipa).encode_utf16().count(),
    (phone.ipa != phone.talk) as u8,
  )
}

/// One representative phone per talk spelling (talk to ipa is many to one), so
/// decomposing a sound picks its plainest base. Kept in first-seen order.
fn pick_representatives() -> Vec<&'static Phone> {
  let mut order: Vec<&'static Phone> = Vec::new();
  let mut at_talk: HashMap<&'static str, usize> = HashMap::new();

  for phone in phones() {
    match at_talk.get(phone.talk.as_str()) {
      None => {
        at_talk.insert(&phone.talk, order.len());
        order.push(phone);
      }
      Some(&at) => {
        if rank(phone) < rank(order[at]) {
          order[at] = phone;
        }
      }
    }
  }

  order
}

fn bootstrap() -> Runtime {
  let symbols = symbols();

  let mut starter = TrieBuilder::new();

  for phone in pick_representatives() {
    starter.add(&phone.talk, Unit::Phone(phone));
  }

  for symbol in symbols {
    starter.add(&symbol.talk, Unit::Symbol(symbol));
  }

  let mut ipa = TrieBuilder::new();

  for phone in phones() {
    ipa.add(&nfd(&phone.ipa), Unit::Phone(phone));
  }

  for modifier in modifiers() {
    if !modifier.ipa.is_empty() {
      ipa.add(&nfd(&modifier.ipa), Unit::Modifier(modifier));
    }
  }

  for symbol in symbols {
    ipa.add(&nfd(&symbol.ipa), Unit::Symbol(symbol));
  }

  let machine_by_talk = token_entries()
    .iter()
    .map(|entry| (entry.talk.as_str(), entry.token.as_str()))
    .collect();

  let of_base = |base: Form| -> Vec<&'static Modifier> {
    modifiers().iter().filter(|m| m.base == base).collect()
  };

  Runtime {
    symbols,
    consonant_modifiers: of_base(Form::Consonant),
    vowel_modifiers: of_base(Form::Vowel),
    talk_starter: starter.build(),
    talk_modifier: build_trie(modifiers().iter().map(|m| (m.talk.as_str(), m))),
    ipa_unit: ipa.build(),
    machine_by_talk,
  }
}

pub fn runtime() -> &'static Runtime {
  static CELL: OnceLock<Runtime> = OnceLock::new();

  CELL.get_or_init(bootstrap)
}
