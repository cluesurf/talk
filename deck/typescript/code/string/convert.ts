// The public conversions.

import { combine } from './combine'
import { normalizeIpa } from './normalize'
import type { NormalizeIpaOptions } from './normalize'
import { R, modifierAttaches } from './runtime'
import { segment } from './sound'
import type { Trie } from '../trie'
import { CODE_LIMIT } from './type'
import type { Modifier, Phone, Sound, SymbolEntry, Unit } from './type'

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

/**
 * The block machine text encodes into: 4,096 contiguous CJK ideographs
 * starting at U+4E00. Chosen because it is printable, has no control
 * characters, no combining marks, and no case folding, so a database can
 * hold it in an ordinary text column and index it with trigrams.
 */
const TEXT_BASE = 0x4e00

/** Half of 24 bits, so each code becomes exactly two characters. */
const TEXT_SHIFT = 12
const TEXT_MASK = 0xfff

/**
 * Decode a three-byte-per-code buffer back into machine codes.
 */
export function machineCodes(bytes: Uint8Array): number[] {
  const out: number[] = []

  for (let i = 0; i + 2 < bytes.length; i += 3) {
    out.push((bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!)
  }

  return out
}

/**
 * One unit of parsed input: a sound, a passthrough symbol, or unknown
 * text.
 *
 * `base` carries the Phone matched from the source trie DIRECTLY, not one
 * recovered from a talk spelling. That distinction matters: talk is a
 * deliberately coarse encoding and several IPA vowels share a code
 * (`ɨ`, `y` and `ʏ` are all `i$`; six vowels are `O`). Going IPA → talk →
 * Phone therefore loses the exact vowel, while this keeps it.
 */
export type ParsedUnit =
  | { role: 'phone'; base: Phone; modifiers: Modifier[]; pre: Modifier[] }
  | { role: 'symbol'; symbol: SymbolEntry }
  | { role: 'unknown'; text: string }
  /**
   * Letters a tie joined into one segment. `parts` keeps each on its own,
   * because the binding is a claim ABOUT them rather than a new sound.
   */
  | { role: 'bound'; parts: ParsedUnit[] }

/**
 * The name `parseIpa` has always returned. Kept because callers import it.
 */
export type IpaUnit = ParsedUnit

/**
 * Walk `input` against a unit trie, collecting bases with the modifiers
 * that attach to them.
 *
 * Shared by every notation that spells affixes distinctly from bases (IPA
 * and X-SAMPA both do), so the two scanners cannot drift apart. Talk
 * itself needs its own scanner instead, because there a modifier like
 * `h~` shares its spelling with a base and position decides which is
 * meant.
 */
function scanUnits(input: string, trie: Trie<Unit>): ParsedUnit[] {
  const out: ParsedUnit[] = []

  let base: Phone | null = null
  let mods: Modifier[] = []
  let pre: Modifier[] = []
  let pending: Modifier[] = [] // prefix modifiers waiting for a base
  let leading: Modifier[] = [] // pre-modifiers waiting for a base

  const flush = () => {
    if (base) {
      out.push({ role: 'phone', base, modifiers: mods, pre })
    }

    base = null
    mods = []
    pre = []
  }

  let i = 0

  while (i < input.length) {
    const unit = trie.matchAt(input, i)

    if (unit === undefined) {
      flush()
      out.push({ role: 'unknown', text: input[i++] })
      continue
    }

    i += trie.matchedLength

    if (unit.role === 'phone') {
      // A base begins a new sound. A held stress mark belongs on the vowel
      // of the syllable, so it skips any onset consonants and lands on the
      // next vowel.
      flush()
      base = unit.phone

      pre = leading
      leading = []

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
      } else if (
        base &&
        (modifierAttaches(base, unit.modifier) ||
          // Attachment breaks a tie rather than rejecting: without a base
          // ahead that can carry the mark, it stays here. Otherwise a
          // phone with incomplete features would lose marks it really has.
          trie.matchAt(input, i)?.role !== 'phone')
      ) {
        mods.push(unit.modifier)
      } else {
        // Either nothing precedes it, or what precedes it cannot carry it.
        // Both mean the mark belongs to what FOLLOWS: `ʰk` is
        // pre-aspirated, `ⁿd` prenasalized, and `aʰk` is `a` then `ʰk`
        // because a vowel takes no aspiration.
        leading.push(unit.modifier)
      }
    } else {
      flush()
      out.push({ role: 'symbol', symbol: unit.symbol })
    }
  }

  flush()

  return bindTies(out)
}

/** The tie, which joins the letters on either side into one segment. */

const TIE = '\u{0361}'

/**
 * Fold each tie into a binder on the units it joins.
 *
 * THE TIE IS NOT A CHARACTER TO CARRY. It says the letters either side of
 * it are ONE segment, which is a claim about them rather than a thing
 * standing between them, and carrying it through as a symbol left talk
 * unable to say how far the binding reached.
 *
 * Read here, after the walk, because a tie is only meaningful once both
 * sides exist. A run of them binds one group: `t͡s͡ʃ` is three letters tied
 * twice, so it is one segment of three rather than two of two.
 *
 * A TIE WITH NOTHING TO JOIN IS KEPT AS IT WAS. A leading or trailing one
 * is a source that wrote it loosely, and dropping it would be inventing a
 * segment boundary the source did not give.
 */

