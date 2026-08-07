/**
 * Talk tokenizer.
 *
 * Parses a talk notation string into structured tokens. Each token is a
 * consonant, vowel, symbol, numeral, or space, with its features spread
 * across named boolean fields.
 *
 * This is a flag-per-feature view of a talk string, distinct from the two
 * other readings the package offers:
 *
 * - `tokenize` from the root reads talk into `Sound`s, each a base
 *   `Phone` plus the `Modifier`s that attach to it, both drawn from the
 *   data files. That is the right reading for anything that compares
 *   sounds by their articulatory features.
 * - `readSegments` from `./syllable` reads talk into the marks the
 *   syllabifier groups into clusters.
 *
 * This module is the reading a synthesizer wants: one flat token per
 * segment, with every modifier as its own boolean, so a renderer can
 * branch on `token.aspirated` without walking a modifier list. It is a
 * standalone scanner over the notation, with no dependency on the data
 * files, which is why it can spell distinctions the data does not carry
 * (`rounded`, `nonsyllabic`, the contour tones).
 *
 * Usage:
 *   import { tokenize } from '@cluesurf/talk/token'
 *   const tokens = tokenize('t!a++nDh~')
 */

// ─── Types ──────────────────────────────────────────────

export type Tone =
  | 'extra-high'
  | 'high'
  | 'neutral'
  | 'low'
  | 'extra-low'
  | 'rising'
  | 'rising-2'
  | 'falling'
  | 'falling-2'
  | 'rising-falling'
  | 'falling-rising'

export type ConsonantToken = {
  form: 'consonant'
  text: string
  variant?: boolean
  aspirated?: boolean
  labialized?: boolean
  palatalized?: boolean
  velarized?: boolean
  pharyngealized?: boolean
  ejective?: boolean
  implosive?: boolean
  tense?: boolean
  stop?: boolean
  click?: boolean
  dental?: boolean
}

export type VowelToken = {
  form: 'vowel'
  text: string
  variant?: boolean
  rounded?: boolean
  stressed?: boolean
  long?: boolean
  short?: boolean
  nasal?: boolean
  nonsyllabic?: boolean
  tone?: Tone
}

export type SymbolToken = {
  form: 'symbol'
  text: string
}

export type NumeralToken = {
  form: 'numeral'
  text: string
}

export type SpaceToken = {
  form: 'space'
}

export type Token =
  ConsonantToken | VowelToken | SymbolToken | NumeralToken | SpaceToken

// ─── Constants ──────────────────────────────────────────

const BASE_CONSONANTS = new Set([
  'm',
  'n',
  'q',
  'g',
  'd',
  'b',
  'p',
  't',
  'k',
  'h',
  's',
  'f',
  'v',
  'z',
  'j',
  'x',
  'c',
  'l',
  'r',
  'w',
  'y',
])

const VARIANT_CONSONANTS = new Set([
  'N',
  'G',
  'D',
  'T',
  'K',
  'H',
  'J',
  'S',
  'F',
  'V',
  'Z',
  'C',
  'L',
  'R',
  'X',
  'W',
  'Q',
])

const BASE_VOWELS = new Set(['i', 'e', 'a', 'o', 'u'])
const VARIANT_VOWELS = new Set(['I', 'E', 'A', 'O', 'U'])

const TONE_MAP: Record<string, Tone> = {
  '++': 'extra-high',
  '+': 'high',
  '--': 'extra-low',
  '-': 'low',
  '//': 'rising-2',
  '/': 'rising',
  '\\\\': 'falling-2',
  '\\': 'falling',
  '/\\': 'rising-falling',
  '\\/': 'falling-rising',
}

/** Symbols the `\\` escape can introduce, so a backslash before one of
    them is an escape rather than the falling-tone mark. */
const ESCAPABLE = new Set([
  '.', '?', '!', '+', '-', '*', '@', '$', '~', '_', '^',
])

/** Two-char tone prefixes, checked before single-char. */
const TWO_CHAR_TONES = new Set(['++', '--', '//', '\\\\', '/\\', '\\/'])

