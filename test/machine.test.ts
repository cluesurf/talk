// Machine (Hangul) encoding of Talk.
//
// `talk.machine()` maps a Talk string to one Hangul codepoint per
// Talk letter, via the glyph table in `make/index.ts`. For that
// encoding to be lossless it must be BOTH:
//   - injective  (distinct Talk letters -> distinct Hangul), and
//   - total       (every Talk letter `makeIpaToTalk` can produce has
//                  a glyph).
//
// Both hold today: every mapped phone (and its modifier combos) encodes
// to a unique Hangul string. The `no gaps` test below asserts totality
// directly. `test/build-machine-gaps.ts` is an optional diagnostic that
// dumps any gaps to `machine-gaps.csv` while new phones are being added.

import { describe, expect, it } from 'vitest'
import { GLYPHS } from '~/make'
import {
  allCombos,
  comboTalk,
  ipaToTalk,
  loadMappings,
  loadVowels,
  machine,
} from '~/test/helper'

describe('glyph table integrity', () => {
  it('every glyph has a unique Talk key `i`', () => {
    const seen = new Map<string, number>()
    for (const g of GLYPHS) {
      seen.set(g.i, (seen.get(g.i) ?? 0) + 1)
    }
    const dups = [...seen].filter(([, n]) => n > 1).map(([k]) => k)
    expect(dups).toEqual([])
  })

  it('every glyph has a unique Hangul codepoint `x`', () => {
    // This is what makes the machine encoding injective at the letter
    // level: no two Talk letters share a Hangul character.
    const seen = new Map<string, number>()
    for (const g of GLYPHS) {
      seen.set(g.x, (seen.get(g.x) ?? 0) + 1)
    }
    const dups = [...seen].filter(([, n]) => n > 1).map(([k]) => k)
    expect(dups).toEqual([])
  })

  it('every glyph Hangul is a single codepoint', () => {
    const bad = GLYPHS.filter(g => [...g.x].length !== 1).map(g => g.i)
    expect(bad).toEqual([])
  })
})

describe('machine encoding is injective', () => {
  it('distinct Talk letters map to distinct Hangul', () => {
    // Walk every base phone and every base+modifier combo, encode the
    // ones that can be encoded, and confirm no two distinct Talk
    // strings collide onto the same Hangul string.
    const byHangul = new Map<string, string>()
    const collisions: string[] = []
    for (const combo of allCombos()) {
      const talkText = comboTalk(combo)
      if (talkText == null) {
        continue
      }
      const hangul = machine(talkText)
      if (hangul == null) {
        continue
      }
      const prior = byHangul.get(hangul)
      if (prior !== undefined && prior !== talkText) {
        collisions.push(
          `${JSON.stringify(prior)} and ${JSON.stringify(talkText)} both -> ${JSON.stringify(hangul)}`,
        )
      } else {
        byHangul.set(hangul, talkText)
      }
    }
    expect(collisions).toEqual([])
  })

  it('encodes one Hangul codepoint per phonetic letter', () => {
    // Each single sound is one code point (modifiers collapse onto the
    // base); a multi-sound word is one code point per sound.
    const cases: Array<[string, number]> = [
      ['g', 1],
      ['mh!', 1], // voiceless m, one sound
      ['ty~', 1], // palatalized t, one sound
      ['Tw~', 1], // labialized retroflex t, one sound
      ['u$', 1],
      ['tak', 3], // t + a + k
      ['many~a', 4], // m + a + ny~ + a
    ]
    for (const [talkText, len] of cases) {
      const hangul = machine(talkText)
      expect(hangul, talkText).not.toBeNull()
      expect([...(hangul as string)].length, talkText).toBe(len)
    }
  })
})

describe('one Hangul letter per sound', () => {
  it('every mapped consonant is exactly one Hangul code point', () => {
    // Base plus any stack of modifiers collapses onto a single glyph.
    const mappings = loadMappings()
    const bad: string[] = []
    for (const talkText of new Set(Object.values(mappings.consonants))) {
      const hangul = machine(talkText)
      if (hangul == null || [...hangul].length !== 1) {
        bad.push(`${talkText} -> ${hangul}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('every vowel with tone and length is one Hangul code point', () => {
    const bad: string[] = []
    const tones = ['', '˥', '˦', '˧', '˨', '˩']
    const lengths = ['', 'ː']
    for (const vowel of loadVowels()) {
      for (const tone of tones) {
        for (const length of lengths) {
          const talkText = ipaToTalk(vowel.symbol + length + tone, true)
          if (talkText == null) {
            continue
          }
          const hangul = machine(talkText)
          if (hangul == null || [...hangul].length !== 1) {
            bad.push(`${vowel.symbol}${length}${tone} -> ${talkText}`)
          }
        }
      }
    }
    expect(bad).toEqual([])
  })
})

describe('machine encoding coverage', () => {
  it('every mapped phone and modifier combo encodes to Hangul', () => {
    // No snapshot needed: this fails loudly, listing any phone whose
    // Talk form has no glyph, so a new gap can never slip in silently.
    const gaps: string[] = []
    for (const combo of allCombos()) {
      const talkText = comboTalk(combo)
      if (talkText == null) {
        continue
      }
      if (machine(talkText) == null) {
        gaps.push(`${combo.ipa} -> ${talkText}`)
      }
    }
    expect(gaps).toEqual([])
  })
})
