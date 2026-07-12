// Shared loaders and combo generators for the IPA <-> Talk test
// suite. Everything that both the tests and the snapshot builders
// (`build-mappings.ts`, `build-machine-gaps.ts`) need lives here so the
// two stay in lockstep.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import talk from '~/code'
import { makeIpaToTalk, makeTalkToIpa } from '~/code/ipa'

export const TEST_DIR = dirname(fileURLToPath(import.meta.url))

// The phone charts and generated data live in `code/base/`.
export const BASE_DIR = resolve(TEST_DIR, '../code/base')

export type ConsonantRow = {
  symbol: string
  place: string
  manner: string
  voicing: string
}

export type VowelRow = {
  symbol: string
  height: string
  backness: string
  roundedness: string
}

export function parseCsv<T extends Record<string, string>>(
  file: string,
): T[] {
  const text = readFileSync(resolve(BASE_DIR, file), 'utf8').trim()
  const lines = text.split(/\r?\n/)
  const header = lines[0]!.split(',')

  return lines.slice(1).map(line => {
    // The CSVs here have no quoted commas.
    const cells = line.split(',')
    const row: Record<string, string> = {}

    header.forEach((col, i) => {
      row[col] = cells[i] ?? ''
    })

    return row as T
  })
}

export function loadConsonants(): ConsonantRow[] {
  return parseCsv<ConsonantRow>('consonants.csv')
}

export function loadVowels(): VowelRow[] {
  return parseCsv<VowelRow>('vowels.csv')
}

export function loadMappings(): {
  consonants: Record<string, string>
  vowels: Record<string, string>
} {
  return JSON.parse(
    readFileSync(resolve(BASE_DIR, 'mappings.json'), 'utf8'),
  ) as {
    consonants: Record<string, string>
    vowels: Record<string, string>
  }
}

export function loadMissing(): string[] {
  const text = readFileSync(
    resolve(BASE_DIR, 'missing.csv'),
    'utf8',
  ).trim()

  return text
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.split(',')[0]!)
    .filter(Boolean)
}

// Universal vowel modifiers (the suprasegmentals). Unlike consonant
// secondary articulations, these apply to ANY vowel and are always
// phonetically meaningful, so cross-producing them is legitimate.
// Tone marks need `tones: true` in the conversion; the rest do not.
export const VOWEL_MODIFIERS: {
  ipa: string
  feature: string
  tones: boolean
}[] = [
  { ipa: '̃', feature: 'nasalization', tones: false },
  { ipa: 'ː', feature: 'long', tones: false },
  { ipa: '̆', feature: 'short', tones: false },
  { ipa: '̯', feature: 'non-syllabic', tones: false },
  { ipa: 'ˈ', feature: 'stress', tones: false },
  { ipa: '˥', feature: 'tone-extra-high', tones: true },
  { ipa: '˦', feature: 'tone-high', tones: true },
  { ipa: '˧', feature: 'tone-mid', tones: true },
  { ipa: '˨', feature: 'tone-low', tones: true },
  { ipa: '˩', feature: 'tone-extra-low', tones: true },
]

export type Combo = {
  ipa: string
  kind: 'consonant' | 'vowel'
  feature: string
  tones: boolean
}

// Consonants are tested as the chart lists them. `consonants.csv` is
// already the curated set of real phones (ejectives, affricates,
// clicks, dentals are explicit rows), so we do NOT synthesize a
// base x modifier cross-product for them: that would invent
// nonsense phones like a tense fricative.
export function consonantCombos(rows = loadConsonants()): Combo[] {
  return rows.map(row => ({
    ipa: row.symbol,
    kind: 'consonant',
    feature: 'base',
    tones: false,
  }))
}

// Vowels ARE tested with their modifiers, because the suprasegmentals
// are universally valid.
export function vowelCombos(rows = loadVowels()): Combo[] {
  const out: Combo[] = []

  for (const row of rows) {
    out.push({
      ipa: row.symbol,
      kind: 'vowel',
      feature: 'base',
      tones: false,
    })

    for (const mod of VOWEL_MODIFIERS) {
      out.push({
        ipa:
          mod.feature === 'stress'
            ? mod.ipa + row.symbol
            : row.symbol + mod.ipa,
        kind: 'vowel',
        feature: mod.feature,
        tones: mod.tones,
      })
    }
  }

  return out
}

export function allCombos(): Combo[] {
  return [...consonantCombos(), ...vowelCombos()]
}

// `makeIpaToTalk`. Tone marks are only honoured when `tones` is true.
// Returns null when the symbol has no mapping (it throws).
export function ipaToTalk(ipa: string, tones = false): string | null {
  try {
    return makeIpaToTalk(ipa, { tones })
  } catch {
    return null
  }
}

// Convert a combo to its Talk form, honouring its tone flag.
export function comboTalk(combo: Combo): string | null {
  return ipaToTalk(combo.ipa, combo.tones)
}

export function talkToIpa(text: string): string | null {
  try {
    return makeTalkToIpa(text)
  } catch {
    return null
  }
}

// Hangul machine encoding. Returns null when a Talk letter has no
// glyph (the tokenizer throws).
export function machine(text: string): string | null {
  try {
    return talk.machine(text)
  } catch {
    return null
  }
}
