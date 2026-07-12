import CLUSTERS_JSON from './base/clusters.json'

export type Clusters = {
  consonants: Record<string, string>
  endConsonants: Record<string, string>
  fullConsonants: Record<string, string>
  startConsonants: Record<string, string>
  vowels: Record<string, string>
}

export const CLUSTERS = CLUSTERS_JSON as Clusters
