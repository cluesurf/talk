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
  /// One phone per talk spelling: the base inventory a talk string can
  /// decompose into.
  pub base_phones: Vec<&'static Phone>,
  /// The phones that BEGIN a sound: `base_phones` minus the ones already
  /// reachable as another phone plus modifiers. The scanner and the
  /// enumeration both work from this, so a sound has exactly one spelling and
  /// that spelling re-parses to itself.
  pub starter_phones: Vec<&'static Phone>,
  pub consonant_modifiers: Vec<&'static Modifier>,
  pub vowel_modifiers: Vec<&'static Modifier>,
  /// Sound starters (a base or a symbol), keyed by talk.
  pub talk_starter: Trie<Unit>,
  /// Affixes, keyed by talk. Matched only after a base, because a modifier
  /// like `h~` shares its spelling with the base `h~` (ɦ), so which one is
  /// meant depends on position.
  /// The value is every modifier sharing that spelling, because one talk
  /// affix can mean different things on a consonant and on a vowel. `@` is
  /// syllabicity flipped away from the default: a vowel is syllabic unless
  /// marked, a consonant is not, so `@` reads as non-syllabic on `i@` and
  /// syllabic on `n@`. The base's form picks between them.
  pub talk_modifier: Trie<Vec<&'static Modifier>>,
  /// Every unit keyed by IPA. IPA has no base/affix spelling clash, so one
  /// trie scans the whole string.
  pub ipa_unit: Trie<Unit>,
  pub machine_by_talk: HashMap<&'static str, i64>,
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

/// Whether a modifier can attach to a base, per its `attaches` rule.
///
/// This is what decides an otherwise ambiguous sequence. `pʰk` is `pʰ` then
/// `k`, because a plosive takes aspiration. `aʰk` is `a` then `ʰk`, because
/// a vowel does not, so the mark must belong to what follows.
pub fn modifier_attaches(base: &Phone, modifier: &Modifier) -> bool {
  let Some(rule) = &modifier.attaches else {
    return true;
  };

  let place = base.place.as_deref().unwrap_or("");
  let manner = base.manner.as_deref().unwrap_or("");
  let voicing = base.voicing.as_deref().unwrap_or("");

  if let Some(allowed) = &rule.place {
    if !allowed.iter().any(|value| value == place) {
      return false;
    }
  }

  if let Some(denied) = &rule.not_place {
    if denied.iter().any(|value| value == place) {
      return false;
    }
  }

  if let Some(allowed) = &rule.manner {
    if !allowed.iter().any(|value| value == manner) {
      return false;
    }
  }

  if let Some(allowed) = &rule.voicing {
    if !allowed.iter().any(|value| value == voicing) {
      return false;
    }
  }

  true
}

/// Group modifiers by talk spelling, so a spelling meaning one thing on a
/// consonant and another on a vowel keeps both readings. Longest first, so a
/// two-character affix is tried before its prefix.
fn by_talk_spelling() -> Vec<(&'static str, Vec<&'static Modifier>)> {
  let mut order: Vec<&'static str> = Vec::new();
  let mut grouped: HashMap<&'static str, Vec<&'static Modifier>> =
    HashMap::new();

  for modifier in modifiers() {
    let talk = modifier.talk.as_str();

    if !grouped.contains_key(talk) {
      order.push(talk);
    }

    grouped.entry(talk).or_default().push(modifier);
  }

  order.sort_by_key(|talk| std::cmp::Reverse(talk.len()));

  order
    .into_iter()
    .map(|talk| (talk, grouped[talk].clone()))
    .collect()
}

/// Pick the reading of a talk affix that fits the base it follows. An `Any`
/// modifier applies to either form, so it is the fallback.
pub fn pick_modifier(
  options: &[&'static Modifier],
  form: Form,
) -> Option<&'static Modifier> {
  options
    .iter()
    .find(|m| m.base == form)
    .or_else(|| options.iter().find(|m| m.base == Form::Any))
    .copied()
}

