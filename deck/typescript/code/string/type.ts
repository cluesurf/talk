// Shared types for the talk encoding.

export type Kind = 'consonant' | 'vowel' | 'symbol'

export type Phone = {
  ipa: string
  talk: string
  xsampa: string
  simple: string
  kind: 'consonant' | 'vowel'
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
  base: 'consonant' | 'vowel'
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
  machine: string
  kind: Kind
  base?: Phone
  modifiers: Modifier[]
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

// A frozen talk-sound to Hangul code point (token) assignment.
export type TokenEntry = {
  talk: string
  token: string
}

// A unit the scanner can match: a base sound, an affix, or a passthrough
// symbol.
export type Unit =
  | { role: 'phone'; phone: Phone }
  | { role: 'modifier'; modifier: Modifier }
  | { role: 'symbol'; symbol: SymbolEntry }
