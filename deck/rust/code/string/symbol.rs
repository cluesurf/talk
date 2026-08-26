use std::sync::OnceLock;

use crate::string::types::SymbolEntry;

/// Non-phonetic sounds carried through unchanged. The `\` escape lets a
/// literal symbol be written in talk (`\.` is a period), the same escape
/// character every other notation uses for the job.
pub fn symbols() -> &'static [SymbolEntry] {
  static CELL: OnceLock<Vec<SymbolEntry>> = OnceLock::new();

  CELL.get_or_init(|| {
    let mut symbols: Vec<SymbolEntry> = [
      "\\.", "\\?", "\\!", "\\+", "\\-", "\\*", "\\@", "\\$", "\\~", "\\_", "\\^",
      "\\\\", " ",
    ]
      .into_iter()
      .map(|talk| {
        // Every escape spells the character it escapes, and the space
        // spells itself.
        let plain = talk.strip_prefix('\\').unwrap_or(talk);

        SymbolEntry {
          talk: talk.to_string(),
          ipa: plain.to_string(),
          simple: plain.to_string(),
        }
      })
      .collect();

    // THE TIE AND THE LINK, which `normalize_ipa` used to delete.
    //
    // `t͡ʃ` is one affricate where `tʃ` may be a stop meeting a fricative
    // across a boundary, and `‿` says two words were spoken as one. Both
    // state something the writer chose to state, so both survive the
    // normalizer now and both need a talk spelling to come back through.
    //
    // Spelled out rather than derived, because the loop above builds each
    // entry by stripping the backslash off its own escape and neither of
    // these spells the character it escapes.
    for (talk, ipa) in [("\\=", '\u{0361}'), ("\\&", '\u{203f}')] {
      symbols.push(SymbolEntry {
        talk: talk.to_string(),
        ipa: ipa.to_string(),
        simple: ipa.to_string(),
      });
    }

    for digit in 0..=9 {
      let digit = digit.to_string();

      symbols.push(SymbolEntry {
        talk: digit.clone(),
        ipa: digit.clone(),
        simple: digit,
      });
    }

    symbols
  })
}