function bindTies(units: ParsedUnit[]): ParsedUnit[] {
  if (!units.some(one => one.role === 'unknown' && one.text === TIE)) {
    return units
  }

  const out: ParsedUnit[] = []

  for (let at = 0; at < units.length; at += 1) {
    const one = units[at]!

    if (one.role !== 'unknown' || one.text !== TIE) {
      out.push(one)
      continue
    }

    const before = out[out.length - 1]
    const after = units[at + 1]

    if (!before || !after || after.role === 'unknown') {
      out.push(one)
      continue
    }

    // Grow the group while ties keep coming, so `t͡s͡ʃ` binds all three.
    const parts: ParsedUnit[] = [out.pop()!, after]
    let next = at + 2

    while (
      units[next]?.role === 'unknown' &&
      (units[next] as { text: string }).text === TIE &&
      units[next + 1] &&
      units[next + 1]!.role !== 'unknown'
    ) {
      parts.push(units[next + 1]!)
      next += 2
    }

    out.push({ role: 'bound', parts })
    at = next - 1
  }

  return out
}

/**
 * Render parsed units as talk.
 */
export function unitsToTalk(units: ParsedUnit[]): string {
  return units
    .map(unit => {
      if (unit.role === 'phone') {
        return combine(unit.base.talk, unit.modifiers, unit.pre)
      }

      if (unit.role === 'symbol') {
        return unit.symbol.talk
      }

      if (unit.role === 'bound') {
        // The binder counts, so a reader knows how far it reaches without
        // inferring it from where a character sits.
        const reach = unit.parts.length

        return `${unitsToTalk(unit.parts)}<B${reach > 2 ? reach : ''}>`
      }

      return unit.text
    })
    .join('')
}

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
 *
 * `options` is passed to `normalizeIpa`.
 */
export function parseIpa(
  text: string,
  options: NormalizeIpaOptions = {},
): ParsedUnit[] {
  return scanUnits(normalizeIpa(text, options), R.ipaUnit)
}

/**
 * IPA to talk spelling.
 *
 * The same walk as `parseIpa`, rendered. Kept as one scanner so the two
 * cannot drift.
 */
export function ipaToTalk(text: string): string {
  return unitsToTalk(parseIpa(text))
}

/**
 * Parse X-SAMPA into base sounds and their modifiers.
 *
 * X-SAMPA is the ASCII transliteration of IPA, so this is the same walk
 * as `parseIpa` over the X-SAMPA spellings carried on every phone and
 * modifier. `k_h` is base `k` with `aspirated`, `i:` is base `i` with
 * `long`.
 *
 * X-SAMPA claims the digits for vowels (`1` is ɨ, `9` is œ) and `?` for
 * the glottal stop, so those are read as sounds here, never as the
 * passthrough symbols the IPA scanner sees.
 */
export function parseXsampa(text: string): ParsedUnit[] {
  return scanUnits(text, R.xsampaUnit)
}

/**
 * X-SAMPA to talk spelling.
 */
export function xsampaToTalk(text: string): string {
  return unitsToTalk(parseXsampa(text))
}

/**
 * Spell one base plus its modifiers in a linear notation, prefixes first
 * and suffixes after, both in the modifiers' declared order.
 *
 * This is the same construction `makeSound` uses for a sound's `ipa` and
 * `simple` spellings, so a sound spells the same whether it was built
 * from a base or recovered by a scanner.
 */
function spell(
  base: Phone,
  mods: Modifier[],
  key: 'ipa' | 'xsampa',
  pre: Modifier[] = [],
): string {
  const ordered = [...mods].sort((a, b) => a.order - b.order)
  const leading = [...pre].sort((a, b) => b.order - a.order)

  return (
    leading.map(m => m[key]).join('') +
    ordered
      .filter(m => m.prefix)
      .map(m => m[key])
      .join('') +
    base[key] +
    ordered
      .filter(m => !m.prefix)
      .map(m => m[key])
      .join('')
  )
}

/**
 * Render parsed units in a linear notation. Passthrough symbols carry
 * their literal text, which is the same in both notations.
 */
function renderUnits(
  units: ParsedUnit[],
  key: 'ipa' | 'xsampa',
): string {
  return units
    .map(unit => {
      if (unit.role === 'phone') {
        return spell(unit.base, unit.modifiers, key, unit.pre)
      }

      if (unit.role === 'symbol') {
        return unit.symbol.ipa
      }

      if (unit.role === 'bound') {
        // Written back the way a tie is written: between each pair of
        // letters, with anything the parts carry left where it sits.
        return unit.parts.map(one => unitsToIpa([one], key)).join('\u{0361}')
      }

      return unit.text
    })
    .join('')
}

/**
 * X-SAMPA to IPA.
 */
export function xsampaToIpa(text: string): string {
  return renderUnits(parseXsampa(text), 'ipa')
}

/**
 * IPA to X-SAMPA.
 */
export function ipaToXsampa(text: string): string {
  return renderUnits(parseIpa(text), 'xsampa')
}

/**
 * Talk to X-SAMPA.
 *
 * Built from the same segmentation as `talkToIpa`, rendering each sound's
 * X-SAMPA spelling instead of its IPA one. Passthrough symbols carry
 * their literal text.
 */
export function talkToXsampa(text: string): string {
  return segment(text)
    .map(sound =>
      sound.base
        ? spell(sound.base, sound.modifiers, 'xsampa', sound.pre)
        : sound.ipa,
    )
    .join('')
}
