//! Fold the many ways IPA gets written down into the one this library reads.
//!
//! Mirrors `code/string/normalize.ts` in the TypeScript port.

use std::collections::{HashMap, HashSet};
use std::sync::OnceLock;

use unicode_normalization::UnicodeNormalization;

/// Characters that mean the same thing as a character the parser knows, and
/// are replaced one for one.
///
/// WITHDRAWN SYMBOLS. `ʆ` and `ʓ` carried the palatal hook, which the IPA
/// withdrew in 1989 in favour of a following superscript j.
///
/// SANCTIONED ABBREVIATIONS. `ɚ` and `ɝ` are the IPA's own shorthand for a
/// rhotic schwa.
///
/// LOOKALIKES. A transcription typed on a normal keyboard reaches for ASCII
/// `g`, `:` and `'` where the IPA wants `ɡ`, `ː` and `ʼ`.
fn replace() -> &'static HashMap<char, &'static str> {
  static CELL: OnceLock<HashMap<char, &'static str>> = OnceLock::new();

  CELL.get_or_init(|| {
    [
      // Withdrawn 1989, palatal hook.
      ('ʆ', "ʃʲ"),
      ('ʓ', "ʒʲ"),
      // IPA-sanctioned abbreviations for rhotic vowels.
      ('ɚ', "ə˞"),
      ('ɝ', "ɜ˞"),
      // ASCII lookalikes.
      ('g', "ɡ"),
      (':', "ː"),
      ('\'', "ʼ"),
      ('?', "ʔ"),
      (',', "\u{0329}"),
      // Pre-aspiration, which this encoding does not separate from
      // aspiration.
      ('ʱ', "ʰ"),
      // Sinological letters for the alveolo-palatal series, approximate.
      ('ȵ', "ɲ"),
      ('ȶ', "c"),
      ('ȡ', "ɟ"),
      ('ȴ', "ʎ"),
      // ARCHIPHONEMES, the one lossy choice in this table. `R` is an
      // underspecified rhotic, `N` a placeless nasal, `ᴅ` an underspecified
      // stop. Each stands for a SET of realizations the source declined to
      // choose between, so picking one asserts what the description refused
      // to. Mapped anyway, because a caller matching against a catalog needs
      // a segment rather than a failure.
      ('R', "r"),
      ('N', "n"),
      ('ᴅ', "d"),
    ]
    .into_iter()
    .collect()
  })
}

/// Chao tone letters, extra-low to extra-high.
const TONE_DIGIT: [(char, char); 5] =
  [('1', '˩'), ('2', '˨'), ('3', '˧'), ('4', '˦'), ('5', '˥')];

/// Superscript digits, which several sources use for tone instead of Chao
/// letters. `ma³³` and `ma˧˧` are the same word.
const SUPERSCRIPT_DIGIT: [(char, char); 5] =
  [('¹', '1'), ('²', '2'), ('³', '3'), ('⁴', '4'), ('⁵', '5')];

fn tone_for(digit: char) -> Option<char> {
  TONE_DIGIT
    .iter()
    .find(|(from, _)| *from == digit)
    .map(|(_, to)| *to)
}

/// The ring above is the same feature as the ring below, voiceless. IPA uses
/// the one above when a descender leaves no room underneath.
const RING_ABOVE: char = '\u{030a}';
const RING_BELOW: char = '\u{0325}';

/// Not phonetic content: the ties binding an affricate, and the marks some
/// sources use for syllable and morpheme edges.
const DROP: [char; 4] = ['\u{0361}', '\u{035c}', '.', '\u{203f}'];

/// Fine phonetic detail talk does not encode, removed so the segment
/// underneath still resolves. LOSSY and deliberately so.
fn detail() -> &'static HashSet<char> {
  static CELL: OnceLock<HashSet<char>> = OnceLock::new();

  CELL.get_or_init(|| {
    [
      '\u{0324}', // breathy
      '\u{0320}', // retracted
      '\u{0330}', // creaky
      '\u{031f}', // advanced
      '\u{033a}', // apical
      '\u{033b}', // laminal
      '\u{031e}', // lowered
      '\u{0308}', // centralized
      '\u{02de}', // rhotic
      '\u{0319}', // retracted tongue root
      '\u{031d}', // raised
      '\u{02d4}', // raised, spacing form
      '\u{02d5}', // lowered, spacing form
      '\u{031c}', // less rounded
      '\u{2193}', // downstep
      '\u{033d}', // mid-centralized
      '\u{0339}', // more rounded
      '\u{0318}', // advanced tongue root
      '\u{032c}', // voiced, redundant against the base
      '\u{031a}', // no audible release
      '\u{033c}', // linguolabial
      // Phoible's own extensions, defined on its conventions page.
      '\u{0348}', // fortis
      '\u{0349}', // lenis
      '\u{0353}', // frictionalized
      '\u{0347}', // non-sibilant coronal
      '\u{1d31}', // sphincteric phonation
    ]
    .into_iter()
    .collect()
  })
}

