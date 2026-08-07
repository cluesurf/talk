// One shape for both notations, so the codec is written once.
//
// A sound is a BASE plus at most one mark per AXIS. That is all the codec
// needs to know, and both notations fit it: talk's slots and modifiers,
// and IPA's axes and diacritics.
//
// Which marks an axis offers depends on the base, because attachment
// rules stop a mark applying where the articulation cannot support it.
// So the radix is per base, not global, and the codec is mixed-radix over
// a ragged table rather than a flat product.

import { IPA_AXES, SUPRASEGMENTAL, attaches } from './axis'
import { modifiers, phones } from '../string/data'
import { R, modifierAttaches, nfd } from '../string/runtime'
import type { Form } from '../string/type'

export type Notation = 'ipa' | 'tone'

/**
 * How much of a sound one code holds.
 *
 *   seed  one atomic unit: a base, or a single mark
 *   band  a base with its segmental marks, no suprasegmentals
 *   mesh  a base with everything
 */
export type Tier = 'seed' | 'band' | 'mesh'

/** A base sound, spelled in whichever type is in play. */
export type ModelBase = {
  key: string
  form: Form
  place?: string
  manner?: string
  voicing?: string
}

/** One articulatory dimension, and the marks that vary along it. */
export type ModelAxis = {
  name: string
  suprasegmental: boolean
  /** Marks in a stable order, each with the spelling it contributes. */
  marks: { key: string; allows: (base: ModelBase) => boolean }[]
}

export type Model = {
  bases: ModelBase[]
  axes: ModelAxis[]
  /** Every atomic unit: the bases and the marks, for the `seed` tier. */
  units: string[]
}

/** talk's slots that describe the syllable rather than the segment. */
const TONE_SUPRA = new Set(['duration', 'stress', 'tone', 'syllabicity'])

function toneModel(): Model {
  const bases: ModelBase[] = R.starterPhones
    .map(phone => ({
      key: phone.talk,
      form: phone.form,
      place: phone.place,
      manner: phone.manner,
      voicing: phone.voicing,
    }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))

  const bySlot = new Map<string, typeof modifiers>()
  for (const mod of modifiers) {
    bySlot.set(mod.slot, [...(bySlot.get(mod.slot) ?? []), mod])
  }

  const axes: ModelAxis[] = [...bySlot]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([name, mods]) => ({
      name,
      suprasegmental: TONE_SUPRA.has(name),
      marks: mods
        .slice()
        .sort((a, b) => (a.talk < b.talk ? -1 : a.talk > b.talk ? 1 : 0))
        .map(mod => ({
          key: mod.talk,
          allows: (base: ModelBase) =>
            // The modifier's own form gate, then its attachment rule.
            (mod.base === 'any' || mod.base === base.form) &&
            modifierAttaches(
              {
                ipa: '',
                talk: base.key,
                xsampa: '',
                simple: '',
                form: base.form,
                place: base.place,
                manner: base.manner,
                voicing: base.voicing,
              },
              mod,
            ),
        })),
    }))

  return {
    bases,
    axes,
    units: [
      ...bases.map(base => base.key),
      ...[...new Set(modifiers.map(mod => mod.talk))].sort(),
    ],
  }
}

function ipaModel(): Model {
  const bases: ModelBase[] = phones
    .map(phone => ({
      key: nfd(phone.ipa),
      form: phone.form,
      place: phone.place,
      manner: phone.manner,
      voicing: phone.voicing,
    }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))

  const axes: ModelAxis[] = Object.entries(IPA_AXES)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([name, groups]) => ({
      name,
      suprasegmental: SUPRASEGMENTAL.has(name),
      marks: groups
        .flatMap(group =>
          group.marks.map(mark => ({ mark, rule: group.rule })),
        )
        .sort((a, b) => (a.mark < b.mark ? -1 : a.mark > b.mark ? 1 : 0))
        .map(({ mark, rule }) => ({
          key: nfd(mark),
          allows: (base: ModelBase) => attaches(base, rule),
        })),
    }))

  const marks = new Set<string>()
  for (const axis of axes) {
    for (const mark of axis.marks) marks.add(mark.key)
  }

  // Atomic units are single codepoints, so a multi-character base
  // contributes its parts rather than itself.
  const atoms = new Set<string>()
  for (const base of bases) {
    for (const character of base.key) atoms.add(character)
  }
  for (const mark of marks) {
    for (const character of mark) atoms.add(character)
  }

  return { bases, axes, units: [...atoms].sort() }
}

let toneCache: Model | null = null
let ipaCache: Model | null = null

/** The model for a type, built once. */
export function modelFor(type: Notation): Model {
  if (type === 'tone') {
    toneCache = toneCache ?? toneModel()
    return toneCache
  }

  ipaCache = ipaCache ?? ipaModel()
  return ipaCache
}

/** The axes a system includes. `seed` has none: it holds atoms. */
export function axesFor(type: Notation, system: Tier): ModelAxis[] {
  if (system === 'seed') return []

  const { axes } = modelFor(type)

  return system === 'mesh' ? axes : axes.filter(axis => !axis.suprasegmental)
}
