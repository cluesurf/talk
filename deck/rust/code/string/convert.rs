//! The public conversions.

use crate::string::combine::combine;
use crate::string::normalize::normalize_ipa;
use crate::string::runtime::{modifier_attaches, runtime};
use crate::string::sound::segment;
use crate::string::types::{CODE_LIMIT, Modifier, Phone, Sound, SymbolEntry, Unit};

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

/// Encode as machine codes, one 24-bit integer per sound.
///
/// A sound outside the enumerated inventory yields `NO_CODE`, so the vector
/// always has one entry per sound and a caller can see what failed instead of
/// silently losing a position.
pub fn machine(text: &str) -> Vec<i64> {
  segment(text)
    .into_iter()
    .map(|sound| sound.machine)
    .collect()
}

/// Encode as machine codes packed to three bytes each, big-endian.
///
/// A code is 24 bits by construction, so the buffer is exactly three times the
/// sound count with no framing needed. `NO_CODE` has no three-byte form, so an
/// unassigned sound is written as `CODE_LIMIT`.
pub fn machine_bytes(text: &str) -> Vec<u8> {
  let mut out = Vec::new();

  for raw in machine(text) {
    let code = if raw < 0 { CODE_LIMIT } else { raw };

    out.push(((code >> 16) & 0xff) as u8);
    out.push(((code >> 8) & 0xff) as u8);
    out.push((code & 0xff) as u8);
  }

  out
}

/// Decode a three-byte-per-code buffer back into machine codes.
pub fn machine_codes(data: &[u8]) -> Vec<i64> {
  data
    .chunks_exact(3)
    .map(|chunk| {
      ((chunk[0] as i64) << 16) | ((chunk[1] as i64) << 8) | (chunk[2] as i64)
    })
    .collect()
}

/// The block machine text encodes into: 4,096 contiguous CJK ideographs
/// starting at U+4E00. Printable, no control characters, no combining marks
/// and no case folding, so a database can hold it in an ordinary text column
/// and index it with trigrams.
const TEXT_BASE: u32 = 0x4e00;
const TEXT_SHIFT: u32 = 12;
const TEXT_MASK: i64 = 0xfff;

/// Encode as machine text: two characters per sound, fixed width.
///
/// A fixed width per sound is what makes prefix and substring search
/// meaningful, since a match on a character boundary is always a match on a
/// sound boundary.
pub fn machine_text(text: &str) -> String {
  let mut out = String::new();

  for raw in machine(text) {
    let code = if raw < 0 { CODE_LIMIT } else { raw };
    let high = TEXT_BASE + ((code >> TEXT_SHIFT) & TEXT_MASK) as u32;
    let low = TEXT_BASE + (code & TEXT_MASK) as u32;

    out.push(char::from_u32(high).unwrap_or('\u{4e00}'));
    out.push(char::from_u32(low).unwrap_or('\u{4e00}'));
  }

  out
}

/// Decode machine text back into machine codes.
pub fn machine_text_codes(text: &str) -> Vec<i64> {
  text
    .chars()
    .collect::<Vec<char>>()
    .chunks_exact(2)
    .map(|pair| {
      let high = (pair[0] as u32 - TEXT_BASE) as i64;
      let low = (pair[1] as u32 - TEXT_BASE) as i64;

      (high << TEXT_SHIFT) | low
    })
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
    /// Modifiers preceding the base: pre-aspiration, prenasalization and
    /// the like. Position carries meaning, `ʰk` and `kʰ` differing.
    pre: Vec<&'static Modifier>,
  },
  Symbol(&'static SymbolEntry),
  Unknown(char),
  /// The units a tie joined into one segment. The parts keep their own
  /// identities and the binding is a claim about them, not a new entry in
  /// the catalog.
  Bound(Vec<IpaUnit>),
}

/// The tie, which joins the letters on either side into one segment.
const TIE: char = '\u{0361}';

