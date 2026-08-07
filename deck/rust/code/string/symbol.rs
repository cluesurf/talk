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
