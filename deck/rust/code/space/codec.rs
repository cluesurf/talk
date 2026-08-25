//! Dense integer codes for every tier of both notations.
//!
//! The code is COMPUTED, not looked up. `ipa mesh` holds 166 million
//! sounds, which no table wants to be, so each code is a mixed-radix
//! index: a base picks an offset, and each axis contributes a digit whose
//! radix is how many marks that axis offers THAT base. Attachment rules
//! make the radix ragged, so the offsets are prefix sums over per-base
//! products.
//!
//! The result is a bijection onto `[0, producible)`, which is what makes
//! the byte widths in [`byte_width`] tight rather than generous.
//!
//! Mirrors `code/space/codec.ts` in the TypeScript port.

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

use super::model::{
  Model, ModelAxis, ModelBase, Notation, Tier, axes_for, model_for,
};

/// A sound broken into the parts a code is built from.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Composition {
  pub base: String,
  /// One mark per axis, or `None` where the axis is unmarked.
  pub marks: Vec<Option<String>>,
}

/// How many marks an axis offers a base, plus the option of none.
fn radix(axis: &ModelAxis, base: &ModelBase) -> u64 {
  1 + axis.marks.iter().filter(|mark| mark.allows(base)).count() as u64
}

#[derive(Debug, Clone)]
struct Layout {
  axes: Vec<&'static ModelAxis>,
  /// Radix per base, per axis.
  radices: Vec<Vec<u64>>,
  /// Where each base's block starts.
  offsets: Vec<u64>,
  size: u64,
}

fn layouts() -> &'static Mutex<HashMap<(Notation, Tier), &'static Layout>> {
  static CELL: OnceLock<Mutex<HashMap<(Notation, Tier), &'static Layout>>> =
    OnceLock::new();

  CELL.get_or_init(|| Mutex::new(HashMap::new()))
}

/// The offset table for a tier, built once.
fn layout_for(notation: Notation, tier: Tier) -> &'static Layout {
  let key = (notation, tier);

  if let Some(found) = layouts().lock().expect("layout lock").get(&key) {
    return found;
  }

  let model: &Model = model_for(notation);
  let axes = axes_for(notation, tier);

  let mut radices: Vec<Vec<u64>> = Vec::with_capacity(model.bases.len());
  let mut offsets: Vec<u64> = Vec::with_capacity(model.bases.len());
  let mut size: u64 = 0;

  for base in &model.bases {
    let row: Vec<u64> =
      axes.iter().map(|axis| radix(axis, base)).collect();

    offsets.push(size);
    size += row.iter().product::<u64>();
    radices.push(row);
  }

  // Leaked so the layout can be handed out as `'static`, which is right
  // for a table built once and never dropped.
  let built: &'static Layout =
    Box::leak(Box::new(Layout { axes, radices, offsets, size }));

  layouts().lock().expect("layout lock").insert(key, built);

  built
}

/// How many codes a tier has, which is the producible count.
pub fn size_of(notation: Notation, tier: Tier) -> u64 {
  if tier == Tier::Seed {
    return model_for(notation).units.len() as u64;
  }

  layout_for(notation, tier).size
}

/// Bytes one code needs, so a caller can pack to a fixed width.
///
/// Sized to the tier rather than to a single global width, since `tone
/// seed` fits in one byte and `ipa mesh` needs four.
pub fn byte_width(notation: Notation, tier: Tier) -> usize {
  let size = size_of(notation, tier).max(2);
  let bits = 64 - (size - 1).leading_zeros() as usize;

  ((bits + 7) / 8).clamp(1, 4)
}

