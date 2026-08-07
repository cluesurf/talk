// talk: a phonetic encoding. IPA <-> talk (ascii) <-> simple (readable)
// <-> machine (one Hangul code point per sound).
//
// Everything is derived from three data files (in base/) and a
// double-array trie scan. No runtime dependencies.

import { combine } from './string/combine'
import {
  ipaToTalk,
  ipaToXsampa,
  machine,
  machineOutputs,
  parseIpa,
  parseXsampa,
  readable,
  talkToIpa,
  talkToXsampa,
  tokenize,
  xsampaToIpa,
  xsampaToTalk,
} from './string/convert'
import { enumeratePhones, enumerateSounds } from './string/enumerate'
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
  ipaToXsampa,
  machine,
  machineOutputs,
  parseIpa,
  parseXsampa,
  readable,
  talkToIpa,
  talkToXsampa,
  tokenize,
  xsampaToIpa,
  xsampaToTalk,
} from './string/convert'
export type { IpaUnit, ParsedUnit } from './string/convert'
export { enumeratePhones, enumerateSounds } from './string/enumerate'
export { segment } from './string/sound'
export { syllables } from './syllable'
export type { Syllable, Cluster } from './syllable'

import { syllables } from './syllable'

const talk = {
  ipaToTalk,
  parseIpa,
  talkToIpa,
  ipaToXsampa,
  parseXsampa,
  talkToXsampa,
  xsampaToIpa,
  xsampaToTalk,
  tokenize,
  readable,
  machine,
  machineOutputs,
  segment,
  syllables,
  combine,
  enumeratePhones,
  enumerateSounds,
}

export default talk
