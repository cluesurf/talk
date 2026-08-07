// How big the sound space is, under every reading of the question.
//
// Three counts matter and they differ by orders of magnitude, so a design
// that says "the inventory" without saying which one is under-specified:
//
//   ATTESTED    what some documented language is recorded saying
//   PRODUCIBLE  what a human vocal tract can make
//   PERMITTED   what the notation can write, articulation ignored
//
// A conlang tool needs PRODUCIBLE, because a designed language draws from
// sounds nobody happens to use. A corpus index needs ATTESTED. A validator
// needs PERMITTED.
//
// Crossed with three TIERS of granularity and two NOTATIONS, that is
// eighteen numbers, and this computes all of them.

import { IPA_AXES, SUPRASEGMENTAL, attaches } from './axis'
import { ipaToTalk } from '../string/convert'
import { modifiers, phones } from '../string/data'
import { R, nfd } from '../string/runtime'
import { makeSound } from '../string/sound'
import { segment } from '../string/sound'
import type { Modifier, Phone } from '../string/type'

/** Which notation the units are spelled in. */
export type Notation = 'ipa' | 'tone'

/**
 * How much of a sound one unit holds.
 *
 *   seed  one atomic unit: a base, or a single affix
 *   band  a base with its segmental affixes, no suprasegmentals
 *   mesh  a base with everything, suprasegmentals included
 */
export type Tier = 'seed' | 'band' | 'mesh'

/** Which question is being asked about the space. */
export type Space = 'attested' | 'producible' | 'permitted'

/** talk's slots that describe the syllable rather than the segment. */
const TONE_SUPRA = new Set(['duration', 'stress', 'tone', 'syllabicity'])

/**
 * IPA marks that are suprasegmental, so `band` can strip them from a
 * source string.
 */
const IPA_SUPRA_MARKS = new Set(
  Object.entries(IPA_AXES)
    .filter(([axis]) => SUPRASEGMENTAL.has(axis))
    .flatMap(([, groups]) => groups.flatMap(group => group.marks)),
)

// ── producible ──────────────────────────────────────────────────────────

/**
 * Choose none or one modifier from each slot, in every combination. The
 * same construction `enumerateSounds` uses, exposed so a tier can restrict
 * the pool first.
 */
function slotCombos(mods: Modifier[]): Modifier[][] {
  const bySlot = new Map<string, Modifier[]>()

  for (const mod of mods) {
    bySlot.set(mod.slot, [...(bySlot.get(mod.slot) ?? []), mod])
  }

  let combos: Modifier[][] = [[]]

  for (const options of bySlot.values()) {
    const next: Modifier[][] = []

    for (const combo of combos) {
      next.push(combo)
      for (const option of options) next.push([...combo, option])
    }

    combos = next
  }

  return combos
}

/** Whether a talk modifier attaches to a base, per `modifiers.json`. */
function toneAttaches(base: Phone, mod: Modifier): boolean {
  const rule = mod.attaches
  if (!rule) return true
  if (rule.place && !rule.place.includes(base.place ?? '')) return false
  if (rule.notPlace?.includes(base.place ?? '')) return false
  if (rule.manner && !rule.manner.includes(base.manner ?? '')) return false
  if (rule.voicing && !rule.voicing.includes(base.voicing ?? '')) return false
  return true
}

function toneProducible(tier: Tier): number {
  if (tier === 'seed') {
    return R.starterPhones.length + modifiers.length
  }

  const seen = new Set<string>()

  for (const base of R.starterPhones) {
    const pool = (
      base.form === 'consonant' ? R.consonantModifiers : R.vowelModifiers
    ).filter(
      mod =>
        toneAttaches(base, mod) &&
        (tier === 'mesh' || !TONE_SUPRA.has(mod.slot)),
    )

    for (const combo of slotCombos(pool)) {
      seen.add(makeSound(base, combo).talk)
    }
  }

  return seen.size
}

function ipaProducible(tier: Tier): number {
  if (tier === 'seed') {
    const seen = new Set<string>()

    for (const phone of phones) {
      for (const character of nfd(phone.ipa)) seen.add(character)
    }

    for (const groups of Object.values(IPA_AXES)) {
      for (const group of groups) {
        for (const mark of group.marks) {
          for (const character of nfd(mark)) seen.add(character)
        }
      }
    }

    return seen.size
  }

  // The chart is the producible base inventory: the IPA assigns a symbol
  // only to an articulation a human can make, and the impossible cells are
  // shaded with no symbol at all.
  let total = 0

  for (const base of phones) {
    let ways = 1

    for (const [axis, groups] of Object.entries(IPA_AXES)) {
      if (tier === 'band' && SUPRASEGMENTAL.has(axis)) continue

      let options = 0
      for (const group of groups) {
        if (attaches(base, group.rule)) options += group.marks.length
      }

      // Plus the option of leaving this axis unmarked.
      ways *= options + 1
    }

    total += ways
  }

  return total
}

// ── permitted ───────────────────────────────────────────────────────────

