/**
 * The cluster tables, which the syllabifier reads.
 *
 * WHY THIS EXISTS. The tables are generated from letter lists in
 * `code/make/clusters.ts`, and when the talk spellings changed the lists
 * kept the old letters. Nothing failed loudly: `pnpm clusters` reported
 * success, the files were written, and the syllabifier went on matching a
 * stale alphabet. The only symptom was four syllable tests failing on words
 * nobody could explain.
 *
 * So these assert the two things a generated table has to satisfy. The
 * KEYS have to be spellings this library still recognises, and the
 * EXPANSION has to have run, so a cluster attested for one letter is
 * present for that letter's variants too.
 */

import { describe, expect, it } from 'vitest'
import { CLUSTERS } from '../code/syllable/clusters'
import { enumeratePhones } from '../code'

const GROUPS = [
  'consonants',
  'startConsonants',
  'endConsonants',
  'fullConsonants',
  'vowels',
] as const

/** Every talk spelling of a base sound, longest first so `k!` beats `k`. */

const LETTERS = [
  ...new Set(
    enumeratePhones()
      .map(one => one.talk)
      .filter(one => !one.includes('<')),
  ),
].sort((a, b) => b.length - a.length)

/**
 * The letters a cluster is made of, or null when one of them is not a
 * spelling this library knows.
 *
 * A colon marks where a cluster MAY split across a syllable boundary, so it
 * is a separator rather than a sound and comes out before the walk.
 */

function lettersOf(cluster: string): string[] | null {
  const text = cluster.replace(/:/g, '')
  const out: string[] = []
  let at = 0

  while (at < text.length) {
    const one = LETTERS.find(letter => text.startsWith(letter, at))

    if (!one) {
      return null
    }

    out.push(one)
    at += one.length
  }

  return out
}

describe('every cluster is spelled in letters the library knows', () => {
  for (const group of GROUPS) {
    it(`holds no unknown letter in ${group}`, () => {
      const bad = Object.keys(CLUSTERS[group])
        .filter(one => lettersOf(one) === null)
        .slice(0, 10)

      expect(bad).toEqual([])
    })
  }

  it('holds none of the retired single letters', () => {
    // `q` meant `ŋ`, `Q` meant `ʕ`, `C` meant `ð` and `B` meant `β`. Each
    // covered several sounds at once, which is why they were replaced, and
    // each is now either a modifier or nothing at all. A cluster still
    // written with one is a cluster the syllabifier can never match.
    const retired = /[qQCB]/

    for (const group of GROUPS) {
      const bad = Object.keys(CLUSTERS[group])
        .filter(one => retired.test(one))
        .slice(0, 6)

      expect(bad, group).toEqual([])
    }
  })
})

describe('the key clusters are present', () => {
  // A handful the syllabifier cannot work without, named rather than
  // counted, so a regeneration that quietly drops them fails here.
  const KEY: [string, string][] = [
    ['consonants', 'p'],
    ['consonants', '$n'],
    ['consonants', 'l'],
    ['vowels', 'a'],
    ['vowels', 'i'],
    ['vowels', '$i'],
  ]

  for (const [group, cluster] of KEY) {
    it(`${group} holds ${cluster}`, () => {
      expect(Object.keys(CLUSTERS[group as (typeof GROUPS)[number]])).toContain(
        cluster,
      )
    })
  }

  it('holds an end cluster for a nasal plus a stop', () => {
    // `siŋk` needs one. The colon says it may split across a syllable.
    const end = Object.keys(CLUSTERS.endConsonants)

    expect(end.some(one => one.replace(/:/g, '') === '$nk')).toBe(true)
  })
})

describe('the variant expansion ran', () => {
  // `expandAll` writes each cluster in every spelling its letters allow, so
  // a cluster attested for `n` is present for `$n` and `N` as well. If the
  // expansion is skipped the tables still generate and still look sane,
  // which is exactly how the stale alphabet survived unnoticed.
  it('covers the $ series wherever the plain letter appears', () => {
    const end = new Set(
      Object.keys(CLUSTERS.endConsonants).map(one => one.replace(/:/g, '')),
    )

    expect(end.has('nk')).toBe(true)
    expect(end.has('$nk')).toBe(true)
  })

  it('reaches a size only expansion explains', () => {
    // Hand-written the lists held about 1,300 end clusters. Expanded across
    // the letter variants they hold roughly ten times that, so a number
    // near the old one means the expansion did not run.
    expect(Object.keys(CLUSTERS.endConsonants).length).toBeGreaterThan(5000)
  })
})
