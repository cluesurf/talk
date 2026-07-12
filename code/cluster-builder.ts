import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { Clusters } from './clusters'

import {
  sortLength,
  startConsonants,
  consonants,
  endConsonants,
  fullConsonants,
  vowels,
} from './cluster-definitions'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CLUSTERS_PATH = path.join(__dirname, 'clusters.json')

let HANGUL_CODE = 53248
const HANGUL_END = 0xd7a3

// console.log(combos)

// let total = 0
// for (const [_, count] of Object.entries(combos)) {
//   total += count
// }
// console.log(`total: ${total}`)

function getNextGlyph() {
  if (HANGUL_CODE > HANGUL_END) {
    throw new Error(
      `Exceeded available Hangul code points (max: ${HANGUL_END})`,
    )
  }
  return String.fromCodePoint(HANGUL_CODE++)
}

// Load existing clusters and set HANGUL_CODE to continue from last value
function loadExistingClustersNested(): Clusters {
  const empty: Clusters = {
    consonants: {},
    endConsonants: {},
    fullConsonants: {},
    startConsonants: {},
    vowels: {},
  }

  if (!fs.existsSync(CLUSTERS_PATH)) {
    return empty
  }

  const data = fs.readFileSync(CLUSTERS_PATH, 'utf-8')
  const clusters: Clusters = JSON.parse(data)

  // Find the highest code point across all categories
  let maxCode = HANGUL_CODE - 1
  const categories: Array<Record<string, string>> = [
    clusters.consonants,
    clusters.endConsonants,
    clusters.fullConsonants,
    clusters.startConsonants,
    clusters.vowels,
  ]
  for (const category of categories) {
    for (const glyph of Object.values(category)) {
      const code = glyph.codePointAt(0)
      if (code !== undefined && code > maxCode) {
        maxCode = code
      }
    }
  }

  // Set HANGUL_CODE to continue after the last used code
  HANGUL_CODE = Math.min(maxCode + 1, HANGUL_END)

  return clusters
}

// Process clusters - keep those with colons as they indicate optional splits
function processClusters(items: Array<string>): Array<string> {
  return items
}

// Build clusters map and save to JSON
export function buildAndSaveClusters(): Clusters {
  // Load existing clusters (also sets HANGUL_CODE)
  const clusters = loadExistingClustersNested()

  // Helper to add clusters to a category without overwriting
  function addToCategory(
    category: Record<string, string>,
    items: Array<string>,
  ): void {
    for (const item of items) {
      if (!(item in category)) {
        category[item] = getNextGlyph()
      }
    }
  }

  // Helper to clean up removed clusters from a category
  function cleanupCategory(
    category: Record<string, string>,
    validItems: Array<string>,
  ): void {
    const validSet = new Set(validItems)
    for (const key in category) {
      if (!validSet.has(key)) {
        delete category[key]
      }
    }
  }

  // Clean up removed clusters first
  cleanupCategory(clusters.consonants, processClusters(consonants))
  cleanupCategory(
    clusters.endConsonants,
    processClusters(endConsonants),
  )
  cleanupCategory(
    clusters.fullConsonants,
    processClusters(fullConsonants),
  )
  cleanupCategory(
    clusters.startConsonants,
    processClusters(startConsonants),
  )
  cleanupCategory(clusters.vowels, processClusters(vowels))

  // Add clusters to each category
  addToCategory(clusters.consonants, processClusters(consonants))
  addToCategory(clusters.endConsonants, processClusters(endConsonants))
  addToCategory(
    clusters.fullConsonants,
    processClusters(fullConsonants),
  )
  addToCategory(
    clusters.startConsonants,
    processClusters(startConsonants),
  )
  addToCategory(clusters.vowels, processClusters(vowels))

  // Sort keys in each category by length (descending) then alphabetically
  const sortedClusters: Clusters = {
    consonants: Object.fromEntries(
      Object.entries(clusters.consonants).sort(([a], [b]) =>
        sortLength(a, b),
      ),
    ),
    endConsonants: Object.fromEntries(
      Object.entries(clusters.endConsonants).sort(([a], [b]) =>
        sortLength(a, b),
      ),
    ),
    fullConsonants: Object.fromEntries(
      Object.entries(clusters.fullConsonants).sort(([a], [b]) =>
        sortLength(a, b),
      ),
    ),
    startConsonants: Object.fromEntries(
      Object.entries(clusters.startConsonants).sort(([a], [b]) =>
        sortLength(a, b),
      ),
    ),
    vowels: Object.fromEntries(
      Object.entries(clusters.vowels).sort(([a], [b]) =>
        sortLength(a, b),
      ),
    ),
  }

  // Save to JSON
  fs.writeFileSync(
    CLUSTERS_PATH,
    JSON.stringify(sortedClusters, null, 2),
  )

  const totalCount =
    Object.keys(clusters.consonants).length +
    Object.keys(clusters.endConsonants).length +
    Object.keys(clusters.fullConsonants).length +
    Object.keys(clusters.startConsonants).length +
    Object.keys(clusters.vowels).length

  console.log(`Saved ${totalCount} clusters to ${CLUSTERS_PATH}`)
  console.log(
    `  consonants: ${Object.keys(clusters.consonants).length}`,
  )
  console.log(
    `  endConsonants: ${Object.keys(clusters.endConsonants).length}`,
  )
  console.log(
    `  fullConsonants: ${Object.keys(clusters.fullConsonants).length}`,
  )
  console.log(
    `  startConsonants: ${
      Object.keys(clusters.startConsonants).length
    }`,
  )
  console.log(`  vowels: ${Object.keys(clusters.vowels).length}`)
  console.log(`Next HANGUL_CODE: ${HANGUL_CODE}`)

  return clusters
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildAndSaveClusters()
}
