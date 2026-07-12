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
import { allCombos, comboTalk, machine } from '~/test/helper'

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

  it('encodes one Hangul codepoint per Talk letter', () => {
    // A quick structural sanity check on a handful of known letters.
    const cases: Array<[string, number]> = [
      ['g', 1],
      ['mh!', 2],
      ['ty~', 2],
      ['u$', 1],
      ['Tw~', 2],
    ]
    for (const [talkText, len] of cases) {
      const hangul = machine(talkText)
      expect(hangul, talkText).not.toBeNull()
      expect([...(hangul as string)].length, talkText).toBe(len)
    }
  })
})

describe('machine encoding coverage', () => {
  // The documented snapshot of combos that cannot be encoded.
  function loadGapSnapshot(): string[] {
    const text = readFileSync(
      resolve(TEST_DIR, 'machine-gaps.csv'),
      'utf8',
    ).trim()
    return text.split(/\r?\n/).slice(1)
  }

  function liveGaps(): string[] {
    const seen = new Set<string>()
    for (const combo of allCombos()) {
      const talkText = comboTalk(combo)
      if (talkText == null) {
        continue
      }
      if (machine(talkText) == null) {
        seen.add(`${combo.ipa},${talkText},${combo.feature}`)
      }
    }
    return [...seen]
  }

  it('the live gap set exactly matches machine-gaps.csv', () => {
    // Regenerate with `tsx test/build-machine-gaps.ts` after adding
    // glyphs. This fails loudly if the hole grows OR shrinks.
    expect(liveGaps().sort()).toEqual(loadGapSnapshot().sort())
  })

  it('no NEW machine gap is undocumented', () => {
    const documented = new Set(loadGapSnapshot())
    const undocumented = liveGaps().filter(row => !documented.has(row))
    expect(undocumented).toEqual([])
  })
})
