// talk: a phonetic encoding. IPA <-> talk (ascii) <-> simple (readable)
// <-> machine (one Hangul code point per sound).
//
// Everything is derived from three data files (in base/) and a
// double-array trie scan. No runtime dependencies.

import { combine } from './string/combine'
import {
  ipaToTalk,
  machine,
  machineOutputs,
  parseIpa,
  readable,
  talkToIpa,
  tokenize,
} from './string/convert'
import { enumerateSounds } from './string/enumerate'
import { segment } from './string/sound'

export type {
  Attaches,
  Kind,
  Modifier,
  Phone,
  Sound,
  SoundInfo,
  SymbolEntry,
  TokenEntry,
  Unit,
} from './string/type'

export { combine } from './string/combine'
export {
  ipaToTalk,
  machine,
  machineOutputs,
  parseIpa,
  readable,
  talkToIpa,
  tokenize,
} from './string/convert'
export type { IpaUnit } from './string/convert'
export { enumerateSounds } from './string/enumerate'
export { segment } from './string/sound'
export { syllables } from './syllable'
export type { Syllable, Cluster } from './syllable'

import { syllables } from './syllable'

const talk = {
  ipaToTalk,
  parseIpa,
  talkToIpa,
  tokenize,
  readable,
  machine,
  machineOutputs,
  segment,
  syllables,
  combine,
  enumerateSounds,
}

export default talk
