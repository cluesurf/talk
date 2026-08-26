//! Fold the many ways IPA gets written down into the one this library reads.
//!
//! Mirrors `code/string/normalize.ts` in the TypeScript port.

use std::collections::HashMap;
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
      // Sinological letters for the alveolo-palatal series, written as the
      // palatal plus the advancing mark. `ȵ` is nearer `ɲ̟` than `ɲ`, and
      // the advancement now has a modifier to land on, so it is kept.
      ('ȵ', "ɲ\u{031f}"),
      ('ȶ', "c\u{031f}"),
      ('ȡ', "ɟ\u{031f}"),
      ('ȴ', "ʎ\u{031f}"),
      // GREEK LETTERS THAT ARE NOT IPA.
      //
      // Three Greek letters ARE official IPA and are deliberately absent:
      // β the voiced bilabial fricative, θ the voiceless dental, and χ the
      // voiceless uvular. Together they account for 166,790 uses across
      // 171 languages, so folding them would rewrite correct
      // transcription.
      ('γ', "ɣ"), // U+03B3 -> U+0263, 26 uses
      ('δ', "ð"), // U+03B4 -> U+00F0, 77 uses
      ('ϕ', "ɸ"), // U+03D5 -> U+0278
      ('ε', "ɛ"), // U+03B5 -> U+025B
      ('ι', "ɪ"), // U+03B9 -> U+026A
      ('υ', "ʊ"), // U+03C5 -> U+028A
      ('α', "ɑ"), // U+03B1 -> U+0251
      // φ is the ambiguous one and IS folded: every observed use is the
      // bilabial fricative. λ is deliberately NOT folded, because
      // Americanist notation uses it for `tɬ` and other sources for `ʎ`.
      ('φ', "ɸ"),
      // CYRILLIC LOOKALIKES. `ӕ` renders identically to the Latin `æ` IPA
      // wants. 83 uses, all in one language.
      ('ӕ', "æ"), // U+04D5 -> U+00E6
      ('Ӕ', "Æ"),
      // TYPOGRAPHIC QUOTES. A source that ran through a word processor has
      // the curly apostrophe where IPA wants the ejective mark. 570 uses.
      ('\u{2019}', "ʼ"),
      ('\u{2018}', "ʼ"),
      ('`', "ʼ"),
      ('´', "ʼ"),
      ('"', "ˈ"), // ASCII double quote -> primary stress
      // THE TIE, ABOVE OR BELOW. U+035C is the same tie as U+0361,
      // written underneath when a descender leaves no room above. One
      // thing, two spellings, which is what this table is for. The tie
      // itself is kept: `t͡ʃ` is one affricate and `tʃ` may be two
      // segments meeting.
      ('\u{035c}', "\u{0361}"),
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

/// NOTHING IS DROPPED ANY MORE.
///
/// This held `\u{0361}`, `\u{035c}`, `.` and `\u{203f}`, and deleting them was a
/// category error. Normalizing folds the several ways of writing ONE thing
/// into one of them. It does not decide a thing is unimportant. The syllable
/// boundary, the link between two words spoken as one, and the tie binding
/// two letters into a single segment each say something the source meant,
/// and `t͡ʃ` is one affricate where `tʃ` may be a stop meeting a fricative.
///
/// They pass through now and the parser reports them as symbols. The one
/// genuine fold among the four is in `replace`: the tie below is the tie
/// above, chosen by whether a descender leaves room.

/// Fine phonetic detail used to be stripped here so the segment underneath
/// still resolved. It no longer is, and there is no option to bring it back.
///
/// Every mark that was dropped now has an entry in `modifiers.json`, so `b̤`
/// reads as `b` plus breathy and a caller sees the feature instead of losing
/// it. Breathy voice is contrastive across South Asia and creaky voice across
/// Mesoamerica, so the old default merged phonemes that contrast.
///
/// A caller wanting `b̤` to MATCH `b` wants the tone encoding, which is coarse
/// by design and gives both the same code.

/// Characters carrying nothing recoverable, removed before anything else.
///
/// PRIVATE USE AREA. A font assigns these whatever glyph it likes and no two
/// agree, so a source using one meant a symbol its own font drew and nothing
/// downstream can know which. 98 such characters were observed in five
/// languages.
fn is_private_use(character: char) -> bool {
  matches!(
    character,
    '\u{e000}'..='\u{f8ff}'
      | '\u{f0000}'..='\u{ffffd}'
      | '\u{100000}'..='\u{10fffd}'
  )
}

