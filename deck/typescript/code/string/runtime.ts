// The runtime state: every lookup the conversions need, built once.

import { tokenEntries, modifiers, phones } from './data'
import { buildSymbols } from './symbol'
import { Trie, TrieBuilder, buildTrie } from '../trie'
import type { Modifier, Phone, SymbolEntry, Unit } from './type'

export type Runtime = {
  symbols: SymbolEntry[]
  // One phone per talk spelling: the base inventory a talk string can
  // decompose into, with the articulatory features each base carries.
  basePhones: Phone[]
  /**
   * The phones that BEGIN a sound: `basePhones` minus the ones already
   * reachable as another phone plus modifiers. This is the set the talk
   * scanner and the enumeration both work from, so a sound has exactly
   * one spelling and that spelling re-parses to itself.
   */
  starterPhones: Phone[]
  consonantModifiers: Modifier[]
  vowelModifiers: Modifier[]
  // Sound starters (a base or a symbol), keyed by talk.
  talkStarter: Trie<Unit>
  // Affixes, keyed by talk. Matched only after a base, because a modifier
  // like `h~` shares its spelling with the base `h~` (ɦ), so which one is
  // meant depends on position.
  //
  // The value is every modifier sharing that spelling, because one talk
  // affix can mean different things on a consonant and on a vowel. `@` is
  // syllabicity flipped away from the default: a vowel is syllabic
  // unless marked, a consonant is not, so `@` reads as non-syllabic on
  // `i@` and syllabic on `n@`. The base's form picks between them.
  talkModifier: Trie<Modifier[]>
  // Every unit keyed by IPA. IPA has no base/affix spelling clash, so one
  // trie scans the whole string.
  ipaUnit: Trie<Unit>
  // Every unit keyed by X-SAMPA. Like IPA, X-SAMPA spells affixes
  // distinctly from bases (`_h`, `_>`, `:`), so one trie scans the whole
  // string. Symbols are only included where X-SAMPA has not already
  // claimed the spelling for a sound: the digits are vowels there (`1` is
  // ɨ, `9` is œ) and `?` is the glottal stop.
  xsampaUnit: Trie<Unit>
  machineByTalk: Map<string, number>
}

// Normalize so precomposed and combining IPA forms match the same keys.
export const nfd = (text: string) => text.normalize('NFD')

// Rank a phone as a talk-spelling representative (lower is plainer): a
// real (non-provisional) sound, the shortest IPA, ideally spelled the
// same in IPA and talk.
function rank(phone: Phone): [number, number, number] {
  return [
    phone.provisional ? 1 : 0,
    nfd(phone.ipa).length,
    phone.ipa === phone.talk ? 0 : 1,
  ]
}

// One representative phone per talk spelling (talk -> ipa is many to one),
// so decomposing a sound picks its plainest base.
function pickRepresentatives(): Phone[] {
  const byTalk = new Map<string, Phone>()

  for (const phone of phones) {
    const current = byTalk.get(phone.talk)

    if (!current) {
      byTalk.set(phone.talk, phone)
      continue
    }

    const a = rank(phone)
    const b = rank(current)

    for (let k = 0; k < a.length; k++) {
      if (a[k] !== b[k]) {
        if (a[k] < b[k]) {
          byTalk.set(phone.talk, phone)
        }

        break
      }
    }
  }

  return [...byTalk.values()]
}

/**
 * Group modifiers by talk spelling, so a spelling that means one thing on
 * a consonant and another on a vowel keeps both readings.
 */
function byTalkSpelling(list: Modifier[]): [string, Modifier[]][] {
  const grouped = new Map<string, Modifier[]>()

  for (const modifier of list) {
    const current = grouped.get(modifier.talk)

    if (current) {
      current.push(modifier)
    } else {
      grouped.set(modifier.talk, [modifier])
    }
  }

  return [...grouped]
}

/**
 * Pick the reading of a talk affix that fits the base it follows.
 *
 * An `any` modifier applies to either form, so it is the fallback when no
 * form-specific reading matches.
 */
export function pickModifier(
  options: Modifier[],
  form: 'consonant' | 'vowel',
): Modifier | undefined {
  return (
    options.find(m => m.base === form) ??
    options.find(m => m.base === 'any')
  )
}

/**
 * Whether a modifier can attach to a base, per its `attaches` rule.
 *
 * This is what decides an otherwise ambiguous sequence. `pʰk` is `pʰ`
 * then `k`, because a plosive takes aspiration. `aʰk` is `a` then `ʰk`,
 * because a vowel does not, so the mark must belong to what follows.
 */
export function modifierAttaches(base: Phone, mod: Modifier): boolean {
  const rule = mod.attaches

  if (!rule) return true
  if (rule.place && !rule.place.includes(base.place ?? '')) return false
  if (rule.notPlace?.includes(base.place ?? '')) return false
  if (rule.manner && !rule.manner.includes(base.manner ?? '')) return false
  if (rule.voicing && !rule.voicing.includes(base.voicing ?? '')) return false

  return true
}