/// Turn a composition into its code.
///
/// Fails on a base or mark the tier does not hold, because a silent
/// fallback would put a wrong sound at a real code.
pub fn encode_unit(
  composition: &Composition,
  notation: Notation,
  tier: Tier,
) -> Result<u64, String> {
  let model = model_for(notation);

  if tier == Tier::Seed {
    return model
      .units
      .iter()
      .position(|unit| *unit == composition.base)
      .map(|at| at as u64)
      .ok_or_else(|| format!("unknown seed unit {}", composition.base));
  }

  let layout = layout_for(notation, tier);
  let at = model
    .bases
    .iter()
    .position(|base| base.key == composition.base)
    .ok_or_else(|| format!("unknown base {}", composition.base))?;

  let base = &model.bases[at];
  let row = &layout.radices[at];
  let mut local: u64 = 0;

  for (axis_at, axis) in layout.axes.iter().enumerate() {
    let chosen = composition.marks.get(axis_at).and_then(|m| m.as_deref());

    // Digit 0 is "unmarked"; the allowed marks follow in their stable
    // order, so a digit means the same thing for every base offering it.
    let mut digit: u64 = 0;

    if let Some(want) = chosen {
      let mut seen: u64 = 0;

      for mark in &axis.marks {
        if !mark.allows(base) {
          continue;
        }

        seen += 1;

        if mark.key == want {
          digit = seen;
          break;
        }
      }

      if digit == 0 {
        return Err(format!(
          "{} does not attach to {}",
          want, composition.base
        ));
      }
    }

    local = local * row[axis_at] + digit;
  }

  Ok(layout.offsets[at] + local)
}

