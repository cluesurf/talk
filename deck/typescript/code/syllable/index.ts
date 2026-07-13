// Syllable parsing: split a talk word into syllables, each a sequence of
// onset, nucleus, and coda clusters.

import chunk from './syllable'

export type { Syllable, Cluster } from './syllable'
export { ClusterKey } from './syllable'
export {
  readSegments,
  groupSegmentsIntoClusters,
  groupClustersIntoSyllables,
  serialize,
  cluster,
} from './syllable'

// Split a talk word into its syllables and clusters.
export function syllables(talk: string) {
  return chunk(talk)
}

export default syllables
