// IPA -> Talk coverage of the phoneme charts.
//
// `consonants.csv` and `vowels.csv` are the full IPA inventory. Every
// row must either map through `makeIpaToTalk` (and be recorded in
// `mappings.json`) or be listed in `missing.csv` as a known,
// unmapped symbol. Nothing is allowed to silently fall through.

import { describe, expect, it } from 'vitest'
import {
  ipaToTalk,
  loadConsonants,
  loadMappings,
  loadMissing,
  loadVowels,
} from '~/test/helper'

describe('every phoneme is accounted for', () => {
  const mappings = loadMappings()
  const missing = new Set(loadMissing())

  it('every consonant is either mapped or in missing.csv', () => {
    const unaccounted: string[] = []
    for (const row of loadConsonants()) {
      const talkText = ipaToTalk(row.symbol)
      if (talkText == null && !missing.has(row.symbol)) {
        unaccounted.push(row.symbol)
      }
    }
    expect(unaccounted).toEqual([])
  })

  it('every vowel is either mapped or in missing.csv', () => {
    const unaccounted: string[] = []
    for (const row of loadVowels()) {
      const talkText = ipaToTalk(row.symbol)
      if (talkText == null && !missing.has(row.symbol)) {
        unaccounted.push(row.symbol)
      }
    }
    expect(unaccounted).toEqual([])
  })
})

describe('mappings.json is in sync with makeIpaToTalk', () => {
  const mappings = loadMappings()

  it('every consonant mapping matches the live conversion', () => {
    const drift: string[] = []
    for (const [ipa, talkText] of Object.entries(mappings.consonants)) {
      const live = ipaToTalk(ipa)
      if (live !== talkText) {
        drift.push(`${ipa}: ${talkText} != ${live}`)
      }
    }
    expect(drift).toEqual([])
  })

  it('every vowel mapping matches the live conversion', () => {
    const drift: string[] = []
    for (const [ipa, talkText] of Object.entries(mappings.vowels)) {
      const live = ipaToTalk(ipa)
      if (live !== talkText) {
        drift.push(`${ipa}: ${talkText} != ${live}`)
      }
    }
    expect(drift).toEqual([])
  })
})

describe('missing.csv is exactly the unmapped set', () => {
  it('has no symbol that actually maps', () => {
    const stale: string[] = []
    for (const ipa of loadMissing()) {
      if (ipaToTalk(ipa) != null) {
        stale.push(ipa)
      }
    }
    expect(stale).toEqual([])
  })

  it('lists every consonant/vowel symbol that does not map', () => {
    const missing = new Set(loadMissing())
    const undocumented: string[] = []
    for (const row of [...loadConsonants(), ...loadVowels()]) {
      if (ipaToTalk(row.symbol) == null && !missing.has(row.symbol)) {
        undocumented.push(row.symbol)
      }
    }
    expect(undocumented).toEqual([])
  })
})
