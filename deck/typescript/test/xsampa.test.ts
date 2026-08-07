import { describe, expect, it } from 'vitest'

import {
  ipaToTalk,
  ipaToXsampa,
  parseXsampa,
  talkToIpa,
  talkToXsampa,
  xsampaToIpa,
  xsampaToTalk,
} from '../code'
import PHONES from '../base/phones.json'
import MODIFIERS from '../base/modifiers.json'

// X-SAMPA is the ASCII transliteration of IPA, so it is derived from the
// same phone and modifier tables rather than from a separate mapping.
// These tests hold it to the same guarantees the IPA conversions have:
// talk is the canonical normal form, and every base and modifier in the
// inventory must survive a round trip.
const phones = PHONES as {
  ipa: string
  talk: string
  xsampa: string
  provisional?: boolean
}[]

const modifiers = MODIFIERS as {
  ipa: string
  talk: string
  xsampa: string
  base: 'consonant' | 'vowel'
  feature: string
}[]

describe('x-sampa to talk', () => {
  it('reads a plain word', () => {
    expect(xsampaToTalk('kat')).toBe('kat')
  })

  it('reads an aspirated stop', () => {
    expect(xsampaToTalk('k_hat')).toBe(ipaToTalk('kʰat'))
  })

  it('reads a long vowel', () => {
    expect(xsampaToTalk('si:n')).toBe(ipaToTalk('siːn'))
  })

  it('reads a nasalized vowel', () => {
    expect(xsampaToTalk('nO_~')).toBe(ipaToTalk('nɔ̃'))
  })

  it('reads leading stress', () => {
    expect(xsampaToTalk('"hEloU')).toBe(ipaToTalk('ˈhɛloʊ'))
  })

  it('carries unknown input through rather than dropping it', () => {
    const units = parseXsampa('k§t')

    expect(units.map(u => u.role)).toEqual(['phone', 'unknown', 'phone'])
    expect(xsampaToTalk('k§t')).toContain('§')
  })
})

describe('x-sampa reads the spellings IPA gives away', () => {
  // In IPA these characters are passthrough symbols. X-SAMPA claims them
  // for sounds, and reading them as symbols would silently produce the
  // wrong pronunciation.
  it('reads ? as the glottal stop, not as punctuation', () => {
    expect(xsampaToIpa('?a')).toBe('ʔa')
  })

  it('reads digits as vowels, not as numerals', () => {
    expect(xsampaToIpa('1')).toBe('ɨ')
    expect(xsampaToIpa('9')).toBe('œ')
  })
})

describe('every base phone round-trips through x-sampa', () => {
  it('has a non-trivial inventory', () => {
    expect(new Set(phones.map(p => p.xsampa)).size).toBeGreaterThan(100)
  })

  it('gives every phone a distinct x-sampa spelling', () => {
    const empty = phones.filter(p => !p.xsampa)

    expect(empty).toEqual([])
  })

  it('every canonical talk letter survives talk -> xsampa -> talk', () => {
    const inventory = [...new Set(phones.map(p => p.talk))]
    const broken: string[] = []

    for (const talk of inventory) {
      const xsampa = talkToXsampa(talk)
      const back = xsampaToTalk(xsampa)

      if (back !== talk) {
        broken.push(`${talk} -> ${xsampa} -> ${back}`)
      }
    }

    expect(broken).toEqual([])
  })

  it('reads every x-sampa spelling back to its own IPA', () => {
    // A handful of phones share an x-sampa spelling, and the scanner
    // resolves a spelling to the first phone declared for it, so compare
    // against that one rather than against every phone that claims it.
    const first = new Map<string, (typeof phones)[number]>()

    for (const phone of phones) {
      if (!first.has(phone.xsampa)) {
        first.set(phone.xsampa, phone)
      }
    }

    const broken: string[] = []

    for (const [xsampa, phone] of first) {
      // Compare in one normal form: the data spells some phones
      // precomposed (ç) and the IPA scanner works decomposed.
      const ipa = xsampaToIpa(xsampa).normalize('NFD')

      if (ipa !== phone.ipa.normalize('NFD')) {
        broken.push(`${xsampa} -> ${ipa}, expected ${phone.ipa}`)
      }
    }

    expect(broken).toEqual([])
  })
})

describe('every modifier round-trips through x-sampa', () => {
  it('gives every modifier an x-sampa spelling', () => {
    expect(modifiers.filter(m => !m.xsampa)).toEqual([])
  })

  it('applies each modifier to a compatible base', () => {
    const broken: string[] = []

    for (const modifier of modifiers) {
      // Pick a base the modifier is written for, so the composed sound is
      // one the encoding actually admits.
      const base = phones.find(
        p =>
          !p.provisional &&
          p.talk === (modifier.base === 'vowel' ? 'a' : 'k'),
      )

      if (!base) {
        continue
      }

      const talk = ipaToTalk(
        modifier.ipa && modifier.xsampa === '"'
          ? modifier.ipa + base.ipa
          : base.ipa + modifier.ipa,
      )

      const xsampa = talkToXsampa(talk)
      const back = xsampaToTalk(xsampa)

      if (back !== talk) {
        broken.push(`${modifier.feature}: ${talk} -> ${xsampa} -> ${back}`)
      }
    }

    expect(broken).toEqual([])
  })
})

describe('ipa and x-sampa are two spellings of one parse', () => {
  const words = ['kʰat', 'siːn', 'ʃɛf', 'nɔ̃', 'ʔa', 'kʲuː']

  it('ipa -> xsampa -> ipa is the identity', () => {
    const broken: string[] = []

    for (const ipa of words) {
      const back = xsampaToIpa(ipaToXsampa(ipa))

      if (back !== ipa.normalize('NFD')) {
        broken.push(`${ipa} -> ${ipaToXsampa(ipa)} -> ${back}`)
      }
    }

    expect(broken).toEqual([])
  })

  it('reaches the same talk string by either notation', () => {
    for (const ipa of [...words, 'ˈhɛloʊ']) {
      expect(xsampaToTalk(ipaToXsampa(ipa))).toBe(ipaToTalk(ipa))
    }
  })

  it('moves a leading stress mark onto the vowel, as the IPA path does', () => {
    // A stress mark binds to the syllable's vowel, not to its onset, so
    // both notations re-emit it there. The two paths must agree, which is
    // the property that matters; the mark's original position is not
    // recoverable from either.
    expect(talkToIpa(ipaToTalk('ˈhɛloʊ'))).toBe('hˈɛloɯ')
    expect(talkToXsampa(ipaToTalk('ˈhɛloʊ'))).toBe('h"EloM')
    expect(ipaToXsampa('ˈhɛloʊ')).toBe('h"EloU')
  })
})
