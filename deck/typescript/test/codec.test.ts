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

/** Every type and system, for the checks that must hold across all six. */
const ALL = NOTATIONS.flatMap(type =>
  TIERS.map(system => [type, system] as const),
)

describe('code space', () => {
  it('grows from seed to band to mesh', () => {
    for (const type of NOTATIONS) {
      expect(sizeOf({ type, system: 'seed' })).toBeLessThan(
        sizeOf({ type, system: 'band' }),
      )
      expect(sizeOf({ type, system: 'band' })).toBeLessThan(
        sizeOf({ type, system: 'mesh' })
      )
    }
  })

  it('sizes bytes to the system rather than to one global width', () => {
    // The whole reason widths are per system: `tone seed` is a byte and
    // `ipa mesh` is four, so a single width would waste three quarters.
    expect(byteWidth({ type: 'tone', system: 'seed' })).toBe(1)
    expect(byteWidth({ type: 'tone', system: 'band' })).toBe(2)
    expect(byteWidth({ type: 'tone', system: 'mesh' })).toBe(2)
    expect(byteWidth({ type: 'ipa', system: 'seed' })).toBe(1)
    expect(byteWidth({ type: 'ipa', system: 'band' })).toBe(3)
    expect(byteWidth({ type: 'ipa', system: 'mesh' })).toBe(4)
  })

  it('keeps every code inside its declared width', () => {
    for (const [type, system] of ALL) {
      const width = byteWidth({ type, system })
      const size = sizeOf({ type, system })

      expect(size).toBeLessThanOrEqual(256 ** width)
    }
  })
})

describe('encode and decode', () => {
  it('round-trips the first and last code of every system', () => {
    for (const [type, system] of ALL) {
      const size = sizeOf({ type, system })

      for (const code of [0, 1, size - 2, size - 1]) {
        const composition = decodeUnit({ code, type, system })

        expect(encodeUnit({ composition, type, system })).toBe(code)
      }
    }
  })

  it('round-trips a spread across each system', () => {
    for (const [type, system] of ALL) {
      const size = sizeOf({ type, system })
      const step = Math.max(1, Math.floor(size / 500))

      for (let code = 0; code < size; code += step) {
        const composition = decodeUnit({ code, type, system })

        expect(encodeUnit({ composition, type, system })).toBe(code)
      }
    }
  })

  it('covers the whole space with no gaps, on the small tiers', () => {
    // Exhaustive where it is cheap, which proves the offsets and radices
    // line up rather than merely sampling well.
    for (const type of NOTATIONS) {
      const size = sizeOf({ type, system: 'seed' })
      const seen = new Set<number>()

      for (let code = 0; code < size; code++) {
        const composition = decodeUnit({ code, type, system: 'seed' })
        seen.add(encodeUnit({ composition, type, system: 'seed' }))
      }

      expect(seen.size).toBe(size)
    }
  })

  it('is injective on tone band, exhaustively', () => {
    const size = sizeOf({ type: 'tone', system: 'band' })
    const seen = new Set<number>()

    for (let code = 0; code < size; code++) {
      const composition = decodeUnit({
        code,
        type: 'tone',
        system: 'band',
      })

      seen.add(encodeUnit({ composition, type: 'tone', system: 'band' }))
    }

    expect(seen.size).toBe(size)
  })

  it('refuses a code outside the space', () => {
    for (const [type, system] of ALL) {
      const size = sizeOf({ type, system })

      expect(() => decodeUnit({ code: -1, type, system })).toThrow()
      expect(() => decodeUnit({ code: size, type, system })).toThrow()
    }
  })

  it('refuses a base the system does not hold', () => {
    expect(() =>
      encodeUnit({
        composition: { base: 'not-a-sound', marks: [] },
        type: 'tone',
        system: 'mesh',
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
        type: 'tone',
        system: 'mesh',
      }),
    ).toThrow()
  })
})

describe('pack and unpack', () => {
  it('uses exactly width bytes per code', () => {
    for (const [type, system] of ALL) {
      const width = byteWidth({ type, system })
      const codes = [0, 1, 2]

      expect(pack({ codes, type, system })).toHaveLength(
        codes.length * width,
      )
    }
  })

  it('round-trips through bytes', () => {
    for (const [type, system] of ALL) {
      const size = sizeOf({ type, system })
      const codes = [0, 1, Math.floor(size / 2), size - 1]

      expect(
        unpack({ bytes: pack({ codes, type, system }), type, system }),
      ).toEqual(codes)
    }
  })

  it('packs big-endian', () => {
    const bytes = pack({ codes: [0x010203], type: 'ipa', system: 'band' })

    expect([...bytes]).toEqual([0x01, 0x02, 0x03])
  })

  it('ignores a trailing partial code', () => {
    // A truncated buffer yields the codes it does hold rather than a
    // corrupt final value.
    const bytes = pack({ codes: [5, 6], type: 'tone', system: 'band' })
    const short = bytes.slice(0, bytes.length - 1)

    expect(
      unpack({ bytes: short, type: 'tone', system: 'band' }),
    ).toEqual([5])
  })
})
