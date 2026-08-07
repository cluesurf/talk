// Dense integer codes for every tier of both notations.
//
// The code is COMPUTED, not looked up. `ipa mesh` holds 166 million
// sounds, which no table wants to be, so each code is a mixed-radix index:
// a base picks an offset, and each axis contributes a digit whose radix is
// how many marks that axis offers THAT base. Attachment rules make the
// radix ragged, so the offsets are prefix sums over per-base products.
//
// The result is a bijection onto `[0, producible)`, which is what makes
// the byte widths in `byteWidth` tight rather than generous.

import { axesFor, modelFor } from './model'
import type { ModelAxis, ModelBase, Notation, Tier } from './model'

/** How many marks an axis offers a base, plus the option of none. */
function radix(axis: ModelAxis, base: ModelBase): number {
  let options = 1

  for (const mark of axis.marks) {
    if (mark.allows(base)) options += 1
  }

  return options
}

type Layout = {
  bases: ModelBase[]
  axes: ModelAxis[]
  /** Radix per base, per axis. */
  radices: number[][]
  /** Where each base's block starts. */
  offsets: number[]
  size: number
}

const layouts = new Map<string, Layout>()

/** The offset table for a tier, built once. */
function layoutFor(notation: Notation, tier: Tier): Layout {
  const cacheKey = `${notation}:${tier}`
  const cached = layouts.get(cacheKey)

  if (cached) return cached

  const { bases } = modelFor(notation)
  const axes = axesFor(notation, tier)

  const radices: number[][] = []
  const offsets: number[] = []

  let size = 0

  for (const base of bases) {
    const row = axes.map(axis => radix(axis, base))

    offsets.push(size)
    radices.push(row)
    size += row.reduce((product, options) => product * options, 1)
  }

  const layout = { bases, axes, radices, offsets, size }

  layouts.set(cacheKey, layout)

  return layout
}

/** How many codes a tier has, which is the producible count. */
export function sizeOf({
  notation,
  tier,
}: {
  notation: Notation
  tier: Tier
}): number {
  if (tier === 'seed') return modelFor(notation).units.length

  return layoutFor(notation, tier).size
}

/**
 * Bytes one code needs, so a caller can pack to a fixed width.
 *
 * Sized to the tier rather than to a single global width, since `tone
 * seed` fits in one byte and `ipa mesh` needs four.
 */
export function byteWidth({
  notation,
  tier,
}: {
  notation: Notation
  tier: Tier
}): 1 | 2 | 3 | 4 {
  const bits = Math.ceil(Math.log2(Math.max(2, sizeOf({ notation, tier }))))
  const bytes = Math.ceil(bits / 8)

  if (bytes <= 1) return 1
  if (bytes === 2) return 2
  if (bytes === 3) return 3

  return 4
}

/** A sound broken into the parts a code is built from. */
export type Composition = {
  base: string
  /** One mark per axis, or null where the axis is unmarked. */
  marks: (string | null)[]
}

/**
 * Turn a composition into its code.
 *
 * Throws on a base or mark the tier does not hold, because a silent
 * fallback would put a wrong sound at a real code.
 */
export function encodeUnit({
  composition,
  notation,
  tier,
}: {
  composition: Composition
  notation: Notation
  tier: Tier
}): number {
  if (tier === 'seed') {
    const at = modelFor(notation).units.indexOf(composition.base)

    if (at < 0) throw new Error(`unknown seed unit ${composition.base}`)

    return at
  }

  const layout = layoutFor(notation, tier)
  const at = layout.bases.findIndex(base => base.key === composition.base)

  if (at < 0) throw new Error(`unknown base ${composition.base}`)

  const base = layout.bases[at]!
  const row = layout.radices[at]!

  let local = 0

  for (let axisAt = 0; axisAt < layout.axes.length; axisAt++) {
    const axis = layout.axes[axisAt]!
    const chosen = composition.marks[axisAt] ?? null

    // Digit 0 is "unmarked"; the allowed marks follow in their stable
    // order, so a digit means the same thing for every base that offers it.
    let digit = 0

    if (chosen !== null) {
      let seen = 0

      for (const mark of axis.marks) {
        if (!mark.allows(base)) continue

        seen += 1

        if (mark.key === chosen) {
          digit = seen
          break
        }
      }

      if (digit === 0) {
        throw new Error(`${chosen} does not attach to ${composition.base}`)
      }
    }

    local = local * row[axisAt]! + digit
  }

  return layout.offsets[at]! + local
}

/** Turn a code back into its composition. */
export function decodeUnit({
  code,
  notation,
  tier,
}: {
  code: number
  notation: Notation
  tier: Tier
}): Composition {
  if (tier === 'seed') {
    const units = modelFor(notation).units
    const unit = units[code]

    if (unit === undefined) throw new Error(`code ${code} out of range`)

    return { base: unit, marks: [] }
  }

  const layout = layoutFor(notation, tier)

  if (code < 0 || code >= layout.size) {
    throw new Error(`code ${code} out of range`)
  }

  // The offsets ascend, so the base is the last block starting at or
  // before the code.
  let low = 0
  let high = layout.offsets.length - 1

  while (low < high) {
    const middle = Math.ceil((low + high) / 2)

    if (layout.offsets[middle]! <= code) low = middle
    else high = middle - 1
  }

  const base = layout.bases[low]!
  const row = layout.radices[low]!

  let local = code - layout.offsets[low]!
  const marks: (string | null)[] = new Array(layout.axes.length).fill(null)

  for (let axisAt = layout.axes.length - 1; axisAt >= 0; axisAt--) {
    const digit = local % row[axisAt]!
    local = Math.floor(local / row[axisAt]!)

    if (digit === 0) continue

    const allowed = layout.axes[axisAt]!.marks.filter(mark =>
      mark.allows(base),
    )

    marks[axisAt] = allowed[digit - 1]!.key
  }

  return { base: base.key, marks }
}

/** Pack codes to the tier's fixed byte width, big-endian. */
export function pack({
  codes,
  notation,
  tier,
}: {
  codes: number[]
  notation: Notation
  tier: Tier
}): Uint8Array {
  const width = byteWidth({ notation, tier })
  const out = new Uint8Array(codes.length * width)

  for (let at = 0; at < codes.length; at++) {
    const code = codes[at]!

    for (let byte = 0; byte < width; byte++) {
      out[at * width + byte] = (code >> ((width - 1 - byte) * 8)) & 0xff
    }
  }

  return out
}

/** Read codes back from a fixed-width buffer. */
export function unpack({
  bytes,
  notation,
  tier,
}: {
  bytes: Uint8Array
  notation: Notation
  tier: Tier
}): number[] {
  const width = byteWidth({ notation, tier })
  const out: number[] = []

  for (let at = 0; at + width <= bytes.length; at += width) {
    let code = 0

    for (let byte = 0; byte < width; byte++) {
      code = code * 256 + bytes[at + byte]!
    }

    out.push(code)
  }

  return out
}
