// Dense integer codes for every system of both notations.
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
import { readSounds } from '../string/read'
import { nfd } from '../string/runtime'

/**
 * The block `encodeText` draws from: 64 contiguous CJK ideographs. Chosen
 * because it is printable, has no control characters, no combining marks
 * and no case folding, so a database can hold it in an ordinary text
 * column and index it with trigrams.
 */
const TEXT_BASE = 0x4e00
import { NO_CODE } from '../string/type'
import type { Sound } from '../string/type'
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

/** The offset table for a system, built once. */
function layoutFor(type: Notation, system: Tier): Layout {
  const cacheKey = `${type}:${system}`
  const cached = layouts.get(cacheKey)

  if (cached) return cached

  const { bases } = modelFor(type)
  const axes = axesFor(type, system)

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

/** How many codes a system has, which is the producible count. */
export function sizeOf({
  type,
  system,
}: {
  type: Notation
  system: Tier
}): number {
  if (system === 'seed') return modelFor(type).units.length

  return layoutFor(type, system).size
}

/**
 * Bytes one code needs, so a caller can pack to a fixed width.
 *
 * Sized to the system rather than to a single global width, since `tone
 * seed` fits in one byte and `ipa mesh` needs four.
 */
export function byteWidth({
  type,
  system,
}: {
  type: Notation
  system: Tier
}): 1 | 2 | 3 | 4 {
  const bits = Math.ceil(Math.log2(Math.max(2, sizeOf({ type, system }))))
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
 * Throws on a base or mark the system does not hold, because a silent
 * fallback would put a wrong sound at a real code.
 */
export function encodeUnit({
  composition,
  type,
  system,
}: {
  composition: Composition
  type: Notation
  system: Tier
}): number {
  if (system === 'seed') {
    const at = modelFor(type).units.indexOf(composition.base)

    if (at < 0) throw new Error(`unknown seed unit ${composition.base}`)

    return at
  }

  const layout = layoutFor(type, system)
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
  type,
  system,
}: {
  code: number
  type: Notation
  system: Tier
}): Composition {
  if (system === 'seed') {
    const units = modelFor(type).units
    const unit = units[code]

    if (unit === undefined) throw new Error(`code ${code} out of range`)

    return { base: unit, marks: [] }
  }

  const layout = layoutFor(type, system)

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

/**
 * The composition of a parsed sound, ready to encode.
 *
 * A `Sound` already carries its base and modifiers; this only has to put
 * one mark per axis in the order the codec expects, leaving unmarked axes
 * null.
 */
export function compositionOf({
  sound,
  type,
  system,
}: {
  sound: Pick<Sound, 'base' | 'modifiers'>
  type: Notation
  system: Tier
}): Composition | null {
  if (!sound.base) return null

  const axes = axesFor(type, system)

  // The model keys IPA bases by their IPA spelling and tone bases by their
  // talk spelling, so the composition has to match the type it is
  // being encoded in.
  const keyOf = (value: { ipa: string; talk: string }) =>
    type === 'ipa' ? nfd(value.ipa) : value.talk

  return {
    base: keyOf(sound.base),
    marks: axes.map(axis => {
      const found = sound.modifiers.find(
        modifier => modifier.slot === axis.name,
      )

      return found ? keyOf(found) : null
    }),
  }
}

/**
 * The machine code for a parsed sound, computed rather than looked up.
 *
 * This is what removed the registry: `tokens.json` held 91,332 assigned
 * codes and inlined 4.5MB into every bundle, for an answer the model can
 * derive. A sound outside the space yields `NO_CODE`.
 */
export function codeOf({
  sound,
  type,
  system,
}: {
  sound: Pick<Sound, 'base' | 'modifiers'>
  type: Notation
  system: Tier
}): number {
  const composition = compositionOf({ sound, type, system })

  if (!composition) return NO_CODE

  try {
    return encodeUnit({ composition, type, system })
  } catch {
    return NO_CODE
  }
}

/**
 * Encode a whole string at a type and tier.
 *
 * The input is read as the type says: an IPA string for `ipa`, a tone
 * string for `tone`. At `seed` a sound yields SEVERAL codes, one per
 * atomic unit, because that system holds parts rather than wholes.
 *
 * A unit the system cannot hold yields `NO_CODE`, so the array always lines
 * up with the input and a caller can see what failed.
 */
export function machine({
  text,
  type,
  system,
}: {
  text: string
  type: Notation
  system: Tier
}): number[] {
  const out: number[] = []

  const push = (unit: string) => {
    try {
      out.push(
        encodeUnit({ composition: { base: unit, marks: [] }, type, system }),
      )
    } catch {
      out.push(NO_CODE)
    }
  }

  for (const sound of readSounds({ text, type })) {
    if (!sound.base) {
      out.push(NO_CODE)
      continue
    }

    if (system === 'seed') {
      // The base and each mark are separate units here. IPA seed units are
      // single codepoints, so a multi-character base contributes its parts.
      if (type === 'ipa') {
        for (const character of nfd(sound.base.ipa)) push(character)

        for (const modifier of sound.modifiers) {
          for (const character of nfd(modifier.ipa)) push(character)
        }
      } else {
        push(sound.base.talk)

        for (const modifier of sound.modifiers) push(modifier.talk)
      }

      continue
    }

    out.push(codeOf({ sound, type, system }))
  }

  return out
}

/**
 * Encode as text: a fixed number of characters per code.
 *
 * The array form is what a model consumes; this is what a text index
 * consumes. A fixed width means a match on a character boundary is always
 * a match on a unit boundary.
 */
export function machineText({
  text,
  type,
  system,
}: {
  text: string
  type: Notation
  system: Tier
}): string {
  const width = byteWidth({ type, system })
  const out: string[] = []

  for (const raw of machine({ text, type, system })) {
    const code = raw < 0 ? sizeOf({ type, system }) : raw

    // Twelve bits per character, so the block below stays inside one
    // contiguous run of printable CJK.
    for (let at = width - 1; at >= 0; at--) {
      out.push(String.fromCodePoint(TEXT_BASE + ((code >> (at * 6)) & 0x3f)))
    }
  }

  return out.join('')
}

/** Encode as bytes, the tier's fixed width per code, big-endian. */
export function machineBytes({
  text,
  type,
  system,
}: {
  text: string
  type: Notation
  system: Tier
}): Uint8Array {
  return pack({ codes: machine({ text, type, system }), type, system })
}

/** Pack codes to the tier's fixed byte width, big-endian. */
export function pack({
  codes,
  type,
  system,
}: {
  codes: number[]
  type: Notation
  system: Tier
}): Uint8Array {
  const width = byteWidth({ type, system })
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
  type,
  system,
}: {
  bytes: Uint8Array
  type: Notation
  system: Tier
}): number[] {
  const width = byteWidth({ type, system })
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