/// Fold each tie into a binder on the units it joins.
///
/// THE TIE IS NOT A CHARACTER TO CARRY. It says the letters either side of it
/// are ONE segment, which is a claim about them rather than a thing standing
/// between them, and carrying it through as a symbol left talk unable to say
/// how far the binding reached.
///
/// Read here, after the walk, because a tie is only meaningful once both sides
/// exist. A run of them binds one group: `t͡s͡ʃ` is three letters tied twice, so
/// it is one segment of three rather than two of two.
///
/// A TIE WITH NOTHING TO JOIN IS KEPT AS IT WAS. A leading or trailing one is a
/// source that wrote it loosely, and dropping it would be inventing a segment
/// boundary the source did not give.
fn bind_ties(units: Vec<IpaUnit>) -> Vec<IpaUnit> {
  if !units.iter().any(|one| matches!(one, IpaUnit::Unknown(c) if *c == TIE)) {
    return units;
  }

  let mut out: Vec<IpaUnit> = Vec::new();
  let mut at = 0;

  while at < units.len() {
    if !matches!(&units[at], IpaUnit::Unknown(c) if *c == TIE) {
      out.push(units[at].clone());
      at += 1;
      continue;
    }

    let after = units.get(at + 1);

    if out.is_empty()
      || after.is_none()
      || matches!(after, Some(IpaUnit::Unknown(_)))
    {
      out.push(units[at].clone());
      at += 1;
      continue;
    }

    // Grow the group while ties keep coming, so `t͡s͡ʃ` binds all three.
    let mut parts = vec![out.pop().expect("checked non-empty")];

    parts.push(after.expect("checked present").clone());

    let mut next = at + 2;

    while next + 1 < units.len()
      && matches!(&units[next], IpaUnit::Unknown(c) if *c == TIE)
      && !matches!(&units[next + 1], IpaUnit::Unknown(_))
    {
      parts.push(units[next + 1].clone());
      next += 2;
    }

    out.push(IpaUnit::Bound(parts));
    at = next;
  }

  out
}

/// One parsed unit, spelled in talk.
fn unit_to_talk(unit: &IpaUnit) -> String {
  match unit {
    IpaUnit::Phone { base, modifiers, pre } => combine(&base.talk, modifiers, pre),
    IpaUnit::Symbol(symbol) => symbol.talk.clone(),
    IpaUnit::Unknown(character) => character.to_string(),
    IpaUnit::Bound(parts) => {
      // The binder counts, so a reader knows how far it reaches without
      // inferring it from where a character sits.
      let inner: String = parts.iter().map(unit_to_talk).collect();
      let count = if parts.len() > 2 {
        parts.len().to_string()
      } else {
        String::new()
      };

      format!("{inner}<B{count}>")
    }
  }
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
  let input = normalize_ipa(text);
  let mut out: Vec<IpaUnit> = Vec::new();

  let mut base: Option<&'static Phone> = None;
  let mut mods: Vec<&'static Modifier> = Vec::new();
  // Prefix modifiers waiting for a base.
  let mut pending: Vec<&'static Modifier> = Vec::new();
  let mut pre: Vec<&'static Modifier> = Vec::new();
  let mut leading: Vec<&'static Modifier> = Vec::new();

  let mut i = 0;

  while i < input.len() {
    let Some((&unit, length)) = state.ipa_unit.match_at(&input, i) else {
      flush_units(&mut out, &mut base, &mut mods, &mut pre);

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
        flush_units(&mut out, &mut base, &mut mods, &mut pre);
        base = Some(phone);
        pre = std::mem::take(&mut leading);

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
          flush_units(&mut out, &mut base, &mut mods, &mut pre);
          pending.push(modifier);
        } else if base.is_some_and(|phone| {
          modifier_attaches(phone, modifier)
            // Attachment breaks a tie rather than rejecting: without a
            // base ahead that can carry the mark, it stays here.
            || !matches!(
              state.ipa_unit.match_at(&input, i).map(|(unit, _)| unit),
              Some(Unit::Phone(_))
            )
        }) {
          mods.push(modifier);
        } else {
          // Either nothing precedes it, or what precedes it cannot carry
          // it. Both mean the mark belongs to what FOLLOWS: `ʰk` is
          // pre-aspirated, `aʰk` is `a` then `ʰk`.
          leading.push(modifier);
        }
      }
      Unit::Symbol(symbol) => {
        flush_units(&mut out, &mut base, &mut mods, &mut pre);
        out.push(IpaUnit::Symbol(symbol));
      }
    }
  }

  flush_units(&mut out, &mut base, &mut mods, &mut pre);

  bind_ties(out)
}

/// IPA to talk spelling.
///
/// The same walk as [`parse_ipa`], rendered. Kept as one scanner so the
/// two cannot drift.
pub fn ipa_to_talk(text: &str) -> String {
  parse_ipa(text).iter().map(unit_to_talk).collect()
}

fn flush_units(
  out: &mut Vec<IpaUnit>,
  base: &mut Option<&'static Phone>,
  mods: &mut Vec<&'static Modifier>,
  pre: &mut Vec<&'static Modifier>,
) {
  if let Some(phone) = base.take() {
    out.push(IpaUnit::Phone {
      base: phone,
      modifiers: std::mem::take(mods),
      pre: std::mem::take(pre),
    });
  }

  mods.clear();
  pre.clear();
}
