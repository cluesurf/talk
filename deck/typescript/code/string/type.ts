// Shared types for the talk encoding.

/** The two phonetic forms. `Kind` adds `symbol` on top of these. */
export type Form = 'consonant' | 'vowel'

export type Kind = Form | 'symbol'

/**
 * The machine code space: 24 bits, so every code serializes to exactly
 * three bytes and the inventory has room to grow by two orders of
 * magnitude.
 */
export const CODE_LIMIT = 0xffffff

/**
 * The code for a sound with no assignment, which is anything outside the
 * enumerated inventory: an unrecognized character carried through rather
 * than dropped. Distinct from code 0, which is a real sound.
 */
export const NO_CODE = -1

export type Phone = {
  ipa: string
  talk: string
  xsampa: string
  simple: string
  form: 'consonant' | 'vowel'
  place?: string
  manner?: string
  voicing?: string
  height?: string
  backness?: string
  roundedness?: string
  provisional?: boolean
}

export type Attaches = {
  place?: string[]
  notPlace?: string[]
  manner?: string[]
  voicing?: string[]
}

export type Modifier = {
  ipa: string
  talk: string
  xsampa: string
  simple: string
  /**
   * Which bases the modifier attaches to. `any` covers both, for the
   * features that are not about articulation: length and stress apply to
   * a consonant as readily as to a vowel (`b_` is a geminate, `b^` a
   * stressed onset).
   */
  base: 'consonant' | 'vowel' | 'any'
  feature: string
  slot: string
  order: number
  prefix?: boolean
  attaches?: Attaches
}

export type Sound = {
  talk: string
  ipa: string
  simple: string
  /**
   * The sound's machine code, a 24-bit integer, or `NO_CODE` for a sound
   * with no assignment (a passthrough symbol outside the inventory).
   */
  machine: number
  kind: Kind
  base?: Phone
  modifiers: Modifier[]
  /**
   * Modifiers preceding the base: pre-aspiration, prenasalization and the
   * like. Kept apart from `modifiers` because position carries meaning,
   * `ʰk` and `kʰ` being different sounds.
   */
  pre: Modifier[]
  raw?: boolean
}

// A non-phonetic passthrough sound (punctuation, digit, space).
export type SymbolEntry = {
  talk: string
  ipa: string
  simple: string
}

// A canonical sound with its spellings, minus the machine code point.
export type SoundInfo = {
  talk: string
  ipa: string
  simple: string
  kind: Kind
}

// A unit the scanner can match: a base sound, an affix, or a passthrough
// symbol.
export type Unit =
  | { role: 'phone'; phone: Phone }
  | { role: 'modifier'; modifier: Modifier }
  | { role: 'symbol'; symbol: SymbolEntry }
