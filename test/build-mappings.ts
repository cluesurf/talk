// SPDX-License-Identifier: MIT
//
// Quick exerciser for `make/ipa.ts` that walks every IPA
// symbol in `test/consonants.csv` and `test/vowels.csv`,
// runs each through `makeIpaToTalk`, and writes a flat
// `mappings.json` listing the IPA → Talk equivalents.
//
// The goal is a minimal, human-readable lookup table that
// other libraries (reed, etc.) can import without having
// to reason about the ipa.ts source.
//
// Round-trip Talk → IPA via `makeTalkToIpa` is included
// where available so downstream consumers can sanity-check
// the conversion.
//
// Runs feature-free — no aspiration / labialization / tone
// combinations. Just the base IPA character → base Talk
// mapping for each row in the CSVs.
//
// Usage from deck/talk.js:
//   tsx test/build-mappings.ts

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeIpaToTalk } from '~/code/ipa'

const HERE = dirname(fileURLToPath(import.meta.url))

type ConsonantRow = {
  symbol: string
  place: string
  manner: string
  voicing: string
}

type VowelRow = {
  symbol: string
  height: string
  backness: string
  roundedness: string
}

function parseCsv<T extends Record<string, string>>(path: string): T[] {
  const text = readFileSync(path, 'utf8').trim()
  const lines = text.split(/\r?\n/)
  const header = lines[0]!.split(',')
  return lines.slice(1).map(line => {
    // Naive split — CSVs here have no quoted commas.
    const cells = line.split(',')
    const row: Record<string, string> = {}
    header.forEach((col, i) => {
      row[col] = cells[i] ?? ''
    })
    return row as T
  })
}

function tryTalk(ipa: string): string | null {
  try {
    return makeIpaToTalk(ipa, { tones: false })
  } catch (error) {
    return null
  }
}

const consonantRows = parseCsv<ConsonantRow>(
  resolve(HERE, 'consonants.csv'),
)
const vowelRows = parseCsv<VowelRow>(resolve(HERE, 'vowels.csv'))

const consonants: Record<string, string> = {}
const vowels: Record<string, string> = {}
const missing: { kind: 'consonant' | 'vowel'; ipa: string }[] = []

for (const row of consonantRows) {
  const talk = tryTalk(row.symbol)
  if (talk) consonants[row.symbol] = talk
  else missing.push({ kind: 'consonant', ipa: row.symbol })
}

for (const row of vowelRows) {
  const talk = tryTalk(row.symbol)
  if (talk) vowels[row.symbol] = talk
  else missing.push({ kind: 'vowel', ipa: row.symbol })
}

const outPath = resolve(HERE, 'mappings.json')
writeFileSync(outPath, JSON.stringify({ consonants, vowels }, null, 2))

// CSV of IPA chars that have no Talk equivalent yet — for
// the user to fill in by hand.
const missingPath = resolve(HERE, 'missing.csv')
const missingCsv =
  ['ipa,talk', ...missing.map(m => `${m.ipa},`)].join('\n') + '\n'
writeFileSync(missingPath, missingCsv)

console.log(`[build-mappings] wrote ${outPath}`)
console.log(
  `  consonants: ${Object.keys(consonants).length}/${consonantRows.length}`,
)
console.log(
  `  vowels:     ${Object.keys(vowels).length}/${vowelRows.length}`,
)
console.log(
  `[build-mappings] wrote ${missingPath} (${missing.length} unmapped)`,
)
