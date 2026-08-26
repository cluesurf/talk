import { describe, expect, it } from 'vitest'

import { enumerateSounds, machine } from '../code'

// Ported from the v1 machine suite. The Hangul encoding maps each talk
// sound to one code point, and the encoding is both total (every sound
// has a glyph) and injective (distinct sounds never collide).

describe('machine encoding is one Hangul code point per sound', () => {
  const cases: [string, number][] = [
    ['g', 1],
    ['m<v->', 1], // voiceless m (m̥), one sound
    ['n<y>', 1], // palatal nasal (ɲ), one sound
    ['b<rv->', 1], // voiceless bilabial trill (ʙ̥), one sound
    ['$r', 1],
    ['tak', 3], // t + a + k
    ['man<y>a', 4], // m + a + ny~ + a
  ]

  for (const [talk, len] of cases) {
    it(`encodes ${talk} as ${len} code point(s)`, () => {
      expect([...machine({ text: talk, type: 'tone', system: 'mesh' })]).toHaveLength(len)
    })
  }
})

describe('machine encoding is injective', () => {
  it('distinct enumerated sounds map to distinct codes', () => {
    const byCode = new Map<number, string>()
    const collisions: string[] = []

    for (const sound of enumerateSounds()) {
      const [code] = machine({ text: sound.talk, type: 'tone', system: 'mesh' })

      if (code === undefined || code < 0) {
        continue
      }

      const prior = byCode.get(code)

      if (prior !== undefined && prior !== sound.talk) {
        collisions.push(`${prior} and ${sound.talk} both -> ${code}`)
      } else {
        byCode.set(code, sound.talk)
      }
    }

    expect(collisions).toEqual([])
  })

  it('every enumerated sound encodes to exactly one code point', () => {
    const bad: string[] = []

    for (const sound of enumerateSounds()) {
      if ([...machine({ text: sound.talk, type: 'tone', system: 'mesh' })].length !== 1) {
        bad.push(sound.talk)
      }
    }

    expect(bad).toEqual([])
  })
})