/// Strip the delimiters WRAPPING a whole string, which say what kind of
/// transcription it is rather than form part of it. 6,903 uses across four
/// languages.
///
/// Only when they wrap. A slash INSIDE a string separates two readings, and
/// cutting it would join them into a word that is neither.
fn unwrap_delimiters(text: &str) -> &str {
  let trimmed = text.trim();
  let mut characters = trimmed.chars();

  match (characters.next(), characters.next_back()) {
    (Some('/'), Some('/')) | (Some('['), Some(']'))
      if trimmed.chars().count() > 2 =>
    {
      characters.as_str()
    }
    _ => trimmed,
  }
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
  // Part of a base's own spelling rather than a mark on it, so it sorts
  // innermost and stays next to the letter it belongs to. `ç` is one phone,
  // and sorting any other mark inside it splits it into `c` plus a cedilla
  // the tries have never heard of.
  '\u{0327}', // cedilla
  // Place detail, closest to the articulation itself.
  '\u{032a}', '\u{033c}', '\u{033a}', '\u{033b}', '\u{031f}', '\u{0320}',
  '\u{031d}', '\u{031e}', '\u{0308}', '\u{033d}', '\u{0318}', '\u{0319}',
  // Secondary articulation.
  'ʲ', 'ˠ', 'ˤ', 'ᶣ', 'ʷ', '\u{0339}', '\u{031c}',
  // Laryngeal.
  'ʰ', 'ʱ', 'ʼ', 'ˀ',
  // Phonation.
  '\u{0325}', '\u{032c}', '\u{0324}', '\u{0330}', 'ᴱ',
  // Manner detail and release.
  '\u{0348}', '\u{0349}', '\u{0353}', '\u{0347}', 'ⁿ', 'ˡ', '\u{031a}',
  '\u{02de}',
  // Nasality, then the suprasegmentals last.
  '\u{0303}', '\u{0329}', '\u{032f}', 'ː', 'ˑ', '\u{0306}', '˥', '˦',
  '˧', '˨', '˩', '\u{2193}',
];

/// The tone marks, which all share ONE rank.
///
/// A CONTOUR IS A SEQUENCE, NOT A SET. `˩˩˦` is a rise and `˦˩˩` is a fall,
/// and the two are spelled with the same three letters in a different order.
/// Ranking the five Chao letters individually meant every run of them was
/// sorted into descending pitch, so every rising tone became a falling one
/// and the original was not recoverable.
///
/// MEASURED, in a corpus normalized by this function: 599,336 of
/// Vietnamese's 599,339 tone-letter runs came out descending, and all 23,292
/// of Thai's. Vietnamese `mả` is a dipping-rise and was stored `maː˦˨˩`.
/// Neither language has a tone that only falls.
///
/// REMOVING THEM FROM `MARK_ORDER` DOES NOT FIX IT. `rank_of` would fall
/// through to the codepoint, and U+02E5 through U+02E9 run high pitch to
/// low, so the sort reaches the same descending order by another route.
///
/// An equal rank is the fix, because `sort_by_key` is stable: a run of tone
/// marks keeps the order it arrived in, while still sorting as a group
/// against every other kind of mark.
///
/// THE COMBINING TONE ACCENTS ARE HERE FOR THE SAME REASON. Acute, grave,
/// circumflex, caron, macron and the doubled pair are how many sources write
/// tone, two of them stacked make a contour, and none appears in
/// `MARK_ORDER`, so they were ordered by codepoint against each other.
const TONE: &[char] = &[
  '˥',
  '˦',
  '˧',
  '˨',
  '˩',
  '\u{2193}', // downstep, which lowers what follows and so is positional too
  '\u{0300}', // grave, low
  '\u{0301}', // acute, high
  '\u{0302}', // circumflex, falling
  '\u{0304}', // macron, mid
  '\u{030b}', // double acute, extra high
  '\u{030c}', // caron, rising
  '\u{030f}', // double grave, extra low
  '\u{0311}', // inverted breve, peaking
];

fn rank_of(character: char) -> usize {
  if TONE.contains(&character) {
    // Where the tone group sorts: exactly where the Chao letters already
    // did, which is last among the suprasegmentals.
    return MARK_ORDER
      .iter()
      .position(|mark| *mark == '˥')
      .expect("MARK_ORDER holds the extra-high tone letter");
  }

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
        | '\u{207f}')
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
/// digit is ambiguous.
/// caller can audit what this encoding drops.
#[derive(Debug, Clone, Copy, Default)]
pub struct NormalizeIpaOptions {
  pub bare_digit_tone: bool,
}

/// Normalize an IPA string into the form the parser reads.
///
/// Idempotent, and returns NFD because every combining mark in the tries is
/// stored decomposed.
pub fn normalize_ipa_with(text: &str, options: NormalizeIpaOptions) -> String {
  // Before anything else: drop the private-use characters no reader can
  // resolve, and unwrap the delimiters that say what kind of transcription
  // this is. Both are about the string rather than in it.
  let stripped: String =
    text.chars().filter(|one| !is_private_use(*one)).collect();
  let bare = unwrap_delimiters(&stripped);

  // Two passes, because a replacement can itself contain something the second
  // pass acts on: `ȵ` expands to `ɲ̟`, and the advancing mark then has to
  // decompose and sort with the rest of its run.
  let mut source = String::with_capacity(bare.len());

  for character in bare.chars() {
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