/// The canonical order for the marks that follow a base, by articulatory
/// axis, innermost first.
///
/// Combining marks sharing a Unicode combining class keep their input
/// order under NFD, so `n̪̥` and `n̥̪` stay two strings for one sound.
/// Worse, the parser matches greedily: one reads as the phone `n̪` plus
/// voiceless, the other as `n̥` plus dental.
///
/// Mirrors talk's modifier `order` field so an IPA string and its tone
/// spelling agree on sequence. A mark absent here sorts last, by
/// codepoint.
const MARK_ORDER: &[char] = &[
  // Place detail, closest to the articulation itself.
  '\u{032a}', '\u{033c}', '\u{033a}', '\u{033b}', '\u{031f}', '\u{0320}',
  '\u{031d}', '\u{031e}', '\u{0308}', '\u{033d}', '\u{0318}', '\u{0319}',
  // Secondary articulation.
  'ʲ', 'ˠ', 'ˤ', 'ᶣ', 'ʷ', '\u{0339}', '\u{031c}',
  // Laryngeal.
  'ʰ', 'ʱ', 'ʼ', 'ˀ',
  // Phonation.
  '\u{0325}', '\u{032c}', '\u{0324}', '\u{0330}',
  // Manner detail and release.
  '\u{0348}', '\u{0349}', '\u{0353}', '\u{0347}', 'ⁿ', 'ˡ', '\u{031a}',
  '\u{02de}',
  // Nasality, then the suprasegmentals last.
  '\u{0303}', '\u{0329}', '\u{032f}', 'ː', 'ˑ', '\u{0306}', '˥', '˦',
  '˧', '˨', '˩',
];

fn rank_of(character: char) -> usize {
  MARK_ORDER
    .iter()
    .position(|mark| *mark == character)
    .unwrap_or(MARK_ORDER.len() + character as usize)
}

/// Whether a character attaches to a preceding base rather than standing
/// alone.
fn is_affix(character: char) -> bool {
  use unicode_normalization::char::canonical_combining_class;

  canonical_combining_class(character) != 0
    // The modifier-letter blocks IPA draws from. Rust has no general
    // category table, so the ranges are named: spacing modifiers, the two
    // phonetic-extension blocks (the second holds `ᶣ` at U+1DA3), and the
    // two strays IPA uses.
    || matches!(character,
      '\u{02b0}'..='\u{02ff}'
        | '\u{1d2c}'..='\u{1d6a}'
        | '\u{1d78}'
        | '\u{1d9b}'..='\u{1dbf}'
        | '\u{2071}'
        | '\u{207f}'
        | '\u{2193}')
}

fn is_base(character: char) -> bool {
  character.is_alphabetic() && !is_affix(character)
}

/// Put the affixes following each base into canonical order.
///
/// Only a run that FOLLOWS a base is sorted. A leading modifier is a
/// different sound rather than a reordering: `ʰk` is pre-aspirated and
/// `kʰ` post-aspirated, so moving one to the other would change what was
/// said.
fn order_marks(text: &str) -> String {
  let mut out = String::with_capacity(text.len());
  let mut run: Vec<char> = Vec::new();
  let mut after_base = false;

  for character in text.chars() {
    if is_affix(character) && (after_base || !run.is_empty()) {
      run.push(character);
      continue;
    }

    if !run.is_empty() {
      if after_base {
        run.sort_by_key(|mark| rank_of(*mark));
      }
      out.extend(run.drain(..));
    }

    out.push(character);
    after_base = is_base(character);
  }

  if !run.is_empty() {
    if after_base {
      run.sort_by_key(|mark| rank_of(*mark));
    }
    out.extend(run.drain(..));
  }

  out
}

/// `bare_digit_tone` reads bare digits as tone, off by default because a bare
/// digit is ambiguous. `keep_detail` leaves the unencoded detail in place so a
/// caller can audit what this encoding drops.
#[derive(Debug, Clone, Copy, Default)]
pub struct NormalizeIpaOptions {
  pub bare_digit_tone: bool,
  pub keep_detail: bool,
}

/// Normalize an IPA string into the form the parser reads.
///
/// Idempotent, and returns NFD because every combining mark in the tries is
/// stored decomposed.
pub fn normalize_ipa_with(text: &str, options: NormalizeIpaOptions) -> String {
  // Two passes, because a replacement can itself contain something the second
  // pass acts on: `ɚ` expands to `ə˞`, and the rhoticity hook is then dropped
  // like any other unencoded detail.
  let mut source = String::with_capacity(text.len());

  for character in text.chars() {
    if let Some((_, digit)) =
      SUPERSCRIPT_DIGIT.iter().find(|(from, _)| *from == character)
    {
      if let Some(tone) = tone_for(*digit) {
        source.push(tone);
        continue;
      }
    }

    match replace().get(&character) {
      Some(replacement) => source.push_str(replacement),
      None => source.push(character),
    }
  }

  let mut out = String::with_capacity(source.len());

  for character in source.nfd() {
    if DROP.contains(&character) {
      continue;
    }

    if !options.keep_detail && detail().contains(&character) {
      continue;
    }

    if character == RING_ABOVE {
      out.push(RING_BELOW);
      continue;
    }

    if options.bare_digit_tone {
      if let Some(tone) = tone_for(character) {
        out.push(tone);
        continue;
      }
    }

    out.push(character);
  }

  order_marks(&out)
}

/// Normalize with the default options.
pub fn normalize_ipa(text: &str) -> String {
  normalize_ipa_with(text, NormalizeIpaOptions::default())
}