function tonePermitted(tier: Tier): number {
  if (tier === 'seed') {
    return R.starterPhones.length + modifiers.length
  }

  const bySlot = new Map<string, number>()

  for (const mod of [...R.consonantModifiers, ...R.vowelModifiers]) {
    if (tier === 'band' && TONE_SUPRA.has(mod.slot)) continue
    bySlot.set(mod.slot, (bySlot.get(mod.slot) ?? 0) + 1)
  }

  let factor = 1
  for (const options of bySlot.values()) factor *= options + 1

  return R.starterPhones.length * factor
}

function ipaPermitted(tier: Tier): number {
  if (tier === 'seed') return ipaProducible('seed')

  let factor = 1

  for (const [axis, groups] of Object.entries(IPA_AXES)) {
    if (tier === 'band' && SUPRASEGMENTAL.has(axis)) continue

    const marks = groups.reduce((sum, group) => sum + group.marks.length, 0)
    factor *= marks + 1
  }

  return phones.length * factor
}

// ── attested ────────────────────────────────────────────────────────────

/**
 * Reduce one source phoneme to the unit a tier would hold.
 *
 * Returns null when the notation cannot read it, so a caller counting
 * attested units does not credit input that never resolved.
 */
export function unitFor({
  phoneme,
  notation,
  tier,
}: {
  phoneme: string
  notation: Notation
  tier: Tier
}): string[] | null {
  if (notation === 'ipa') {
    const decomposed = [...nfd(phoneme)]

    if (tier === 'seed') return decomposed
    if (tier === 'mesh') return [nfd(phoneme)]

    const stripped = decomposed
      .filter(character => !IPA_SUPRA_MARKS.has(character))
      .join('')

    return stripped ? [stripped] : null
  }

  const talk = ipaToTalk(phoneme)
  if (!talk) return null

  const sounds = segment(talk)

  if (tier === 'seed') {
    return sounds.flatMap(sound =>
      sound.base
        ? [sound.base.talk, ...sound.modifiers.map(mod => mod.talk)]
        : [sound.talk],
    )
  }

  const parts = sounds.map(sound => {
    if (!sound.base) return sound.talk

    const mods = sound.modifiers.filter(
      mod => tier === 'mesh' || !TONE_SUPRA.has(mod.slot),
    )

    return sound.base.talk + mods.map(mod => mod.talk).join('')
  })

  return [parts.join('')]
}

/**
 * How many distinct units a corpus attests at a tier.
 *
 * The corpus is passed in rather than read, because the phoneme lists this
 * is measured against (Phoible and the like) are far too large to ship and
 * change independently of the library.
 */
export function countAttested({
  phonemes,
  notation,
  tier,
}: {
  phonemes: Iterable<string>
  notation: Notation
  tier: Tier
}): number {
  const seen = new Set<string>()

  for (const phoneme of phonemes) {
    const units = unitFor({ phoneme, notation, tier })
    if (!units) continue
    for (const unit of units) seen.add(unit)
  }

  return seen.size
}

// ── the public surface ──────────────────────────────────────────────────

/**
 * How many units exist at a tier, under one reading of "exist".
 *
 * `attested` needs a corpus and is not answerable here; use
 * `countAttested` for it.
 */
export function countSpace({
  notation,
  tier,
  space,
}: {
  notation: Notation
  tier: Tier
  space: Exclude<Space, 'attested'>
}): number {
  if (space === 'producible') {
    return notation === 'ipa' ? ipaProducible(tier) : toneProducible(tier)
  }

  return notation === 'ipa' ? ipaPermitted(tier) : tonePermitted(tier)
}

export type SpaceReport = {
  notation: Notation
  tier: Tier
  attested: number | null
  producible: number
  permitted: number
}

/**
 * Every count, for every notation and tier.
 *
 * Pass a corpus to fill the attested column; without one it is null, since
 * nothing in the library knows what languages say.
 */
export function reportSpace(phonemes?: Iterable<string>): SpaceReport[] {
  const corpus = phonemes ? [...phonemes] : null
  const out: SpaceReport[] = []

  for (const notation of ['ipa', 'tone'] as Notation[]) {
    for (const tier of ['seed', 'band', 'mesh'] as Tier[]) {
      out.push({
        notation,
        tier,
        attested: corpus
          ? countAttested({ phonemes: corpus, notation, tier })
          : null,
        producible: countSpace({ notation, tier, space: 'producible' }),
        permitted: countSpace({ notation, tier, space: 'permitted' }),
      })
    }
  }

  return out
}

/** The character capacity each tier is encoded into. */
export const CAPACITY: Record<Tier, number> = {
  // Hangul syllables with no final consonant, 19 x 21.
  seed: 399,
  // Hangul syllables with a vertical medial and a final, 8 x 19 x 27.
  band: 4104,
  // Hangul syllables with a compound medial and a final, 8 x 19 x 27.
  mesh: 4104,
}

/** Bytes a count needs, for the tiers that outgrow a character space. */
export function bytesFor(count: number): number {
  return Math.max(1, Math.ceil(Math.log2(count) / 8))
}
