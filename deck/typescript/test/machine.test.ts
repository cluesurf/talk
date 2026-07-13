import { describe, expect, it } from 'vitest'

import { enumerateSounds, machine } from '../code'

// Ported from the v1 machine suite. The Hangul encoding maps each talk
// sound to one code point, and the encoding is both total (every sound
// has a glyph) and injective (distinct sounds never collide).

describe('machine encoding is one Hangul code point per sound', () => {
  const cases: [string, number][] = [
    ['g', 1],
    ['mh!', 1], // voiceless m (m̥), one sound
    ['ny~', 1], // palatal nasal (ɲ), one sound
    ['bbh!', 1], // voiceless bilabial trill (ʙ̥), one sound
    ['u$', 1],
    ['tak', 3], // t + a + k
    ['many~a', 4], // m + a + ny~ + a
  ]

  for (const [talk, len] of cases) {
    it(`encodes ${talk} as ${len} code point(s)`, () => {
      expect([...machine(talk)]).toHaveLength(len)
    })
  }
})

describe('machine encoding is injective', () => {
  it('distinct enumerated sounds map to distinct Hangul', () => {
    const byHangul = new Map<string, string>()
    const collisions: string[] = []

    for (const sound of enumerateSounds()) {
      const hangul = machine(sound.talk)

      if (!hangul) {
        continue
      }

      const prior = byHangul.get(hangul)

      if (prior !== undefined && prior !== sound.talk) {
        collisions.push(`${prior} and ${sound.talk} both -> ${hangul}`)
      } else {
        byHangul.set(hangul, sound.talk)
      }
    }

    expect(collisions).toEqual([])
  })

  it('every enumerated sound encodes to exactly one code point', () => {
    const bad: string[] = []

    for (const sound of enumerateSounds()) {
      if ([...machine(sound.talk)].length !== 1) {
        bad.push(sound.talk)
      }
    }

    expect(bad).toEqual([])
  })
})
