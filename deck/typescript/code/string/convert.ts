// The public conversions.

import { combine } from './combine'
import { R, nfd } from './runtime'
import { segment } from './sound'
import type { Modifier, Phone, Sound, SymbolEntry } from './type'

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

/**
 * One unit of parsed IPA: a sound, a passthrough symbol, or unknown input.
 *
 * `phone` carries the Phone matched from the IPA trie DIRECTLY, not one
 * recovered from a talk spelling. That distinction matters: talk is a
 * deliberately coarse encoding and several IPA vowels share a code
 * (`ɨ`, `y` and `ʏ` are all `i$`; six vowels are `O`). Going IPA → talk →
 * Phone therefore loses the exact vowel, while this keeps it.
 */
export type IpaUnit =
  | { role: 'phone'; base: Phone; modifiers: Modifier[] }
  | { role: 'symbol'; symbol: SymbolEntry }
  | { role: 'unknown'; text: string }

/**
 * Parse IPA into base sounds and their modifiers.
 *
 * `kʰ` is one unit: base `k` with the `aspirated` modifier. `iː` is base
 * `i` with `long`. This is what a caller needs to match IPA against a
 * catalog that stores base sounds and modifier flags separately, rather
 * than one row per composed symbol.
 *
 * Unknown input is carried through as `unknown` rather than dropped, so
 * the caller can see what failed instead of silently losing it.
 */
export function parseIpa(text: string): IpaUnit[] {
  const input = nfd(text)
  const out: IpaUnit[] = []

  let base: Phone | null = null
  let mods: Modifier[] = []
  let pending: Modifier[] = [] // prefix modifiers waiting for a base

  const flush = () => {
    if (base) {
      out.push({ role: 'phone', base, modifiers: mods })
    }

    base = null
    mods = []
  }

  let i = 0

  while (i < input.length) {
    const unit = R.ipaUnit.matchAt(input, i)

    if (unit === undefined) {
      flush()
      out.push({ role: 'unknown', text: input[i++]! })
      continue
    }

    i += R.ipaUnit.matchedLength

    if (unit.role === 'phone') {
      // A base begins a new sound. A held stress mark belongs on the vowel
      // of the syllable, so it skips any onset consonants and lands on the
      // next vowel.
      flush()
      base = unit.phone

      if (base.form === 'vowel') {
        mods = pending
        pending = []
      } else {
        mods = []
      }
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
      out.push({ role: 'symbol', symbol: unit.symbol })
    }
  }

  flush()

  return out
}

/**
 * IPA to talk spelling.
 *
 * The same walk as `parseIpa`, rendered. Kept as one scanner so the two
 * cannot drift.
 */
export function ipaToTalk(text: string): string {
  return parseIpa(text)
    .map(unit => {
      if (unit.role === 'phone') {
        return combine(unit.base.talk, unit.modifiers)
      }
      if (unit.role === 'symbol') return unit.symbol.talk
      return unit.text
    })
    .join('')
}
