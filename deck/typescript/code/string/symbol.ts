import type { SymbolEntry } from './type'

// Non-phonetic sounds carried through unchanged. The `=` escape lets a
// literal symbol be written in talk (`=.` is a period).
export function buildSymbols(): SymbolEntry[] {
  const symbols: SymbolEntry[] = [
    { talk: '=.', ipa: '.', simple: '.' },
    { talk: '=?', ipa: '?', simple: '?' },
    { talk: '=!', ipa: '!', simple: '!' },
    { talk: '=+', ipa: '+', simple: '+' },
    { talk: '=-', ipa: '-', simple: '-' },
    { talk: ' ', ipa: ' ', simple: ' ' },
  ]

  for (let n = 0; n <= 9; n++) {
    const digit = String(n)

    symbols.push({ talk: digit, ipa: digit, simple: digit })
  }

  return symbols
}