/**
 * Whether a phone's talk spelling is already reachable as another phone
 * plus modifiers.
 *
 * Many phones are spelled compositionally: `p!` is `p` with the ejective
 * affix, `mh!` is `m` with voiceless, `n$` is `n` with dental. Listing
 * those as sound STARTERS makes segmentation ambiguous, because a starter
 * is matched greedily and swallows an affix that the next modifier needed.
 * `p!!` (extra-short `p`) would read as the phone `p!` followed by a
 * stray `!`, and `!!` could never be seen at all.
 *
 * Such a phone stays in the IPA trie, where it is unambiguous, and stays
 * in the enumerated inventory, which builds it from base plus modifiers
 * anyway. It just does not begin a sound on its own.
 */
function reconstructible(phone: Phone, byTalk: Map<string, Phone>): boolean {
  for (const [candidateTalk, candidate] of byTalk) {
    if (candidateTalk === phone.talk) continue
    if (!phone.talk.startsWith(candidateTalk)) continue

    // The remainder must be entirely affix spellings, longest first, or
    // this is not a composition of the candidate.
    let rest = phone.talk.slice(candidateTalk.length)
    const found: Modifier[] = []
    let progressed = true

    while (rest.length > 0 && progressed) {
      progressed = false

      for (const [affix, list] of affixSpellings) {
        if (!rest.startsWith(affix)) continue

        const modifier = pickModifier(list, candidate.form)
        if (!modifier) continue

        found.push(modifier)
        rest = rest.slice(affix.length)
        progressed = true
        break
      }
    }

    if (rest.length > 0) continue

    // The spelling decomposes, but that only makes the phone REDUNDANT if
    // the composition also names the same sound. `y$` decomposes into `y`
    // plus dental, yet the phone is ɥ, not a dental ʝ, so it is a sound in
    // its own right and has to keep starting one.
    if (nfd(spellIpa(candidate, found)) === nfd(phone.ipa)) return true
  }

  return false
}

// The IPA a base plus modifiers spells, in the modifiers' declared order.
// Mirrors `spell` in convert.ts, kept here because runtime is built first.
function spellIpa(base: Phone, mods: Modifier[]): string {
  const ordered = [...mods].sort((a, b) => a.order - b.order)

  return (
    ordered
      .filter(m => m.prefix)
      .map(m => m.ipa)
      .join('') +
    base.ipa +
    ordered
      .filter(m => !m.prefix)
      .map(m => m.ipa)
      .join('')
  )
}

// Longest first, so a two-character affix is tried before its prefix.
const affixSpellings: [string, Modifier[]][] = byTalkSpelling(modifiers).sort(
  (a, b) => b[0].length - a[0].length,
)

function bootstrap(): Runtime {
  const symbols = buildSymbols()

  const basePhones = pickRepresentatives()

  const starter = new TrieBuilder<Unit>()

  const byTalk = new Map(basePhones.map(p => [p.talk, p] as [string, Phone]))
  const starterPhones = basePhones.filter(p => !reconstructible(p, byTalk))

  for (const phone of starterPhones) {
    starter.add(phone.talk, { role: 'phone', phone })
  }

  for (const symbol of symbols) {
    starter.add(symbol.talk, { role: 'symbol', symbol })
  }

  const ipa = new TrieBuilder<Unit>()

  for (const phone of phones) {
    ipa.add(nfd(phone.ipa), { role: 'phone', phone })
  }

  for (const modifier of modifiers) {
    if (modifier.ipa) {
      ipa.add(nfd(modifier.ipa), { role: 'modifier', modifier })
    }
  }

  for (const symbol of symbols) {
    ipa.add(nfd(symbol.ipa), { role: 'symbol', symbol })
  }

  const xsampa = new TrieBuilder<Unit>()
  const claimed = new Set<string>()

  for (const phone of phones) {
    xsampa.add(phone.xsampa, { role: 'phone', phone })
    claimed.add(phone.xsampa)
  }

  for (const modifier of modifiers) {
    if (modifier.xsampa) {
      xsampa.add(modifier.xsampa, { role: 'modifier', modifier })
      claimed.add(modifier.xsampa)
    }
  }

  for (const symbol of symbols) {
    if (!claimed.has(symbol.ipa)) {
      xsampa.add(symbol.ipa, { role: 'symbol', symbol })
    }
  }

  const machineByTalk = new Map<string, number>()

  for (const entry of tokenEntries) {
    machineByTalk.set(entry.talk, entry.code)
  }

  return {
    symbols,
    basePhones,
    starterPhones,
    consonantModifiers: modifiers.filter(
      m => m.base === 'consonant' || m.base === 'any',
    ),
    vowelModifiers: modifiers.filter(
      m => m.base === 'vowel' || m.base === 'any',
    ),
    talkStarter: starter.build(),
    talkModifier: buildTrie([...byTalkSpelling(modifiers)]),
    ipaUnit: ipa.build(),
    xsampaUnit: xsampa.build(),
    machineByTalk,
  }
}

export const R = bootstrap()
