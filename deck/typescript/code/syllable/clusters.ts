// The cluster whitelists, loaded from base/clusters/ and turned into
// talk -> token lookups for the syllabifier.

import consonantList from '../base/clusters/consonants/index.json'
import startList from '../base/clusters/consonants/start.json'
import endList from '../base/clusters/consonants/end.json'
import fullList from '../base/clusters/consonants/full.json'
import vowelList from '../base/clusters/vowels/index.json'

type Entry = { talk: string; token: string }

export type Clusters = {
  consonants: Record<string, string>
  endConsonants: Record<string, string>
  fullConsonants: Record<string, string>
  startConsonants: Record<string, string>
  vowels: Record<string, string>
}

function toMap(list: Entry[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const entry of list) {
    map[entry.talk] = entry.token
  }
  return map
}

export const CLUSTERS: Clusters = {
  consonants: toMap(consonantList as Entry[]),
  startConsonants: toMap(startList as Entry[]),
  endConsonants: toMap(endList as Entry[]),
  fullConsonants: toMap(fullList as Entry[]),
  vowels: toMap(vowelList as Entry[]),
}
