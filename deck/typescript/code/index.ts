// talk: a phonetic encoding. IPA <-> talk (ascii) <-> simple (readable)
// <-> machine (one Hangul code point per sound).
//
// Everything is derived from three data files (in base/) and a
// double-array trie scan. No runtime dependencies.

import { combine } from './combine'
import {
  ipaToTalk,
  machine,
  machineOutputs,
  readable,
  talkToIpa,
  tokenize,
} from './convert'
import { enumerateSounds } from './enumerate'
import { segment } from './sound'

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
} from './type'

export { combine } from './combine'
export {
  ipaToTalk,
  machine,
  machineOutputs,
  readable,
  talkToIpa,
  tokenize,
} from './convert'
export { enumerateSounds } from './enumerate'
export { segment } from './sound'
export { syllables } from './syllable'
export type { Syllable, Cluster } from './syllable'

import { syllables } from './syllable'

const talk = {
  ipaToTalk,
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
