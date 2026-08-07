import { describe, expect, it } from 'vitest'

import { enumeratePhones, ipaToTalk, segment } from '../code'

// `enumeratePhones` is the base inventory a talk string decomposes into.
// Callers use it to score two sounds by the articulatory features they
// share (k and g differ only in voicing; k and m differ in manner), so
// the guarantees that matter are: one entry per talk spelling, every
// entry carries features, and the entries are the same objects the
// scanner hands back.
const phones = enumeratePhones()

describe('phone inventory', () => {
  it('is non-trivial', () => {
    expect(phones.length).toBeGreaterThan(100)
  })

  it('has exactly one entry per talk spelling', () => {
    const spellings = phones.map(p => p.talk)

    expect(new Set(spellings).size).toBe(spellings.length)
  })

  it('gives every vowel a height, a backness and a roundedness', () => {
    const bare = phones.filter(
      p =>
        p.form === 'vowel' &&
        (!p.height || !p.backness || !p.roundedness),
    )

    expect(bare.map(p => p.ipa)).toEqual([])
  })

  it('gives almost every consonant something to compare on', () => {
    const consonants = phones.filter(p => p.form === 'consonant')
    const described = consonants.filter(
      p => p.place || p.manner || p.voicing,
    )

    expect(described.length / consonants.length).toBeGreaterThan(0.9)
  })

  it('leaves only the clicks and a few implosives undescribed', () => {
    // These carry no place, manner or voicing in the charts, so a
    // feature-weighted comparison can only fall back to string equality
    // for them. Pinned so the set cannot grow unnoticed. A couple of
    // other featureless chart entries (ᶑ̊, ʄ̊) never reach the inventory,
    // because a described phone represents their talk spelling.
    const bare = phones
      .filter(
        p =>
          p.form === 'consonant' && !p.place && !p.manner && !p.voicing,
      )
      .map(p => p.ipa)

    expect(bare).toEqual(['ɬʼ', 'ʘ', 'ǀ', 'ǃ', '𝼊', 'ǂ', 'ʞ', 'ǁ'])
  })

  it('covers both forms', () => {
    expect(phones.some(p => p.form === 'consonant')).toBe(true)
    expect(phones.some(p => p.form === 'vowel')).toBe(true)
  })
})

describe('phone inventory matches what the scanner reads', () => {
  it('reads every base back to its own inventory entry', () => {
    const broken: string[] = []

    for (const phone of phones) {
      const sounds = segment(phone.talk)
      const base = sounds[0]?.base

      if (sounds.length !== 1 || base?.talk !== phone.talk) {
        broken.push(`${phone.talk} read as ${base?.talk ?? 'nothing'}`)
      }
    }

    expect(broken).toEqual([])
  })

  it('shares features between k and g except voicing', () => {
    const k = phones.find(p => p.talk === 'k')
    const g = phones.find(p => p.talk === 'g')

    expect(k?.place).toBe(g?.place)
    expect(k?.manner).toBe(g?.manner)
    expect(k?.voicing).not.toBe(g?.voicing)
  })

  it('separates a stop from a nasal by manner', () => {
    const k = phones.find(p => p.talk === 'k')
    const m = phones.find(p => p.talk === 'm')

    expect(k?.manner).not.toBe(m?.manner)
  })

  it('describes a sound recovered from IPA', () => {
    const base = segment(ipaToTalk('ʃ'))[0]?.base

    expect(base?.manner).toBeDefined()
    expect(base?.place).toBeDefined()
  })
})
