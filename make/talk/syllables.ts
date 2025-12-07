import { Cluster, ClusterKey } from './clusters'

export interface Syllable {
  clusters: Cluster[]
}

export default function chunk(clusters: Cluster[]) {
  let i = 0
  const syllables: Syllable[] = []

  while (i < clusters.length) {
    const cluster = clusters[i]!
    const syllable: Syllable = {
      clusters: [],
    }

    switch (cluster.form) {
      case ClusterKey.VOWEL: {
        // Start syllable with vowel
        syllable.clusters.push(cluster)
        i++

        // Look for following consonants that end this syllable
        while (i < clusters.length) {
          const next = clusters[i]!

          // If next is a vowel, stop - it starts a new syllable
          if (next.form === ClusterKey.VOWEL) {
            break
          }

          // Check if END_CONSONANT is followed by START_CONSONANT
          if (next.form === ClusterKey.END_CONSONANT) {
            syllable.clusters.push(next)
            i++
            const afterEnd = clusters[i]
            if (afterEnd && afterEnd.form === ClusterKey.START_CONSONANT) {
              // Break here - START_CONSONANT begins new syllable
              break
            }
            continue
          }

          // Check if this consonant should be part of this syllable or the next
          const nextNext = clusters[i + 1]
          if (nextNext && nextNext.form === ClusterKey.VOWEL) {
            // If there's a vowel after this consonant, check if we should split
            if (
              next.form === ClusterKey.END_CONSONANT ||
              next.form === ClusterKey.FULL_CONSONANT
            ) {
              // These typically end syllables
              syllable.clusters.push(next)
              i++
            } else if (next.form === ClusterKey.START_CONSONANT) {
              // These typically start new syllables
              break
            } else {
              // Regular consonant - could go either way
              // For now, keep it with current syllable if it's a single consonant
              if (
                i + 2 >= clusters.length ||
                clusters[i + 2]?.form !== ClusterKey.CONSONANT
              ) {
                break
              } else {
                syllable.clusters.push(next)
                i++
              }
            }
          } else {
            // No vowel follows, so this consonant ends the syllable
            syllable.clusters.push(next)
            i++
          }
        }
        break
      }

      case ClusterKey.CONSONANT:
      case ClusterKey.START_CONSONANT:
      case ClusterKey.FULL_CONSONANT: {
        // Start syllable with consonant(s)
        syllable.clusters.push(cluster)
        i++

        // Look for vowel
        while (
          i < clusters.length &&
          clusters[i]!.form !== ClusterKey.VOWEL
        ) {
          syllable.clusters.push(clusters[i]!)
          i++
        }

        // Add the vowel if found
        if (
          i < clusters.length &&
          clusters[i]!.form === ClusterKey.VOWEL
        ) {
          syllable.clusters.push(clusters[i]!)
          i++

          // Look for trailing consonants
          while (i < clusters.length) {
            const next = clusters[i]!

            if (next.form === ClusterKey.VOWEL) {
              break
            }

            // Check if END_CONSONANT is followed by START_CONSONANT
            if (next.form === ClusterKey.END_CONSONANT) {
              syllable.clusters.push(next)
              i++
              const afterEnd = clusters[i]
              if (afterEnd && afterEnd.form === ClusterKey.START_CONSONANT) {
                // Break here - START_CONSONANT begins new syllable
                break
              }
              continue
            }

            const nextNext = clusters[i + 1]
            if (nextNext && nextNext.form === ClusterKey.VOWEL) {
              if (
                next.form === ClusterKey.END_CONSONANT ||
                next.form === ClusterKey.FULL_CONSONANT
              ) {
                syllable.clusters.push(next)
                i++
              } else if (next.form === ClusterKey.START_CONSONANT) {
                break
              } else {
                // Check if this consonant cluster should stay or go
                if (
                  i + 2 >= clusters.length ||
                  clusters[i + 2]?.form !== ClusterKey.CONSONANT
                ) {
                  break
                } else {
                  syllable.clusters.push(next)
                  i++
                }
              }
            } else {
              syllable.clusters.push(next)
              i++
            }
          }
        }
        break
      }

      case ClusterKey.END_CONSONANT: {
        // Standalone end consonant - usually attaches to previous syllable
        // but if starting fresh, create its own syllable
        syllable.clusters.push(cluster)
        i++
        break
      }
    }

    if (syllable.clusters.length > 0) {
      syllables.push(syllable)
    }
  }

  return syllables
}
