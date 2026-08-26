import type { SymbolEntry } from './type'

// Non-phonetic sounds carried through unchanged. The `\` escape lets a
// literal symbol be written in talk (`\.` is a period), the same escape
// character every other notation uses for the job.
export function buildSymbols(): SymbolEntry[] {
  const symbols: SymbolEntry[] = [
    { talk: '\\.', ipa: '.', simple: '.' },
    { talk: '\\?', ipa: '?', simple: '?' },
    { talk: '\\!', ipa: '!', simple: '!' },
    { talk: '\\+', ipa: '+', simple: '+' },
    { talk: '\\-', ipa: '-', simple: '-' },
    { talk: '\\*', ipa: '*', simple: '*' },
    { talk: '\\@', ipa: '@', simple: '@' },
    { talk: '\\$', ipa: '$', simple: '$' },
    { talk: '\\~', ipa: '~', simple: '~' },
    { talk: '\\_', ipa: '_', simple: '_' },
    { talk: '\\^', ipa: '^', simple: '^' },
    { talk: '\\\\', ipa: '\\', simple: '\\' },
    { talk: ' ', ipa: ' ', simple: ' ' },
    // THE TIE AND THE LINK, which `normalizeIpa` used to delete.
    //
    // `t͡ʃ` is one affricate where `tʃ` may be a stop meeting a fricative
    // across a boundary, and `‿` says two words were spoken as one. Both
    // state something the writer chose to state, so both survive the
    // normalizer now and both need a talk spelling to come back through.
    //
    // They are carried rather than modelled. A tie binds the two phones
    // beside it and a fuller encoding would say so in the sound itself
    // instead of standing between them. Carrying it keeps the information
    // and round-trips, which is what was actually lost.
    { talk: '\\=', ipa: '\u{0361}', simple: '\u{0361}' },
    { talk: '\\&', ipa: '\u{203f}', simple: '\u{203f}' },
  ]

  for (let n = 0; n <= 9; n++) {
    const digit = String(n)

    symbols.push({ talk: digit, ipa: digit, simple: digit })
  }

  return symbols
}
