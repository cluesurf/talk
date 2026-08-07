// talk: a phonetic encoding. IPA <-> talk (ascii) <-> simple (readable)
// <-> machine (one 24-bit integer per sound).
//
// Everything is derived from three data files (in base/) and a
// double-array trie scan. No runtime dependencies.

import { combine } from './string/combine'
import {
  ipaToTalk,
  ipaToXsampa,
  machineCodes,
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
import { machine, machineBytes, machineText } from './space/codec'
import { normalizeIpa } from './string/normalize'
import { segment } from './string/sound'

export type {
  Attaches,
  Kind,
  Modifier,
  Phone,
  Sound,
  SoundInfo,
  SymbolEntry,
  Unit,
} from './string/type'

export { combine } from './string/combine'
export {
  ipaToTalk,
  ipaToXsampa,
  machineCodes,
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
export { CODE_LIMIT, NO_CODE } from './string/type'
export { normalizeIpa } from './string/normalize'
export type { NormalizeIpaOptions } from './string/normalize'
export { enumeratePhones, enumerateSounds } from './string/enumerate'
export { segment } from './string/sound'
export {
  CAPACITY,
  bytesFor,
  countAttested,
  countSpace,
  reportSpace,
  unitFor,
} from './space'
export type { Notation, Space, SpaceReport, Tier } from './space'
export {
  byteWidth,
  machine,
  machineBytes,
  machineText,
  decodeUnit,
  encodeUnit,
  pack,
  sizeOf,
  unpack,
} from './space/codec'
export type { Composition } from './space/codec'
export { axesFor, modelFor } from './space/model'
export type { Model, ModelAxis, ModelBase } from './space/model'
export { IPA_AXES, SUPRASEGMENTAL, attaches } from './space/axis'
export type { Attachment, MarkGroup } from './space/axis'
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
  machine,
  machineBytes,
  machineText,
  normalizeIpa,
  readable,
  machineCodes,
  segment,
  syllables,
  combine,
  enumeratePhones,
  enumerateSounds,
}

export default talk