/// The IPA a base plus modifiers spells, in the modifiers' declared order.
/// Mirrors `spell` in convert, kept here because runtime builds first.
fn spell_ipa(base: &Phone, mods: &[&'static Modifier]) -> String {
  let mut ordered: Vec<&'static Modifier> = mods.to_vec();
  ordered.sort_by_key(|m| m.order);

  let mut out = String::new();

  for modifier in ordered.iter().filter(|m| m.prefix) {
    out.push_str(&modifier.ipa);
  }

  out.push_str(&base.ipa);

  for modifier in ordered.iter().filter(|m| !m.prefix) {
    out.push_str(&modifier.ipa);
  }

  out
}

/// Whether a phone's talk spelling is already reachable as another phone plus
/// modifiers.
///
/// Many phones are spelled compositionally: `p!` is `p` with the ejective
/// affix, `mh!` is `m` with voiceless, `n$` is `n` with dental. Listing those
/// as sound STARTERS makes segmentation ambiguous, because a starter is
/// matched greedily and swallows an affix the next modifier needed.
///
/// Such a phone stays in the IPA trie and in the enumerated inventory. It just
/// does not begin a sound on its own.
fn reconstructible(
  phone: &'static Phone,
  by_talk: &[(&'static str, &'static Phone)],
  affixes: &[(&'static str, Vec<&'static Modifier>)],
) -> bool {
  for (candidate_talk, candidate) in by_talk {
    if *candidate_talk == phone.talk.as_str() {
      continue;
    }

    let Some(mut rest) = phone.talk.strip_prefix(candidate_talk) else {
      continue;
    };

    let mut found: Vec<&'static Modifier> = Vec::new();
    let mut progressed = true;

    while !rest.is_empty() && progressed {
      progressed = false;

      for (affix, options) in affixes {
        let Some(next) = rest.strip_prefix(affix) else {
          continue;
        };

        let Some(modifier) = pick_modifier(options, candidate.form) else {
          continue;
        };

        found.push(modifier);
        rest = next;
        progressed = true;
        break;
      }
    }

    if !rest.is_empty() {
      continue;
    }

    // The spelling decomposes, but that only makes the phone REDUNDANT if the
    // composition also names the same sound. `y$` decomposes into `y` plus
    // dental, yet the phone is ɥ, so it is a sound in its own right and has to
    // keep starting one.
    if nfd(&spell_ipa(candidate, &found)) == nfd(&phone.ipa) {
      return true;
    }
  }

  false
}

fn bootstrap() -> Runtime {
  let symbols = symbols();

  let base_phones = pick_representatives();
  let affixes = by_talk_spelling();

  let by_talk: Vec<(&'static str, &'static Phone)> = base_phones
    .iter()
    .map(|phone| (phone.talk.as_str(), *phone))
    .collect();

  let starter_phones: Vec<&'static Phone> = base_phones
    .iter()
    .filter(|phone| !reconstructible(phone, &by_talk, &affixes))
    .copied()
    .collect();

  let mut starter = TrieBuilder::new();

  for phone in &starter_phones {
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
    .map(|entry| (entry.talk.as_str(), entry.code))
    .collect();

  let of_base = |base: Form| -> Vec<&'static Modifier> {
    modifiers()
      .iter()
      .filter(|m| m.base == base || m.base == Form::Any)
      .collect()
  };

  Runtime {
    symbols,
    base_phones,
    starter_phones,
    consonant_modifiers: of_base(Form::Consonant),
    vowel_modifiers: of_base(Form::Vowel),
    talk_starter: starter.build(),
    talk_modifier: build_trie(
      affixes.iter().map(|(talk, list)| (*talk, list.clone())),
    ),
    ipa_unit: ipa.build(),
    machine_by_talk,
  }
}

pub fn runtime() -> &'static Runtime {
  static CELL: OnceLock<Runtime> = OnceLock::new();

  CELL.get_or_init(bootstrap)
}
