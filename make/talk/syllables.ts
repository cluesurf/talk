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

          // Check if we have an END_CONSONANT that might need splitting
          if (next.form === ClusterKey.END_CONSONANT) {
            // Check if this END_CONSONANT contains both ending and starting parts
            // e.g., "ntQ~" where "n" ends the syllable and "tQ~" starts the next
            const endText = next.text
            
            // Common pattern: single consonant + consonant cluster with modifier
            // e.g., ntQ~ -> n + tQ~
            if (endText.length > 2 && /^[^aeiouAEIOU][^aeiouAEIOU]/.test(endText)) {
              // Split after first consonant
              const firstConsonant = endText[0]!
              const rest = endText.slice(1)
              
              // Add first consonant to current syllable
              syllable.clusters.push({
                ...next,
                text: firstConsonant,
              })
              
              // Check if there's a following vowel - if so, the rest starts new syllable
              const afterEnd = clusters[i + 1]
              if (afterEnd && afterEnd.form === ClusterKey.VOWEL) {
                // Insert the remaining consonant cluster before continuing
                clusters.splice(i + 1, 0, {
                  ...next,
                  form: ClusterKey.START_CONSONANT,
                  text: rest,
                })
              }
              i++
              break
            } else {
              // Regular END_CONSONANT handling
              syllable.clusters.push(next)
              i++
              const afterEnd = clusters[i]
              if (afterEnd && 
                  (afterEnd.form === ClusterKey.START_CONSONANT || 
                   (afterEnd.form === ClusterKey.CONSONANT && clusters[i + 1]?.form === ClusterKey.VOWEL))) {
                // Break here - START_CONSONANT or CONSONANT+VOWEL begins new syllable
                break
              }
              continue
            }
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
              // Regular consonant - check if it should start new syllable
              // If there's no more clusters or the cluster after next is a vowel,
              // this consonant should start a new syllable
              break
            }
          } else {
            // No vowel follows, so this consonant ends the syllable
            syllable.clusters.push(next)
            i++
          }
        }
        break
      }

      case ClusterKey.FULL_CONSONANT: {
        // FULL_CONSONANT is a complete syllable by itself
        syllable.clusters.push(cluster)
        i++
        break
      }

      case ClusterKey.CONSONANT:
      case ClusterKey.START_CONSONANT: {
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

            // Check if we have an END_CONSONANT that might need splitting
            if (next.form === ClusterKey.END_CONSONANT) {
              // Check if this END_CONSONANT contains both ending and starting parts
              const endText = next.text
              
              // Common pattern: single consonant + consonant cluster with modifier
              // e.g., ntQ~ -> n + tQ~
              if (endText.length > 2 && /^[^aeiouAEIOU][^aeiouAEIOU]/.test(endText)) {
                // Split after first consonant
                const firstConsonant = endText[0]!
                const rest = endText.slice(1)
                
                // Add first consonant to current syllable
                syllable.clusters.push({
                  ...next,
                  text: firstConsonant,
                })
                
                // Check if there's a following vowel - if so, the rest starts new syllable
                const afterEnd = clusters[i + 1]
                if (afterEnd && afterEnd.form === ClusterKey.VOWEL) {
                  // Insert the remaining consonant cluster before continuing
                  clusters.splice(i + 1, 0, {
                    ...next,
                    form: ClusterKey.START_CONSONANT,
                    text: rest,
                  })
                }
                i++
                break
              } else {
                // Regular END_CONSONANT handling
                syllable.clusters.push(next)
                i++
                const afterEnd = clusters[i]
                if (afterEnd && 
                    (afterEnd.form === ClusterKey.START_CONSONANT || 
                     (afterEnd.form === ClusterKey.CONSONANT && clusters[i + 1]?.form === ClusterKey.VOWEL))) {
                  // Break here - START_CONSONANT or CONSONANT+VOWEL begins new syllable
                  break
                }
                continue
              }
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
                // Regular consonant - if followed by vowel, it starts new syllable
                break
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
