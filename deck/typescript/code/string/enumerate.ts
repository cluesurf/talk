// Every valid canonical sound. Used by the machine build and available to
// consumers who want the full inventory.

import { R, modifierAttaches } from './runtime'
import { makeSound } from './sound'
import type { Modifier, Phone, SoundInfo } from './type'

/**
 * The base phone inventory, one entry per talk spelling.
 *
 * Each phone carries its articulatory features (place / manner / voicing
 * for consonants, height / backness / roundedness for vowels), which is
 * what a caller needs to score two sounds by how much they share rather
 * than by string equality.
 *
 * Bases only. The modifiers that attach to them are a separate axis, and
 * `enumerateSounds` is the full cross of the two.
 */
export function enumeratePhones(): Phone[] {
  return R.basePhones
}

// Choose none or one modifier from each slot, in every combination.
function slotCombos(mods: Modifier[]): Modifier[][] {
  const bySlot = new Map<string, Modifier[]>()

  for (const mod of mods) {
    const list = bySlot.get(mod.slot) ?? []

    list.push(mod)
    bySlot.set(mod.slot, list)
  }

  let combos: Modifier[][] = [[]]

  for (const options of bySlot.values()) {
    const next: Modifier[][] = []

    for (const combo of combos) {
      next.push(combo)

      for (const option of options) {
        next.push([...combo, option])
      }
    }

    combos = next
  }

  return combos
}

/**
 * Cached, because the result is derived entirely from static data and the
 * inventory is now large enough that rebuilding it per call is the
 * dominant cost for anything that walks it more than once.
 */
let cached: SoundInfo[] | null = null

// Every valid canonical sound, in a stable order. Deduped by talk.
export function enumerateSounds(): SoundInfo[] {
  if (cached) return cached

  cached = buildSounds()

  return cached
}

function buildSounds(): SoundInfo[] {
  const seen = new Set<string>()
  const out: SoundInfo[] = []

  const add = (base: Phone, mods: Modifier[]) => {
    const sound = makeSound(base, mods)

    if (seen.has(sound.talk)) {
      return
    }

    seen.add(sound.talk)
    out.push({
      talk: sound.talk,
      ipa: sound.ipa,
      simple: sound.simple,
      kind: sound.kind,
    })
  }

  for (const base of R.starterPhones) {
    const pool =
      base.form === 'consonant'
        ? R.consonantModifiers
        : R.vowelModifiers
    const usable = pool.filter(m => modifierAttaches(base, m))

    for (const combo of slotCombos(usable)) {
      add(base, combo)
    }
  }

  for (const symbol of R.symbols) {
    if (seen.has(symbol.talk)) {
      continue
    }

    seen.add(symbol.talk)
    out.push({
      talk: symbol.talk,
      ipa: symbol.ipa,
      simple: symbol.simple,
      kind: 'symbol',
    })
  }

  return out
}