/// Turn a code back into its composition.
pub fn decode_unit(
  code: u64,
  notation: Notation,
  tier: Tier,
) -> Result<Composition, String> {
  let model = model_for(notation);

  if tier == Tier::Seed {
    return model
      .units
      .get(code as usize)
      .map(|unit| Composition { base: unit.clone(), marks: Vec::new() })
      .ok_or_else(|| format!("code {code} out of range"));
  }

  let layout = layout_for(notation, tier);

  if code >= layout.size {
    return Err(format!("code {code} out of range"));
  }

  // The offsets ascend, so the base is the last block starting at or
  // before the code.
  let mut low = 0usize;
  let mut high = layout.offsets.len() - 1;

  while low < high {
    let middle = low + (high + 1 - low) / 2;

    if layout.offsets[middle] <= code {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  let base = &model.bases[low];
  let row = &layout.radices[low];

  let mut local = code - layout.offsets[low];
  let mut marks: Vec<Option<String>> = vec![None; layout.axes.len()];

  for axis_at in (0..layout.axes.len()).rev() {
    let digit = local % row[axis_at];
    local /= row[axis_at];

    if digit == 0 {
      continue;
    }

    let allowed: Vec<_> = layout.axes[axis_at]
      .marks
      .iter()
      .filter(|mark| mark.allows(base))
      .collect();

    marks[axis_at] = Some(allowed[(digit - 1) as usize].key.clone());
  }

  Ok(Composition { base: base.key.clone(), marks })
}

/// The composition of a parsed sound, ready to encode.
///
/// A `Sound` already carries its base and modifiers; this only has to put
/// one mark per axis in the order the codec expects, leaving unmarked axes
/// `None`.
pub fn composition_of(
  base: &crate::string::types::Phone,
  modifiers: &[&crate::string::types::Modifier],
  notation: Notation,
  tier: Tier,
) -> Composition {
  let axes = axes_for(notation, tier);

  // The model keys IPA bases by their IPA spelling and tone bases by their
  // talk spelling, so the composition has to match the notation it is
  // being encoded in.
  use unicode_normalization::UnicodeNormalization;

  let key_of = |ipa: &str, talk: &str| -> String {
    if notation == Notation::Ipa { ipa.nfd().collect() } else { talk.to_string() }
  };

  Composition {
    base: key_of(&base.ipa, &base.talk),
    marks: axes
      .iter()
      .map(|axis| {
        modifiers
          .iter()
          // Fine detail contributes no digit to the TONE space, which is
          // deliberately coarser and does not hold these marks. It has to
          // be skipped rather than left to fail: `encode_unit` refuses a
          // mark its axis does not offer, so a breathy `b` would have no
          // code at all instead of encoding as the `b` it coarsens to.
          // That is what every phonetic index built on these codes has
          // always meant by it.
          //
          // The IPA space is lossless and keys its axes off the IPA marks
          // themselves, so it still encodes the detail it can hold.
          .find(|modifier| {
            modifier.slot == axis.name
              && !(notation == Notation::Tone && modifier.detail)
          })
          .map(|modifier| key_of(&modifier.ipa, &modifier.talk))
      })
      .collect(),
  }
}

/// The machine code for a parsed sound, computed rather than looked up.
///
/// This is what removed the registry: `tokens.json` held 91,332 assigned
/// codes and shipped 4.5MB of data for an answer the model can derive. A
/// sound outside the space yields `NO_CODE`.
pub fn code_of(
  base: &crate::string::types::Phone,
  modifiers: &[&crate::string::types::Modifier],
  notation: Notation,
  tier: Tier,
) -> i64 {
  let composition = composition_of(base, modifiers, notation, tier);

  encode_unit(&composition, notation, tier)
    .map(|code| code as i64)
    .unwrap_or(crate::string::types::NO_CODE)
}

/// Encode a whole string at a notation and tier.
///
/// The input is read as the notation says: an IPA string for `Ipa`, a tone
/// string for `Tone`. At `Seed` a sound yields SEVERAL codes, one per
/// atomic unit, because that tier holds parts rather than wholes.
///
/// A unit the tier cannot hold yields `NO_CODE`, so the vector always
/// lines up with the input and a caller can see what failed.
pub fn machine(text: &str, r#type: Notation, system: Tier) -> Vec<i64> {
  use crate::string::read::read_sounds;
  use unicode_normalization::UnicodeNormalization;

  let mut out: Vec<i64> = Vec::new();

  let push = |unit: &str, out: &mut Vec<i64>| {
    let composition =
      Composition { base: unit.to_string(), marks: Vec::new() };

    out.push(
      encode_unit(&composition, r#type, system)
        .map(|code| code as i64)
        .unwrap_or(crate::string::types::NO_CODE),
    );
  };

  for sound in read_sounds(text, r#type) {
    let Some(base) = sound.base else {
      out.push(crate::string::types::NO_CODE);
      continue;
    };

    if system == Tier::Seed {
      // The base and each mark are separate units here. IPA seed units are
      // single codepoints, so a multi-character base contributes its parts.
      if r#type == Notation::Ipa {
        for character in base.ipa.nfd() {
          push(&character.to_string(), &mut out);
        }

        for modifier in &sound.modifiers {
          for character in modifier.ipa.nfd() {
            push(&character.to_string(), &mut out);
          }
        }
      } else {
        push(&base.talk, &mut out);

        for modifier in &sound.modifiers {
          push(&modifier.talk, &mut out);
        }
      }

      continue;
    }

    out.push(code_of(base, &sound.modifiers, r#type, system));
  }

  out
}

/// The block `machine_text` draws from: contiguous CJK ideographs.
/// Printable, no control characters, no combining marks and no case
/// folding, so a database can index it with trigrams.
const TEXT_BASE: u32 = 0x4e00;

/// Encode as text: a fixed number of characters per code.
///
/// The vector form is what a model consumes; this is what a text index
/// consumes. A fixed width means a match on a character boundary is always
/// a match on a unit boundary.
pub fn machine_text(text: &str, r#type: Notation, system: Tier) -> String {
  let width = byte_width(r#type, system);
  let mut out = String::new();

  for raw in machine(text, r#type, system) {
    let code = if raw < 0 {
      size_of(r#type, system)
    } else {
      raw as u64
    };

    // Six bits per character, so the block stays inside one contiguous run.
    for at in (0..width).rev() {
      let point = TEXT_BASE + ((code >> (at * 6)) & 0x3f) as u32;
      out.push(char::from_u32(point).unwrap_or('\u{4e00}'));
    }
  }

  out
}

/// Encode as bytes, the tier's fixed width per code, big-endian.
pub fn machine_bytes(
  text: &str,
  r#type: Notation,
  system: Tier,
) -> Vec<u8> {
  let codes: Vec<u64> = machine(text, r#type, system)
    .into_iter()
    .map(|code| if code < 0 { 0 } else { code as u64 })
    .collect();

  pack(&codes, r#type, system)
}

/// Pack codes to the tier's fixed byte width, big-endian.
pub fn pack(codes: &[u64], notation: Notation, tier: Tier) -> Vec<u8> {
  let width = byte_width(notation, tier);
  let mut out = Vec::with_capacity(codes.len() * width);

  for code in codes {
    for byte in (0..width).rev() {
      out.push(((code >> (byte * 8)) & 0xff) as u8);
    }
  }

  out
}

/// Read codes back from a fixed-width buffer.
pub fn unpack(bytes: &[u8], notation: Notation, tier: Tier) -> Vec<u64> {
  let width = byte_width(notation, tier);

  bytes
    .chunks_exact(width)
    .map(|chunk| {
      chunk.iter().fold(0u64, |code, byte| code * 256 + *byte as u64)
    })
    .collect()
}
