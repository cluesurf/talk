import CLUSTERS_JSON from './clusters.json'

export interface Clusters {
  consonants: Record<string, string>
  endConsonants: Record<string, string>
  fullConsonants: Record<string, string>
  startConsonants: Record<string, string>
  vowels: Record<string, string>
}

export const CLUSTERS = CLUSTERS_JSON as Clusters
