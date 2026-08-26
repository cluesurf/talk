/**
 * Whether a string is IPA and nothing else.
 *
 * WHY A FIELD SAYING `ipa` IS NOT ENOUGH. The corpus reads pronunciations
 * from several hundred sources, and a source that labels a field `ipa` puts
 * whatever it likes in it. Measured across 1,297,298 IPA rows in 60
 * languages, the field holds `naɡ&`, `l̪ɯ̂aɡ°`, `ümb•snid•den•nes`, and the
 * literal string `No IPA ɡiven`. Each of those is stored as a pronunciation
 * and read back as one, and a pronunciation that is wrong is worse than one
 * that is missing, because the missing one is visibly missing.
 *
 * WHAT MAKES IT VALID. Every unit has to parse to a sound this library
 * knows, or to one of the four symbols that are genuinely part of a
 * transcription. `parseIpa` already reports anything else as `unknown`: it
 * does not reject the character, it simply has no sound to offer, which is
 * exactly the signal wanted here.
 *
 * THE FOUR SYMBOLS ARE NOT A GUESS. talk's symbol table carries the ASCII
 * escapes (`\.`, `\?`, `\!` and the rest) and the digits, so a string can be
 * made entirely of `symbol` units and still be nothing like a
 * transcription. `phɛːn2` parses cleanly and the `2` is a tone number no
 * reader can resolve. Only the space, the syllable break, the tie and the
 * undertie belong inside IPA, so only those pass.
 *
 * EMPTY IS NOT VALID, and neither is a string that yields no units. A
 * pronunciation with nothing in it is not a pronunciation.
 */

import { parseIpa } from './convert'

/**
 * Symbols that belong inside a transcription.
 *
 * The space between two words, the syllable break, the tie binding two
 * letters into one segment, and the undertie linking two words spoken as
 * one. Every other entry in the symbol table is an escape or a digit, which
 * is punctuation carried through rather than anything phonetic.
 */

const IPA_SYMBOL = new Set([
  ' ',
  '.',
  '\u{0361}', // tie
  '\u{203f}', // undertie
])

/**
 * A string written only in tone letters, which is a tone and not a segment.
 *
 * `parseIpa` yields no units for `˥˦`, because a tone is not a phone, and
 * reading that as invalid would reject every toneme in the corpus. Phoible
 * alone holds 70 such spellings across 2,221 inventory rows.
 */

const TONE_ONLY = /^[˥˦˧˨˩↓ˈˌ\s]+$/u

export function isValidIpa(text: string): boolean {
  if (!text || !text.trim()) {
    return false
  }

  if (TONE_ONLY.test(text)) {
    return true
  }

  let units

  try {
    units = parseIpa(text)
  } catch {
    return false
  }

  if (!units.length) {
    return false
  }

  for (const unit of units) {
    if (unit.role === 'phone') {
      continue
    }

    if (unit.role === 'symbol' && IPA_SYMBOL.has(unit.symbol.ipa)) {
      continue
    }

    return false
  }

  return true
}

/**
 * The characters that made a string invalid, for a report rather than a
 * decision.
 *
 * `isValidIpa` answers yes or no, which is what a filter needs. A caller
 * cleaning a source wants to know WHICH character was the problem, and
 * returning the list costs the same walk.
 */

export function invalidIpaCharacters(text: string): string[] {
  if (!text) {
    return []
  }

  let units

  try {
    units = parseIpa(text)
  } catch {
    return [...text]
  }

  const out: string[] = []

  for (const unit of units) {
    if (unit.role === 'unknown') {
      out.push(unit.text)
    } else if (unit.role === 'symbol' && !IPA_SYMBOL.has(unit.symbol.ipa)) {
      out.push(unit.symbol.ipa)
    }
  }

  return out
}
