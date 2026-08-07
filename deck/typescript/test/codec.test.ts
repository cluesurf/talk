import { describe, expect, it } from 'vitest'

import {
  byteWidth,
  decodeUnit,
  encodeUnit,
  modelFor,
  pack,
  sizeOf,
  unpack,
} from '../code'
import type { Notation, Tier } from '../code'

const NOTATIONS: Notation[] = ['ipa', 'tone']
const TIERS: Tier[] = ['seed', 'band', 'mesh']

/** Every notation and tier, for the checks that must hold across all six. */
const ALL = NOTATIONS.flatMap(notation =>
  TIERS.map(tier => [notation, tier] as const),
)

describe('code space', () => {
  it('grows from seed to band to mesh', () => {
    for (const notation of NOTATIONS) {
      expect(sizeOf({ notation, tier: 'seed' })).toBeLessThan(
        sizeOf({ notation, tier: 'band' }),
      )
      expect(sizeOf({ notation, tier: 'band' })).toBeLessThan(
        sizeOf({ notation, tier: 'mesh' })
      )
    }
  })

  it('sizes bytes to the tier rather than to one global width', () => {
    // The whole reason widths are per tier: `tone seed` is a byte and
    // `ipa mesh` is four, so a single width would waste three quarters.
    expect(byteWidth({ notation: 'tone', tier: 'seed' })).toBe(1)
    expect(byteWidth({ notation: 'tone', tier: 'band' })).toBe(2)
    expect(byteWidth({ notation: 'tone', tier: 'mesh' })).toBe(2)
    expect(byteWidth({ notation: 'ipa', tier: 'seed' })).toBe(1)
    expect(byteWidth({ notation: 'ipa', tier: 'band' })).toBe(3)
    expect(byteWidth({ notation: 'ipa', tier: 'mesh' })).toBe(4)
  })

  it('keeps every code inside its declared width', () => {
    for (const [notation, tier] of ALL) {
      const width = byteWidth({ notation, tier })
      const size = sizeOf({ notation, tier })

      expect(size).toBeLessThanOrEqual(256 ** width)
    }
  })
})

describe('encode and decode', () => {
  it('round-trips the first and last code of every tier', () => {
    for (const [notation, tier] of ALL) {
      const size = sizeOf({ notation, tier })

      for (const code of [0, 1, size - 2, size - 1]) {
        const composition = decodeUnit({ code, notation, tier })

        expect(encodeUnit({ composition, notation, tier })).toBe(code)
      }
    }
  })

  it('round-trips a spread across each tier', () => {
    for (const [notation, tier] of ALL) {
      const size = sizeOf({ notation, tier })
      const step = Math.max(1, Math.floor(size / 500))

      for (let code = 0; code < size; code += step) {
        const composition = decodeUnit({ code, notation, tier })

        expect(encodeUnit({ composition, notation, tier })).toBe(code)
      }
    }
  })

  it('covers the whole space with no gaps, on the small tiers', () => {
    // Exhaustive where it is cheap, which proves the offsets and radices
    // line up rather than merely sampling well.
    for (const notation of NOTATIONS) {
      const size = sizeOf({ notation, tier: 'seed' })
      const seen = new Set<number>()

      for (let code = 0; code < size; code++) {
        const composition = decodeUnit({ code, notation, tier: 'seed' })
        seen.add(encodeUnit({ composition, notation, tier: 'seed' }))
      }

      expect(seen.size).toBe(size)
    }
  })

  it('is injective on tone band, exhaustively', () => {
    const size = sizeOf({ notation: 'tone', tier: 'band' })
    const seen = new Set<number>()

    for (let code = 0; code < size; code++) {
      const composition = decodeUnit({
        code,
        notation: 'tone',
        tier: 'band',
      })

      seen.add(encodeUnit({ composition, notation: 'tone', tier: 'band' }))
    }

    expect(seen.size).toBe(size)
  })

  it('refuses a code outside the space', () => {
    for (const [notation, tier] of ALL) {
      const size = sizeOf({ notation, tier })

      expect(() => decodeUnit({ code: -1, notation, tier })).toThrow()
      expect(() => decodeUnit({ code: size, notation, tier })).toThrow()
    }
  })

  it('refuses a base the tier does not hold', () => {
    expect(() =>
      encodeUnit({
        composition: { base: 'not-a-sound', marks: [] },
        notation: 'tone',
        tier: 'mesh',
      }),
    ).toThrow()
  })

  it('refuses a mark the base cannot carry', () => {
    // A silent fallback here would file a wrong sound at a real code,
    // which is worse than failing.
    const model = modelFor('tone')
    const vowel = model.bases.find(base => base.form === 'vowel')!

    expect(() =>
      encodeUnit({
        composition: { base: vowel.key, marks: ['h~'] },
        notation: 'tone',
        tier: 'mesh',
      }),
    ).toThrow()
  })
})

describe('pack and unpack', () => {
  it('uses exactly width bytes per code', () => {
    for (const [notation, tier] of ALL) {
      const width = byteWidth({ notation, tier })
      const codes = [0, 1, 2]

      expect(pack({ codes, notation, tier })).toHaveLength(
        codes.length * width,
      )
    }
  })

  it('round-trips through bytes', () => {
    for (const [notation, tier] of ALL) {
      const size = sizeOf({ notation, tier })
      const codes = [0, 1, Math.floor(size / 2), size - 1]

      expect(
        unpack({ bytes: pack({ codes, notation, tier }), notation, tier }),
      ).toEqual(codes)
    }
  })

  it('packs big-endian', () => {
    const bytes = pack({ codes: [0x010203], notation: 'ipa', tier: 'band' })

    expect([...bytes]).toEqual([0x01, 0x02, 0x03])
  })

  it('ignores a trailing partial code', () => {
    // A truncated buffer yields the codes it does hold rather than a
    // corrupt final value.
    const bytes = pack({ codes: [5, 6], notation: 'tone', tier: 'band' })
    const short = bytes.slice(0, bytes.length - 1)

    expect(
      unpack({ bytes: short, notation: 'tone', tier: 'band' }),
    ).toEqual([5])
  })
})
