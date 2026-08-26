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

  it('describes every consonant', () => {
    // This used to pin a list of eight that carried no place, manner or
    // voicing: `ɬʼ` and the seven clicks. They were not undescribable, only
    // undescribed, and a feature-weighted comparison had to fall back to
    // string equality for each of them. 37 consonants were in that state
    // across the table, the clicks and the ejectives and the implosives, and
    // only `‼` had ever been filled in.
    //
    // They are filled in now, from phoible's feature bundles and the place
    // abbreviations already sitting in `ipa/consonants.csv`, so the list is
    // empty and the assertion is that it stays that way.
    const bare = phones
      .filter(
        p =>
          p.form === 'consonant' && !p.place && !p.manner && !p.voicing,
      )
      .map(p => p.ipa)

    expect(bare).toEqual([])
  })

  it('covers both forms', () => {
    expect(phones.some(p => p.form === 'consonant')).toBe(true)
    expect(phones.some(p => p.form === 'vowel')).toBe(true)
  })
})

describe('phone inventory matches what the scanner reads', () => {
  it('reads every base back to one sound with the same spelling', () => {
    const broken: string[] = []

    // A phone spelled compositionally (`mh!` is `m` plus voiceless) is not
    // a sound STARTER, so the scanner returns the plain base carrying a
    // modifier rather than the composed phone. That is the same sound and
    // the same talk, which is what has to hold; the base underneath it is
    // deliberately the simpler one.
    for (const phone of phones) {
      const sounds = segment(phone.talk)
      const sound = sounds[0]

      if (sounds.length !== 1 || sound?.talk !== phone.talk) {
        broken.push(`${phone.talk} read as ${sound?.talk ?? 'nothing'}`)
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
