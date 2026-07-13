// The cluster whitelists, loaded from base/clusters/. The category files
// list the cluster definitions; base/clusters/index.json holds one Chinese
// token per atomic piece (each colon-split part and the colon-removed
// whole). A cluster's code is the token of its whole (colon-removed) form.

import consonantList from '../base/clusters/consonants/index.json'
import startList from '../base/clusters/consonants/start.json'
import endList from '../base/clusters/consonants/end.json'
import fullList from '../base/clusters/consonants/full.json'
import vowelList from '../base/clusters/vowels/index.json'
import pieceList from '../base/clusters/index.json'

type Cluster = { talk: string }
type Piece = { talk: string; token: string }

export type Clusters = {
  consonants: Record<string, string>
  endConsonants: Record<string, string>
  fullConsonants: Record<string, string>
  startConsonants: Record<string, string>
  vowels: Record<string, string>
}

const tokenOf = new Map<string, string>()

for (const piece of pieceList as Piece[]) {
  tokenOf.set(piece.talk, piece.token)
}

function codeOf(cluster: string): string {
  return tokenOf.get(cluster.replace(/:/g, '')) ?? ''
}

function toMap(list: Cluster[]): Record<string, string> {
  const map: Record<string, string> = {}

  for (const { talk } of list) {
    map[talk] = codeOf(talk)
  }

  return map
}

export const CLUSTERS: Clusters = {
  consonants: toMap(consonantList as Cluster[]),
  startConsonants: toMap(startList as Cluster[]),
  endConsonants: toMap(endList as Cluster[]),
  fullConsonants: toMap(fullList as Cluster[]),
  vowels: toMap(vowelList as Cluster[]),
}
