// The public conversions.

import { combine } from './combine'
import { R, nfd } from './runtime'
import { segment } from './sound'
import type { Modifier, Phone, Sound } from './type'

export function tokenize(text: string): Sound[] {
  return segment(text)
}

export function talkToIpa(text: string): string {
  return segment(text)
    .map(s => s.ipa)
    .join('')
}

export function readable(text: string): string {
  return segment(text)
    .map(s => s.simple)
    .join('')
}

export function machine(text: string): string {
  return segment(text)
    .map(s => s.machine)
    .join('')
}

export function machineOutputs(text: string): string[] {
  return segment(text).map(s => s.machine)
}

export function ipaToTalk(text: string): string {
  const input = nfd(text)
  const out: string[] = []

  let base: Phone | null = null
  let mods: Modifier[] = []
  let pending: Modifier[] = [] // prefix modifiers waiting for a base

  const flush = () => {
    if (base) {
      out.push(combine(base.talk, mods))
    }

    base = null
    mods = []
  }

  let i = 0

  while (i < input.length) {
    const unit = R.ipaUnit.matchAt(input, i)

    if (unit === undefined) {
      // Unknown IPA: carry it through.
      flush()
      out.push(input[i++])
      continue
    }

    i += R.ipaUnit.matchedLength

    if (unit.role === 'phone') {
      // A base begins a new sound.
      flush()
      base = unit.phone
      mods = pending
      pending = []
    } else if (unit.role === 'modifier') {
      if (unit.modifier.prefix) {
        // Attaches to the following base (stress precedes the vowel).
        flush()
        pending.push(unit.modifier)
      } else if (base) {
        mods.push(unit.modifier)
      }
    } else {
      flush()
      out.push(unit.symbol.talk)
    }
  }

  flush()

  return out.join('')
}
