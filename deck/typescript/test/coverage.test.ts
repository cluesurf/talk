import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import PHONES from '../base/phones.json'

// Ported from the v1 coverage suite. The IPA charts (base/ipa/*.csv) are the
// full inventory. Every chart symbol must either be a cleanly supported
// phone or be listed in missing.csv as a known, unsupported symbol. Nothing
// is allowed to silently fall through. A provisional phone is only an
// approximate fallback for an otherwise-unsupported symbol, so it does not
// count as supported (those symbols belong in missing.csv).
const HERE = dirname(fileURLToPath(import.meta.url))

function column(file: string): string[] {
  return readFileSync(resolve(HERE, '../base/ipa', file), 'utf8')
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.split(',')[0]!)
    .filter(Boolean)
}

const nfd = (text: string) => text.normalize('NFD')
const supported = new Set(
  (PHONES as { ipa: string; provisional?: boolean }[])
    .filter(p => !p.provisional)
    .map(p => nfd(p.ipa)),
)
const isSupported = (symbol: string) => supported.has(nfd(symbol))

const consonants = column('consonants.csv')
const vowels = column('vowels.csv')
const missing = new Set(column('missing.csv'))

describe('every IPA chart symbol is accounted for', () => {
  it('every consonant is either supported or documented missing', () => {
    const unaccounted = consonants.filter(
      s => !isSupported(s) && !missing.has(s),
    )

    expect(unaccounted).toEqual([])
  })

  it('every vowel is either supported or documented missing', () => {
    const unaccounted = vowels.filter(s => !isSupported(s) && !missing.has(s))

    expect(unaccounted).toEqual([])
  })
})

describe('missing.csv is exactly the unsupported set', () => {
  it('lists no symbol that is actually supported', () => {
    const stale = [...missing].filter(isSupported)

    expect(stale).toEqual([])
  })

  it('lists only symbols that appear in the charts', () => {
    const inChart = new Set([...consonants, ...vowels])
    const orphaned = [...missing].filter(s => !inChart.has(s))

    expect(orphaned).toEqual([])
  })
})
