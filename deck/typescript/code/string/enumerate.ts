// Every valid canonical sound. Used by the machine build and available to
// consumers who want the full inventory.

import { phones } from './data'
import { R } from './runtime'
import { makeSound } from './sound'
import type { Modifier, Phone, SoundInfo } from './type'

function attaches(base: Phone, mod: Modifier): boolean {
  const a = mod.attaches

  if (!a) {
    return true
  }

  if (a.place && !a.place.includes(base.place ?? '')) {
    return false
  }

  if (a.notPlace?.includes(base.place ?? '')) {
    return false
  }

  if (a.manner && !a.manner.includes(base.manner ?? '')) {
    return false
  }

  if (a.voicing && !a.voicing.includes(base.voicing ?? '')) {
    return false
  }

  return true
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

// Every valid canonical sound, in a stable order. Deduped by talk.
export function enumerateSounds(): SoundInfo[] {
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

  for (const base of phones) {
    const pool =
      base.form === 'consonant'
        ? R.consonantModifiers
        : R.vowelModifiers
    const usable = pool.filter(m => attaches(base, m))

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
