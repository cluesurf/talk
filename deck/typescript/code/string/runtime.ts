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
  consonantModifiers: Modifier[]
  vowelModifiers: Modifier[]
  // Sound starters (a base or a symbol), keyed by talk.
  talkStarter: Trie<Unit>
  // Affixes, keyed by talk. Matched only after a base, because a modifier
  // like `h~` shares its spelling with the base `h~` (ɦ), so which one is
  // meant depends on position.
  talkModifier: Trie<Modifier>
  // Every unit keyed by IPA. IPA has no base/affix spelling clash, so one
  // trie scans the whole string.
  ipaUnit: Trie<Unit>
  // Every unit keyed by X-SAMPA. Like IPA, X-SAMPA spells affixes
  // distinctly from bases (`_h`, `_>`, `:`), so one trie scans the whole
  // string. Symbols are only included where X-SAMPA has not already
  // claimed the spelling for a sound: the digits are vowels there (`1` is
  // ɨ, `9` is œ) and `?` is the glottal stop.
  xsampaUnit: Trie<Unit>
  machineByTalk: Map<string, string>
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

function bootstrap(): Runtime {
  const symbols = buildSymbols()

  const basePhones = pickRepresentatives()

  const starter = new TrieBuilder<Unit>()

  for (const phone of basePhones) {
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

  const machineByTalk = new Map<string, string>()

  for (const entry of tokenEntries) {
    machineByTalk.set(entry.talk, entry.token)
  }

  return {
    symbols,
    basePhones,
    consonantModifiers: modifiers.filter(m => m.base === 'consonant'),
    vowelModifiers: modifiers.filter(m => m.base === 'vowel'),
    talkStarter: starter.build(),
    talkModifier: buildTrie(
      modifiers.map(m => [m.talk, m] as [string, Modifier]),
    ),
    ipaUnit: ipa.build(),
    xsampaUnit: xsampa.build(),
    machineByTalk,
  }
}

export const R = bootstrap()
