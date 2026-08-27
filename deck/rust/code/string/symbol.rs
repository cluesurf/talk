use std::sync::OnceLock;

use crate::string::types::SymbolEntry;

/// Non-phonetic sounds carried through unchanged. The `\` escape lets a
/// literal symbol be written in talk (`\.` is a period), the same escape
/// character every other notation uses for the job.
pub fn symbols() -> &'static [SymbolEntry] {
  static CELL: OnceLock<Vec<SymbolEntry>> = OnceLock::new();

  CELL.get_or_init(|| {
    // THE SYLLABLE BREAK, WRITTEN AS IPA WRITES IT. `.` was escaped like the
    // other punctuation, which made a break in talk look nothing like the
    // `.` the source used. It needs no escape: `.` is a modifier spelling
    // (unreleased) only INSIDE a bracketed run, so a bare one outside
    // brackets can mean nothing else.
    let mut symbols: Vec<SymbolEntry> = [
      ".", "\\?", "\\!", "\\+", "\\-", "\\*", "\\@", "\\$", "\\~", "\\_", "\\^",
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

    // THE LINK, which `normalize_ipa` used to delete. `‿` says two words
    // were spoken as one, which the writer chose to state, so it survives
    // the normalizer and needs a talk spelling to come back through.
    //
    // THE TIE IS NOT HERE. `t͡ʃ` says the letters either side of it are ONE
    // segment, which is a claim about them rather than a character standing
    // between them. Carried as a symbol it round-tripped but could not say
    // how far the binding reached, so it is folded into the `<B>` binder by
    // `bind_ties` instead. Leaving an entry here would match it first and
    // that fold would never run.
    //
    // Spelled out rather than derived, because the loop above builds each
    // entry by stripping the backslash off its own escape and this does not
    // spell the character it escapes.
    for (talk, ipa) in [("\\&", '\u{203f}')] {
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
