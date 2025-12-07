import { Cluster } from './clusters'

export interface Syllable {
  clusters: Cluster[]
}

export default function chunk(clusters: Cluster[]) {
  let i = 0
  const syllables: Syllable[] = []
  while (i < clusters.length) {
    const node = clusters[i]!
    const next = clusters[i + 1]

    const syllable: Syllable = {
      clusters: [node],
    }

    syllables.push(syllable)

    if (!next) {
      break
    }

    // TODO: handle new structure, haven't finished
    // (migrated to `Cluster[]` from `string[][]`).
    if (!/[ieaou]/i.exec(next.text)) {
      syllable.clusters.push(next)
    } else if (
      !/(tx|dj)$/i.exec(node.text) &&
      /^[ieaou]/i.exec(next.text) &&
      node.text.match(
        /[bcdfghjklmnpqrstvwxyz]([bcdfghjklmnpqrstvwxyz](?:[QGhy]~)?)$/gi,
      )
    ) {
      const text = clusters[i]!
      clusters[i] = text.slice(0, -RegExp.$1.length)
      clusters[i + 1] =
        text.slice(text.length - RegExp.$1.length) + clusters[i + 1]
    } else {
      i++
    }
  }
}