// ─── Tokenizer ──────────────────────────────────────────

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []

  let i = 0

  while (i < input.length) {
    const ch = input[i]
    const next = input[i + 1]

    /** Space. */
    if (ch === ' ') {
      tokens.push({ form: 'space' })
      i++
      continue
    }

    /** Symbol escape: \. \? \! \+ \- etc. */
    if (ch === '\\' && next) {
      tokens.push({ form: 'symbol', text: next })
      i += 2
      continue
    }

    /** Numeral. */
    if (ch && ch >= '0' && ch <= '9') {
      tokens.push({ form: 'numeral', text: ch })
      i++
      continue
    }

    /** Glottal stop. */
    if (ch === "'") {
      tokens.push({
        form: 'consonant',
        text: "'",
        variant: false,
        aspirated: false,
        labialized: false,
        palatalized: false,
        velarized: false,
        pharyngealized: false,
        ejective: false,
        implosive: false,
        tense: false,
        stop: false,
        click: false,
        dental: false,
      })
      i++
      continue
    }

    /** Consonant. */
    if (ch && (BASE_CONSONANTS.has(ch) || VARIANT_CONSONANTS.has(ch))) {
      const isVariant = VARIANT_CONSONANTS.has(ch)
      const baseLetter = ch

      i++

      const token: ConsonantToken = {
        form: 'consonant',
        text: baseLetter,
        variant: isVariant,
      }

      /** Consume trailing consonant modifiers. */
      while (i < input.length) {
        const mod = input[i]
        const mod2 = i + 1 < input.length ? input[i] + input[i + 1] : ''

        if (mod2 === 'h~') {
          token.aspirated = true
          i += 2
        } else if (mod2 === 'w~') {
          token.labialized = true
          i += 2
        } else if (mod2 === 'y~') {
          token.palatalized = true
          i += 2
        } else if (mod2 === 'G~') {
          token.velarized = true
          i += 2
        } else if (mod2 === 'Q~') {
          token.pharyngealized = true
          i += 2
        } else if (mod2 === 'n~') {
          /** n~ is its own consonant, not a modifier. Break. */
          break
        } else if (mod === '$') {
          /** Dental d$, t$ etc. `$` replaced `~` so `~` could form
              superscripts on consonants and mark nasality on vowels. */
          token.dental = true
          i++
        } else if (mod === '!') {
          token.ejective = true
          i++
        } else if (mod === '?') {
          token.implosive = true
          i++
        } else if (mod === '@') {
          token.tense = true
          i++
        } else if (mod === '.') {
          token.stop = true
          i++
        } else if (mod === '*') {
          token.click = true
          i++
        } else {
          break
        }
      }

      tokens.push(token)
      continue
    }

    /** Vowel. */
    if (ch && (BASE_VOWELS.has(ch) || VARIANT_VOWELS.has(ch))) {
      const isVariant = VARIANT_VOWELS.has(ch)
      const baseLetter = ch

      i++

      const token: VowelToken = {
        form: 'vowel',
        text: baseLetter,
        variant: isVariant,
      }

      /** Consume trailing vowel modifiers. */
      while (i < input.length) {
        const mod = input[i]
        const next = input[i + 1]

        /** Check two-char tones first, so `\\\\` stays falling-2 rather
            than reading as an escaped backslash. */
        if (i + 1 < input.length) {
          const twoChar = input[i] + input[i + 1]

          if (TWO_CHAR_TONES.has(twoChar)) {
            token.tone = TONE_MAP[twoChar]
            i += 2
            continue
          }
        }

        /** A single `\\` before a symbol is the escape, not falling tone.
            `a\\.` is `a` then a literal period. The two-char tones above
            already claimed the sequences that are unambiguously tones. */
        if (mod === '\\' && next !== undefined && ESCAPABLE.has(next)) {
          break
        }

        if (mod === '$') {
          token.rounded = true
          i++
        } else if (mod === '^') {
          token.stressed = true
          i++
        } else if (mod === '_') {
          token.long = true
          i++
        } else if (mod === '!') {
          token.short = true
          i++
        } else if (mod === '~') {
          token.nasal = true
          i++
        } else if (mod === '@') {
          token.nonsyllabic = true
          i++
        } else if (mod === '+' || mod === '-') {
          /** Single-char tone. */
          token.tone = TONE_MAP[mod]
          i++
        } else if (mod === '/' || mod === '\\') {
          token.tone = TONE_MAP[mod]
          i++
        } else {
          break
        }
      }

      tokens.push(token)
      continue
    }

    /** Unknown character, skip. */
    i++
  }

  return tokens
}

// ─── Serializer ─────────────────────────────────────────

/**
 * Inverse of `tokenize`. Round-trip a single token back to its
 * talk-notation source string.
 *
 * Modifier suffixes are emitted in a stable canonical order that
 * matches the order produced by the parser construction in
 * `index.ts` and `syllables.ts#serialize`, so two equivalent
 * token sets always produce the same string.
 */
export function serializeToken(token: Token): string {
  if (token.form === 'space') {
    return ' '
  }

  if (token.form === 'symbol') {
    return `=${token.text}`
  }

  if (token.form === 'numeral') {
    return token.text
  }

  const parts: string[] = [token.text]

  if (token.form === 'consonant') {
    if (token.click) {
      parts.push('*')
    }

    if (token.ejective) {
      parts.push('!')
    }

    if (token.implosive) {
      parts.push('?')
    }

    if (token.dental) {
      parts.push('$')
    }

    if (token.pharyngealized) {
      parts.push('Q~')
    }

    if (token.velarized) {
      parts.push('G~')
    }

    if (token.palatalized) {
      parts.push('y~')
    }

    if (token.labialized) {
      parts.push('w~')
    }

    if (token.aspirated) {
      parts.push('h~')
    }

    if (token.stop) {
      parts.push('.')
    }

    if (token.tense) {
      parts.push('@')
    }

    return parts.join('')
  }

  // vowel
  if (token.rounded) {
    parts.push('$')
  }

  if (token.nasal) {
    parts.push('~')
  }

  if (token.long) {
    parts.push('_')
  }

  if (token.short) {
    parts.push('!')
  }

  if (token.nonsyllabic) {
    parts.push('@')
  }

  if (token.stressed) {
    parts.push('^')
  }

  if (token.tone) {
    parts.push(serializeTone(token.tone))
  }

  return parts.join('')
}

/**
 * Map a `Tone` label back to its talk-notation suffix. Mirrors
 * the labels accepted by `tokenize` and used by `serializeToken`.
 */
export function serializeTone(tone: Tone): string {
  switch (tone) {
    case 'extra-high':
      return '++'
    case 'high':
      return '+'
    case 'extra-low':
      return '--'
    case 'low':
      return '-'
    case 'rising':
      return '/'
    case 'rising-2':
      return '//'
    case 'falling':
      return '\\'
    case 'falling-2':
      return '\\\\'
    case 'rising-falling':
      return '/\\'
    case 'falling-rising':
      return '\\/'
    case 'neutral':
      return ''
  }
}

/**
 * Serialize a sequence of tokens back to a single talk-notation
 * string. Convenience over `tokens.map(serializeToken).join('')`.
 */
export function serialize(tokens: Token[]): string {
  let out = ''

  for (const token of tokens) {
    out += serializeToken(token)
  }

  return out
}
