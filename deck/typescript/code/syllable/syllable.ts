import { Trie, TrieBuilder } from '../trie'
import { CLUSTERS } from './clusters'

// The vowel-mark axes, matching how talk builds vowel glyphs. Every
// vowel takes a variant, nasal, syllabic, tone, duration, and accent
// slot, and the segment table below is generated over their product.
const BASE_VOWEL_GLYPHS = [
  'I',
  'E',
  'A',
  'O',
  'U',
  'i',
  'e',
  'a',
  'o',
  'u',
]
const TONE_MARKS = [
  '--',
  '-',
  '++',
  '+',
  '/',
  '//',
  '\\/',
  '/\\',
  '\\\\',
  '\\',
  '',
]
const VARIANT_MARKS = ['$', '']
const NASAL_MARKS = ['&', '']
const DURATION_MARKS = ['_', '!', '']
const SYLLABIC_MARKS = ['@', '']
const ACCENT_MARKS = ['^', '']

export type Syllable = {
  clusters: Cluster[]
  /** Primary stress marker - true if this syllable contains the primary stress */
  emphasis?: boolean
}

type Segment = {
  aspiration?: boolean
  click?: boolean
  dentalization?: boolean
  ejection?: boolean
  elongation?: boolean
  implosion?: boolean
  labialization?: boolean
  nasalization?: boolean
  palatalization?: boolean
  pharyngealization?: boolean
  stop?: boolean
  emphasis?: boolean
  tense?: boolean
  tone?:
    | 'extra high'
    | 'high'
    | 'low'
    | 'extra low'
    | 'rising'
    | 'rising 2'
    | 'falling'
    | 'falling 2'
    | 'rising falling'
    | 'falling rising'
  truncation?: boolean
  type?: 'punctuation' | 'vowel' | 'consonant'
  value?: string
  velarization?: boolean
  voicelessness?: boolean
  form?: 'stop' | 'continuant'
}

type Span = {
  form: ClusterType
  chunk: Segment[]
  match: string
  /** Primary stress marker - true if any mark in the chunk has emphasis */
  emphasis?: boolean
}

const SEGMENT: Record<string, Segment> = {
  '=.': { type: 'punctuation', value: '.' },
  '=@': { type: 'punctuation', value: '@' },
  '=?': { type: 'punctuation', value: '?' },
  '=!': { type: 'punctuation', value: '!' },
  '=+': { type: 'punctuation', value: '+' },
  '=-': { type: 'punctuation', value: '-' },
  'h!': { voicelessness: true },
  'h~': { aspiration: true },
  'w~': { labialization: true },
  'y~': { palatalization: true },
  'G~': { velarization: true },
  'Q~': { pharyngealization: true },
  'l*': { type: 'consonant', value: 'l', form: 'stop', click: true },
  't*': { type: 'consonant', value: 't', form: 'stop', click: true },
  'd*': { type: 'consonant', value: 'd', form: 'stop', click: true },
  'k*': { type: 'consonant', value: 'k', form: 'stop', click: true },
  'p*': { type: 'consonant', value: 'p', form: 'stop', click: true },
  'n.': {
    type: 'consonant',
    value: 'n',
    form: 'continuant',
    stop: true,
  },
  'q.': {
    type: 'consonant',
    value: 'q',
    form: 'continuant',
    stop: true,
  },
  'g.': { type: 'consonant', value: 'g', form: 'stop', stop: true },
  'd.': { type: 'consonant', value: 'd', form: 'stop', stop: true },
  'b.': { type: 'consonant', value: 'b', form: 'stop', stop: true },
  'p.': { type: 'consonant', value: 'p', form: 'stop', stop: true },
  't.': { type: 'consonant', value: 't', form: 'stop', stop: true },
  'k.': { type: 'consonant', value: 'k', form: 'stop', stop: true },
  's.': {
    type: 'consonant',
    value: 's',
    form: 'continuant',
    stop: true,
  },
  'f.': {
    type: 'consonant',
    value: 'f',
    form: 'continuant',
    stop: true,
  },
  'v.': {
    type: 'consonant',
    value: 'v',
    form: 'continuant',
    stop: true,
  },
  'z.': {
    type: 'consonant',
    value: 'z',
    form: 'continuant',
    stop: true,
  },
  'j.': {
    type: 'consonant',
    value: 'j',
    form: 'continuant',
    stop: true,
  },
  'x.': {
    type: 'consonant',
    value: 'x',
    form: 'continuant',
    stop: true,
  },
  'c.': {
    type: 'consonant',
    value: 'c',
    form: 'continuant',
    stop: true,
  },

  'n@': {
    type: 'consonant',
    value: 'n',
    form: 'continuant',
    tense: true,
  },
  'q@': {
    type: 'consonant',
    value: 'q',
    form: 'continuant',
    tense: true,
  },
  'g@': { type: 'consonant', value: 'g', form: 'stop', tense: true },
  'd@': { type: 'consonant', value: 'd', form: 'stop', tense: true },
  'b@': { type: 'consonant', value: 'b', form: 'stop', tense: true },
  'p@': { type: 'consonant', value: 'p', form: 'stop', tense: true },
  't@': { type: 'consonant', value: 't', form: 'stop', tense: true },
  'k@': { type: 'consonant', value: 'k', form: 'stop', tense: true },
  's@': {
    type: 'consonant',
    value: 's',
    form: 'continuant',
    tense: true,
  },
  'f@': {
    type: 'consonant',
    value: 'f',
    form: 'continuant',
    tense: true,
  },
  'v@': {
    type: 'consonant',
    value: 'v',
    form: 'continuant',
    tense: true,
  },
  'z@': {
    type: 'consonant',
    value: 'z',
    form: 'continuant',
    tense: true,
  },
  'j@': {
    type: 'consonant',
    value: 'j',
    form: 'continuant',
    tense: true,
  },
  'x@': {
    type: 'consonant',
    value: 'x',
    form: 'continuant',
    tense: true,
  },
  'c@': {
    type: 'consonant',
    value: 'c',
    form: 'continuant',
    tense: true,
  },

  'n!': {
    type: 'consonant',
    value: 'n',
    form: 'continuant',
    ejection: true,
  },
  'q!': {
    type: 'consonant',
    value: 'q',
    form: 'continuant',
    ejection: true,
  },
  'g!': { type: 'consonant', value: 'g', form: 'stop', ejection: true },
  'd!': { type: 'consonant', value: 'd', form: 'stop', ejection: true },
  'b!': { type: 'consonant', value: 'b', form: 'stop', ejection: true },
  'p!': { type: 'consonant', value: 'p', form: 'stop', ejection: true },
  't!': { type: 'consonant', value: 't', form: 'stop', ejection: true },
  'k!': { type: 'consonant', value: 'k', form: 'stop', ejection: true },
  's!': {
    type: 'consonant',
    value: 's',
    form: 'continuant',
    ejection: true,
  },
  'f!': {
    type: 'consonant',
    value: 'f',
    form: 'continuant',
    ejection: true,
  },
  'v!': {
    type: 'consonant',
    value: 'v',
    form: 'continuant',
    ejection: true,
  },
  'z!': {
    type: 'consonant',
    value: 'z',
    form: 'continuant',
    ejection: true,
  },
  'j!': {
    type: 'consonant',
    value: 'j',
    form: 'continuant',
    ejection: true,
  },
  'x!': {
    type: 'consonant',
    value: 'x',
    form: 'continuant',
    ejection: true,
  },
  'c!': {
    type: 'consonant',
    value: 'c',
    form: 'continuant',
    ejection: true,
  },
  'C!': {
    type: 'consonant',
    value: 'C',
    form: 'continuant',
    ejection: true,
  },
  'y!': {
    type: 'consonant',
    value: 'y',
    form: 'continuant',
    ejection: true,
  },
  'w!': {
    type: 'consonant',
    value: 'w',
    form: 'continuant',
    ejection: true,
  },
  'Q!': {
    type: 'consonant',
    value: 'Q',
    form: 'continuant',
    ejection: true,
  },
  'l!': {
    type: 'consonant',
    value: 'l',
    form: 'continuant',
    ejection: true,
  },
  'r!': {
    type: 'consonant',
    value: 'r',
    form: 'continuant',
    ejection: true,
  },
  'n~': {
    type: 'consonant',
    value: 'n',
    form: 'stop',
    dentalization: true,
  },
  't~': {
    type: 'consonant',
    value: 't',
    form: 'stop',
    dentalization: true,
  },
  'd~': {
    type: 'consonant',
    value: 'd',
    form: 'stop',
    dentalization: true,
  },

  m: { type: 'consonant', value: 'm', form: 'continuant' },
  n: { type: 'consonant', value: 'n', form: 'continuant' },
  N: { type: 'consonant', value: 'N', form: 'continuant' },
  q: { type: 'consonant', value: 'q', form: 'continuant' },
  g: { type: 'consonant', value: 'g', form: 'stop' },
  G: { type: 'consonant', value: 'G', form: 'continuant' },
  d: { type: 'consonant', value: 'd', form: 'stop' },
  b: { type: 'consonant', value: 'b', form: 'stop' },
  p: { type: 'consonant', value: 'p', form: 'stop' },
  t: { type: 'consonant', value: 't', form: 'stop' },
  T: { type: 'consonant', value: 'T', form: 'stop' },
  k: { type: 'consonant', value: 'k', form: 'stop' },
  K: { type: 'consonant', value: 'K', form: 'stop' },
  h: { type: 'consonant', value: 'h', form: 'continuant' },
  H: { type: 'consonant', value: 'H', form: 'continuant' },
  s: { type: 'consonant', value: 's', form: 'continuant' },
  S: { type: 'consonant', value: 'S', form: 'continuant' },
  f: { type: 'consonant', value: 'f', form: 'continuant' },
  F: { type: 'consonant', value: 'F', form: 'continuant' },
  V: { type: 'consonant', value: 'V', form: 'continuant' },
  v: { type: 'consonant', value: 'v', form: 'continuant' },
  z: { type: 'consonant', value: 'z', form: 'continuant' },
  Z: { type: 'consonant', value: 'Z', form: 'continuant' },
  j: { type: 'consonant', value: 'j', form: 'continuant' },
  J: { type: 'consonant', value: 'J', form: 'continuant' },
  x: { type: 'consonant', value: 'x', form: 'continuant' },
  X: { type: 'consonant', value: 'X', form: 'continuant' },
  c: { type: 'consonant', value: 'c', form: 'continuant' },
  C: { type: 'consonant', value: 'C', form: 'continuant' },
  y: { type: 'consonant', value: 'y', form: 'continuant' },
  W: { type: 'consonant', value: 'W', form: 'continuant' },
  w: { type: 'consonant', value: 'w', form: 'continuant' },
  Q: { type: 'consonant', value: 'Q', form: 'continuant' },
  "'": { type: 'consonant', value: "'", form: 'continuant' },
  l: { type: 'consonant', value: 'l', form: 'continuant' },
  L: { type: 'consonant', value: 'L', form: 'continuant' },
  r: { type: 'consonant', value: 'r', form: 'continuant' },
  R: { type: 'consonant', value: 'R', form: 'continuant' },
  ' ': { type: 'punctuation', value: ' ' },
}

const EXTRA_FEATURES: Record<string, Segment> = {
  '--': { tone: 'extra low' },
  '-': { tone: 'low' },
  '++': { tone: 'extra high' },
  '+': { tone: 'high' },
  '//': { tone: 'rising 2' }, // rising 2 (vietnamese ngã)
  '/': { tone: 'rising' }, // rising (vietnamese sắc)
  '\\/': { tone: 'falling rising' }, // falling rising (vietnamese hỏi)
  '/\\': { tone: 'rising falling' }, // rising falling
  '\\\\': { tone: 'falling 2' }, // falling 2 (vietnamese nặng)
  '\\': { tone: 'falling' }, // falling (vietnamese huyền)
  '@': { tense: true },
  '.': { stop: true },
  '!': { truncation: true },
  _: { elongation: true },
  '^': { emphasis: true },
  '?': { implosion: true },
  '*': { click: true },
  '~': { dentalization: true },
  '&': { nasalization: true },
}

BASE_VOWEL_GLYPHS.forEach(g => {
  ACCENT_MARKS.forEach(a => {
    DURATION_MARKS.forEach(l => {
      SYLLABIC_MARKS.forEach(s => {
        NASAL_MARKS.forEach(n => {
          VARIANT_MARKS.forEach(v => {
            TONE_MARKS.forEach(t => {
              const i = `${g}${v}${n}${s}${t}${l}${a}`
              // Flat single-key feature objects, so a spread combine is
              // equivalent to a deep merge (later marks win). Empty marks
              // map to undefined, which spreads to nothing.
              const features: Segment = {
                type: 'vowel',
                value: `${g}${v}`,
                ...EXTRA_FEATURES[n],
                ...EXTRA_FEATURES[s],
                ...EXTRA_FEATURES[t],
                ...EXTRA_FEATURES[l],
                ...EXTRA_FEATURES[a],
              }

              SEGMENT[i] = features
            })
          })
        })
      })
    })
  })
})

const fullConsonants = Object.keys(CLUSTERS.fullConsonants).sort(
  (a, b) => b.length - a.length,
)
const consonants = Object.keys(CLUSTERS.consonants).sort(
  (a, b) => b.length - a.length,
)
const startConsonants = Object.keys(CLUSTERS.startConsonants).sort(
  (a, b) => b.length - a.length,
)
const endConsonants = Object.keys(CLUSTERS.endConsonants).sort(
  (a, b) => b.length - a.length,
)
const vowels = Object.keys(CLUSTERS.vowels).sort(
  (a, b) => b.length - a.length,
)

// ─── fast cluster lookup ─────────────────────────────────────────────
//
// Instead of scanning every cluster at each position, each list becomes a
// trie keyed by the value string it spells out, so a lookup walks once to
// gather candidates. Each candidate is then verified with the exact same
// check the old flat scan used (the next `count` sounds, joined, equal the
// cluster's value form), so this matches the old logic sound for sound.

const sortLength = (a: string, b: string) => {
  const diff = b.length - a.length
  return diff || a.localeCompare(b)
}

// A cluster and how many sounds it spans (the old scan's `y.length`).
type ClusterCount = { cluster: string; count: number }

// Group clusters by the value string they match. Consonant clusters carry
// only colons (split markers, dropped for matching), so the value string
// is the colon-stripped form and the span is its length. Vowel clusters
// carry `$` variant marks, which are part of the sound value, so the value
// string keeps them and the span is the base-vowel count.
function buildClusterTrie(
  list: string[],
  vowel: boolean,
): Trie<ClusterCount[]> {
  const byKey = new Map<string, ClusterCount[]>()

  for (const cluster of list) {
    const key = vowel ? cluster : cluster.replace(/:/g, '')
    const count = vowel
      ? cluster.replace(/\$/g, '').length
      : cluster.replace(/:/g, '').length
    const group = byKey.get(key) ?? []
    group.push({ cluster, count })
    byKey.set(key, group)
  }

  const builder = new TrieBuilder<ClusterCount[]>()
  for (const [key, group] of byKey) {
    builder.add(key, group)
  }
  return builder.build()
}

const fullConsonantTrie = buildClusterTrie(fullConsonants, false)
const startConsonantTrie = buildClusterTrie(startConsonants, false)
const endConsonantTrie = buildClusterTrie(endConsonants, false)
const consonantTrie = buildClusterTrie(consonants, false)
const vowelTrie = buildClusterTrie(vowels, true)

const startConsonantStripped = new Set(
  startConsonants.map(x => x.replace(/:/g, '')),
)

type ClusterMatch = { cluster: string; count: number }

// The sound values of a word, joined, with the character offset each sound
// starts at.
type Frame = { text: string; offsetOfIndex: number[] }

function frameOf(chunks: Segment[]): Frame {
  const offsetOfIndex: number[] = []
  let text = ''

  for (let i = 0; i < chunks.length; i++) {
    offsetOfIndex.push(text.length)
    text += chunks[i]!.value ?? ''
  }

  return { text, offsetOfIndex }
}

// Clusters that match at sound `i`, verified exactly as the old scan did
// (`chunks.slice(i, i + count)` joined equals the cluster's value form),
// ordered longest first with alphabetical ties.
function clusterMatches(
  trie: Trie<ClusterCount[]>,
  frame: Frame,
  chunks: Segment[],
  i: number,
): ClusterMatch[] {
  const offset = frame.offsetOfIndex[i]!
  const out: ClusterMatch[] = []

  for (const hit of trie.matchAllAt(frame.text, offset)) {
    const key = frame.text.slice(offset, offset + hit.length)

    for (const { cluster, count } of hit.value) {
      const joined = chunks
        .slice(i, i + count)
        .map(c => c.value ?? '')
        .join('')

      if (joined === key) {
        out.push({ cluster, count })
      }
    }
  }

  out.sort((a, b) => sortLength(a.cluster, b.cluster))
  return out
}

enum ClusterType {
  FULL_CONSONANT = 0,
  CONSONANT = 1,
  START_CONSONANT = 2,
  END_CONSONANT = 3,
  VOWEL = 4,
  PUNCTUATION = 5,
}

const CLUSTER_MAP = [
  CLUSTERS.fullConsonants,
  CLUSTERS.consonants,
  CLUSTERS.startConsonants,
  CLUSTERS.endConsonants,
  CLUSTERS.vowels,
]

export enum ClusterKey {
  FULL_CONSONANT = 'full-consonant',
  CONSONANT = 'consonant',
  START_CONSONANT = 'start-consonant',
  END_CONSONANT = 'end-consonant',
  VOWEL = 'vowel',
  PUNCTUATION = 'punctuation',
}

const CLUSTER_KEY: ClusterKey[] = [
  ClusterKey.FULL_CONSONANT,
  ClusterKey.CONSONANT,
  ClusterKey.START_CONSONANT,
  ClusterKey.END_CONSONANT,
  ClusterKey.VOWEL,
  ClusterKey.PUNCTUATION,
]

export type Cluster = {
  form: ClusterKey
  text: string
  code: string
  /** Primary stress marker - true if this cluster carries the primary stress */
  emphasis?: boolean
}

// For backward compatibility
export const chunkClusters = readSegments

// Step 1: Parse string into marks (basic tokens)
export function readSegments(string: string) {
  let x = string

  const chunks: Segment[] = []

  let i = 0

  while (x.length) {
    let matched = false

    symbol: for (const key in SEGMENT) {
      if (x.startsWith(key)) {
        const val = SEGMENT[key]

        if (val?.type) {
          chunks.push({ ...val })
        } else {
          // merge with previous....
          chunks[chunks.length - 1] = {
            ...chunks[chunks.length - 1],
            ...val,
          }
        }

        x = x.slice(key.length)
        i += key.length
        matched = true
        break symbol
      }
    }

    if (!matched) {
      console.error(string, string.slice(i))

      throw new Error('Invalid characters found')
    }
  }

  return chunks
}

// Step 2: Group marks into clusters
export function groupSegmentsIntoClusters(chunks: Segment[]) {
  const list: Span[][] = []
  const frame = frameOf(chunks)

  let i = 0

  while (i < chunks.length) {
    const span: Span[] = []

    const chunk = chunks[i]!

    if (chunk.type === 'punctuation') {
      span.push({
        chunk: [chunk],
        match: chunk.value!,
        form: ClusterType.PUNCTUATION,
      })
      list.push(span)
      i++
      continue
    }

    // First check for standalone full consonants (high priority)
    // First check for standalone full consonants (high priority).
    for (const { cluster: x, count } of clusterMatches(
      fullConsonantTrie,
      frame,
      chunks,
      i,
    )) {
      const y = x.replace(/:/g, '')
      const chunk = chunks.slice(i, i + count)

      // Only match standalone consonants (single characters or glottal +
      // consonant). Skip dense clusters like 'gm', 'kn', etc.
      const isDenseCluster =
        y.length >= 2 && !y.startsWith("'") && !/^[lrwy]$/.test(y)

      if (!isDenseCluster) {
        // Check if this is a colon pattern and if we should use it
        if (x.includes(':')) {
          // Look ahead to see what follows
          const nextChunkIndex = i + count

          if (nextChunkIndex < chunks.length) {
            const nextChunk = chunks[nextChunkIndex]

            // Only split if next is a vowel
            if (nextChunk?.type !== 'vowel') {
              // Check if splitting would allow a better match. For
              // example, 'l:d followed by j could be 'l + dj.
              const colonParts = x.split(':')

              if (colonParts.length === 2) {
                const rightPart = colonParts[1]!
                const potentialCluster = rightPart + nextChunk?.value

                // Skip this match to allow splitting into a start
                // consonant.
                if (startConsonantStripped.has(potentialCluster)) {
                  continue
                }
              }

              // Don't split - treat as full consonant
              span.push({
                chunk,
                match: x,
                form: ClusterType.FULL_CONSONANT,
              })
              i += count
              break
            }
            // If next is vowel, skip this full consonant match
            // to allow potential splitting later
          } else {
            // At end of word, don't split
            span.push({
              chunk,
              match: x,
              form: ClusterType.FULL_CONSONANT,
            })
            i += count
            break
          }
        } else {
          // No colon, normal match
          span.push({
            chunk,
            match: x,
            form: ClusterType.FULL_CONSONANT,
          })
          i += count
          break
        }
      }
    }

    if (span.length) {
      list.push(span)
      continue
    }

    for (const { cluster: x, count } of clusterMatches(
      startConsonantTrie,
      frame,
      chunks,
      i,
    )) {
      span.push({
        chunk: chunks.slice(i, i + count),
        match: x,
        form: ClusterType.START_CONSONANT,
      })
      i += count
      break
    }

    for (const { cluster: x, count } of clusterMatches(
      vowelTrie,
      frame,
      chunks,
      i,
    )) {
      span.push({
        chunk: chunks.slice(i, i + count),
        match: x,
        form: ClusterType.VOWEL,
      })
      i += count
      break
    }

    let matched = false

    // Check if any dense full consonant would match before trying end consonants
    let longerDenseMatch: {
      chunk: Segment[]
      match: string
      length: number
    } | null = null

    for (const { cluster: fc, count } of clusterMatches(
      fullConsonantTrie,
      frame,
      chunks,
      i,
    )) {
      const fcNormalized = fc.replace(/:/g, '')
      const isDenseCluster =
        fcNormalized.length >= 2 &&
        !fcNormalized.startsWith("'") &&
        !/^[lrwy]$/.test(fcNormalized)

      if (isDenseCluster) {
        if (!longerDenseMatch || count > longerDenseMatch.length) {
          longerDenseMatch = {
            chunk: chunks.slice(i, i + count),
            match: fc,
            length: count,
          }
        }
      }
    }

    // Check end consonants but prefer longer dense matches
    let endConsonantMatch: {
      chunk: Segment[]
      match: string
      length: number
    } | null = null

    for (const { cluster: x, count } of clusterMatches(
      endConsonantTrie,
      frame,
      chunks,
      i,
    )) {
      if (!endConsonantMatch || count > endConsonantMatch.length) {
        endConsonantMatch = {
          chunk: chunks.slice(i, i + count),
          match: x,
          length: count,
        }
      }
    }

    // Choose the longer match
    if (longerDenseMatch && endConsonantMatch) {
      if (longerDenseMatch.length > endConsonantMatch.length) {
        // Use dense full consonant
        span.push({
          chunk: longerDenseMatch.chunk,
          match: longerDenseMatch.match,
          form: ClusterType.FULL_CONSONANT,
        })
        i += longerDenseMatch.length
        matched = true
      } else {
        // Use end consonant
        span.push({
          chunk: endConsonantMatch.chunk,
          match: endConsonantMatch.match,
          form: ClusterType.END_CONSONANT,
        })
        i += endConsonantMatch.length
        matched = true
      }
    } else if (longerDenseMatch) {
      span.push({
        chunk: longerDenseMatch.chunk,
        match: longerDenseMatch.match,
        form: ClusterType.FULL_CONSONANT,
      })
      i += longerDenseMatch.length
      matched = true
    } else if (endConsonantMatch) {
      span.push({
        chunk: endConsonantMatch.chunk,
        match: endConsonantMatch.match,
        form: ClusterType.END_CONSONANT,
      })
      i += endConsonantMatch.length
      matched = true
    }

    if (!matched && span.length === 0) {
      // Only process single consonants if we don't have content in span
      // This ensures we complete the current span before starting a new one
      for (const { cluster: x, count } of clusterMatches(
        consonantTrie,
        frame,
        chunks,
        i,
      )) {
        span.push({
          chunk: chunks.slice(i, i + count),
          match: x,
          form: ClusterType.CONSONANT,
        })
        i += count
        break
      }
    }

    // If no matches found yet, try dense consonant clusters as fallback
    if (span.length === 0) {
      for (const { cluster: x, count } of clusterMatches(
        fullConsonantTrie,
        frame,
        chunks,
        i,
      )) {
        const y = x.replace(/:/g, '')

        // Only match dense clusters (skip what we already tried above)
        const isDenseCluster =
          y.length >= 2 && !y.startsWith("'") && !/^[lrwy]$/.test(y)

        if (isDenseCluster) {
          span.push({
            chunk: chunks.slice(i, i + count),
            match: x,
            form: ClusterType.FULL_CONSONANT,
          })
          i += count
          break
        }
      }
    }

    if (span.length) {
      list.push([...span])
    } else {
      const text = chunks
        .slice(i)
        .map(x => x.value)
        .join('')

      throw new Error(`No match found for ${text}`)
    }
  }

  // First pass: split clusters with colons when appropriate
  i = 0

  while (i < list.length) {
    const node = list[i]!

    for (let j = 0; j < node.length; j++) {
      const span = node[j]!

      // Check if this span has a colon (can be split)
      if (/:/.exec(span.match)) {
        // Check if there's a following span
        const nextSpan = node[j + 1] ?? list[i + 1]?.[0]

        // Split if:
        // 1. This is an END_CONSONANT followed by a vowel
        // 2. Or other conditions where splitting makes sense
        if (
          span.form === ClusterType.END_CONSONANT &&
          nextSpan?.form === ClusterType.VOWEL
        ) {
          const [leftPart, rightPart] = span.match.split(':')

          // Find where to split the chunks
          const left: Segment[] = []
          const right: Segment[] = []

          let k = 0
          let text = ''
          let array = left

          while (k < span.chunk.length) {
            const mark = span.chunk[k]!

            text += mark.value
            array.push(mark)

            if (text === leftPart && !right.length) {
              array = right
            }

            k++
          }

          if (right.length) {
            // Replace the original span with two new spans
            node.splice(
              j,
              1,
              {
                ...span,
                chunk: left,
                match: leftPart!,
                form: ClusterType.END_CONSONANT,
              },
              {
                ...span,
                chunk: right,
                match: rightPart!,
                form: ClusterType.CONSONANT,
              },
            )
            j++ // Skip the newly inserted span
          }
        }
      }
    }

    i++
  }

  // Second pass: handle adjacent spans (original logic)
  i = 0

  while (i < list.length) {
    const last = list[i - 1]
    const node = list[i++]!

    if (!last) {
      continue
    }

    const lastSpan = last[last.length - 1]!
    const nodeSpan = node[0]!

    // can split - but only if followed by vowel
    if (
      /:/.exec(lastSpan.match) &&
      nodeSpan.form === ClusterType.VOWEL
    ) {
      // const nodeSpanText = nodeSpan.chunk[0]!.value!

      const left: Segment[] = []
      const right: Segment[] = []

      const [a] = lastSpan.match.split(':')

      let j = 0
      let text = ''
      let array = left

      while (j < lastSpan.chunk.length) {
        const mark = lastSpan.chunk[j]!

        text += mark.value
        array.push(mark)

        if (text === a && !right.length) {
          array = right
        }

        j++
      }

      if (right.length) {
        nodeSpan.chunk.unshift(...right)
      }

      lastSpan.chunk = left
    }
  }

  const clusters: Cluster[] = list.flat().map(span => {
    // Check if any mark in the chunk has emphasis
    const hasEmphasis = span.chunk.some(mark => mark.emphasis === true)

    if (span.form === ClusterType.PUNCTUATION) {
      const result: Cluster = {
        form: 'punctuation' as ClusterKey,
        text: span.chunk.map(serialize).join(''),
        code: span.match,
      }

      if (hasEmphasis) {
        result.emphasis = true
      }

      return result
    }

    const cluster = CLUSTER_MAP[span.form]!
    const form = CLUSTER_KEY[span.form]!

    const result: Cluster = {
      form,
      text: span.chunk.map(serialize).join(''),
      code: cluster[span.match]!,
    }

    if (hasEmphasis) {
      result.emphasis = true
    }

    return result
  })

  return clusters
}

export function serialize(mark: Segment) {
  const text: string[] = []

  if (mark.value) {
    text.push(mark.value)
  }

  if (mark.click) {
    text.push(`*`)
  }

  // if (mark.dentalization) {
  // }
  if (mark.ejection) {
    text.push(`!`)
  }

  if (mark.implosion) {
    text.push(`?`)
  }

  if (mark.nasalization) {
    text.push(`&`)
  }

  if (mark.tone) {
    switch (mark.tone) {
      case 'extra high':
        text.push(`++`)
        break
      case 'high':
        text.push(`+`)
        break
      case 'low':
        text.push(`-`)
        break
      case 'extra low':
        text.push(`--`)
        break
      case 'rising':
        text.push(`/`)
        break
      case 'rising 2':
        text.push(`//`)
        break
      case 'falling':
        text.push(`\\`)
        break
      case 'falling 2':
        text.push(`\\\\`)
        break
      case 'rising falling':
        text.push(`/\\`)
        break
      case 'falling rising':
        text.push(`\\/`)
        break
    }
  }

  if (mark.elongation) {
    text.push(`_`)
  }

  if (mark.truncation) {
    text.push('!')
  }

  if (mark.emphasis) {
    text.push(`^`)
  }

  if (mark.dentalization) {
    text.push(`~`)
  }

  if (mark.pharyngealization) {
    text.push(`Q~`)
  }

  if (mark.velarization) {
    text.push(`G~`)
  }

  if (mark.palatalization) {
    text.push(`y~`)
  }

  if (mark.labialization) {
    text.push(`w~`)
  }

  if (mark.aspiration) {
    text.push(`h~`)
  }

  if (mark.stop) {
    text.push(`.`)
  }

  if (mark.tense) {
    text.push(`@`)
  }
  // if (mark.voicelessness) {
  // }

  return text.join('')
}

// Main function that orchestrates the whole process
export default function chunk(string: string) {
  // Step 1: Parse string into marks
  const marks = readSegments(string)

  // Step 2: Group marks into clusters
  const clusters = groupSegmentsIntoClusters(marks)

  // Step 3: Group clusters into syllables
  const syllables = groupClustersIntoSyllables(clusters)

  return { marks, syllables, clusters }
}

// Backward compatibility
export function cluster(string: string) {
  return chunk(string).clusters
}

// Step 3: Group clusters into syllables
export function groupClustersIntoSyllables(clusters: Cluster[]) {
  let i = 0

  const syllables: Syllable[] = []

  while (i < clusters.length) {
    const cluster = clusters[i]!

    // Skip punctuation (spaces, etc) - they don't belong in syllables
    if (cluster.form === ClusterKey.PUNCTUATION) {
      i++
      continue
    }

    let syllable: Syllable = {
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

          // Skip punctuation (spaces, etc)
          if (next.form === ClusterKey.PUNCTUATION) {
            i++
            continue
          }

          // If next is a vowel, stop - it starts a new syllable
          if (next.form === ClusterKey.VOWEL) {
            break
          }

          // Check if we have an END_CONSONANT
          if (next.form === ClusterKey.END_CONSONANT) {
            syllable.clusters.push(next)
            i++
            // Usually END_CONSONANT ends the syllable
            break
          }

          // Check if this consonant should be part of this syllable or the next
          const nextNext = clusters[i + 1]

          if (nextNext?.form === ClusterKey.VOWEL) {
            // If there's a vowel after this consonant, check if we should split
            if (next.form === ClusterKey.FULL_CONSONANT) {
              // FULL_CONSONANT always starts its own syllable
              break
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
            // But first check if it's a FULL_CONSONANT - those should start their own syllable
            if (next.form === ClusterKey.FULL_CONSONANT) {
              // FULL_CONSONANT starts its own syllable, don't add to current
              break
            }

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
      // falls through

      case ClusterKey.START_CONSONANT: {
        // Start syllable with consonant(s)
        syllable.clusters.push(cluster)
        i++

        // Look for vowel
        while (
          i < clusters.length &&
          clusters[i]!.form !== ClusterKey.VOWEL
        ) {
          const next = clusters[i]!

          // Skip punctuation (spaces, etc)
          if (next.form === ClusterKey.PUNCTUATION) {
            i++
            continue
          }

          // Don't add START_CONSONANT to current syllable if we already have any clusters
          // This ensures each START_CONSONANT begins its own syllable in consonant sequences
          if (
            next.form === ClusterKey.START_CONSONANT &&
            syllable.clusters.length > 0
          ) {
            break
          }

          // For consonant-only sequences, handle END_CONSONANT specially
          if (next.form === ClusterKey.END_CONSONANT) {
            // Check if we should start a new syllable with this END_CONSONANT
            // If we already have only single consonants, break before END_CONSONANT
            let hasOnlySingleConsonants = true

            for (const cluster of syllable.clusters) {
              if (cluster.form !== ClusterKey.CONSONANT) {
                hasOnlySingleConsonants = false
                break
              }
            }

            if (
              hasOnlySingleConsonants &&
              syllable.clusters.length >= 2
            ) {
              // Break before END_CONSONANT to let it start its own syllable
              break
            }

            // Otherwise add the END_CONSONANT
            syllable.clusters.push(next)
            i++

            // Look ahead to see if a vowel is coming
            let hasUpcomingVowel = false

            for (let j = i; j < clusters.length && j < i + 3; j++) {
              if (clusters[j]?.form === ClusterKey.VOWEL) {
                hasUpcomingVowel = true
                break
              }
            }

            // Always break after END_CONSONANT in consonant-only sequences
            if (!hasUpcomingVowel) {
              break
            }

            continue
          }

          syllable.clusters.push(next)
          i++

          // Special handling for START_CONSONANT + single consonant pattern
          // If we have a START_CONSONANT followed by a single consonant,
          // check if we should break based on what follows
          if (
            syllable.clusters.length >= 2 &&
            syllable.clusters[0]!.form === ClusterKey.START_CONSONANT &&
            syllable.clusters[syllable.clusters.length - 1]!.form ===
              ClusterKey.CONSONANT
          ) {
            // Look ahead to see what's coming
            if (i < clusters.length) {
              const upcomingCluster = clusters[i]!

              // If we see another consonant cluster coming and no vowel nearby,
              // we should break here to start a new syllable
              if (
                upcomingCluster.form !== ClusterKey.VOWEL &&
                upcomingCluster.form !== ClusterKey.PUNCTUATION
              ) {
                // Check if there's a pattern suggesting we should break
                // For example: ly + q followed by more consonants
                let shouldBreak = false

                // If we have exactly START_CONSONANT + single consonant,
                // and more consonants follow, break here
                if (syllable.clusters.length === 2) {
                  // Look further ahead to see if we have multiple consonants coming
                  let consonantCount = 0

                  for (
                    let j = i;
                    j < clusters.length && j < i + 4;
                    j++
                  ) {
                    const future = clusters[j]

                    if (
                      !future ||
                      future.form === ClusterKey.PUNCTUATION
                    ) {
                      continue
                    }

                    if (future.form === ClusterKey.VOWEL) {
                      break
                    }

                    consonantCount++
                  }

                  // If we have 2+ more consonants coming, break here
                  if (consonantCount >= 2) {
                    shouldBreak = true
                  }
                }

                if (shouldBreak) {
                  break
                }
              }
            }
          }

          // Also handle case where we're accumulating too many single consonants
          // If current syllable has START_CONSONANT + 2 single consonants, break
          if (syllable.clusters.length >= 3) {
            let singleConsonantCount = 0
            let hasStartConsonant = false

            for (const c of syllable.clusters) {
              if (c.form === ClusterKey.START_CONSONANT) {
                hasStartConsonant = true
              } else if (c.form === ClusterKey.CONSONANT) {
                singleConsonantCount++
              }
            }

            // If we have START_CONSONANT + 2 single consonants already,
            // don't add more - break here
            if (hasStartConsonant && singleConsonantCount >= 2) {
              // Put back the consonant we just added
              syllable.clusters.pop()
              i--
              break
            }
          }

          // If we just added ' and have at least one other consonant, this could be a complete syllable
          if (next.text === "'") {
            // If we have other consonants and the last one before ' was a START_CONSONANT,
            // then the START_CONSONANT + ' should be its own syllable
            if (syllable.clusters.length >= 2) {
              const prevCluster =
                syllable.clusters[syllable.clusters.length - 2]

              if (prevCluster?.form === ClusterKey.START_CONSONANT) {
                // Remove the ' we just added
                syllable.clusters.pop()
                i--

                // Remove the START_CONSONANT
                const startConsonant = syllable.clusters.pop()!

                // If we still have clusters, keep them as a syllable
                if (syllable.clusters.length > 0) {
                  // Check if any cluster has emphasis
                  if (
                    syllable.clusters.some(c => c.emphasis === true)
                  ) {
                    syllable.emphasis = true
                  }

                  syllables.push(syllable)
                }

                // Start new syllable with the START_CONSONANT
                const newSyllable: Syllable = {
                  clusters: [startConsonant, next],
                }

                // Check if either cluster has emphasis
                if (startConsonant.emphasis || next.emphasis) {
                  newSyllable.emphasis = true
                }

                syllables.push(newSyllable)
                i++
                // Start fresh for next syllable
                syllable = { clusters: [] }
                break
              }
            }

            // Otherwise, check if next cluster is a consonant (not vowel) to complete this syllable
            if (
              syllable.clusters.length > 1 &&
              i < clusters.length &&
              clusters[i]!.form !== ClusterKey.VOWEL
            ) {
              break
            }
          }
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

            // Skip punctuation (spaces, etc)
            if (next.form === ClusterKey.PUNCTUATION) {
              i++
              continue
            }

            if (next.form === ClusterKey.VOWEL) {
              break
            }

            // Check if we have an END_CONSONANT
            if (next.form === ClusterKey.END_CONSONANT) {
              syllable.clusters.push(next)
              i++
              // Usually END_CONSONANT ends the syllable
              break
            }

            const nextNext = clusters[i + 1]

            if (nextNext?.form === ClusterKey.VOWEL) {
              if (next.form === ClusterKey.FULL_CONSONANT) {
                // FULL_CONSONANT always starts its own syllable
                break
              } else if (next.form === ClusterKey.START_CONSONANT) {
                break
              } else {
                // Regular consonant - if followed by vowel, it starts new syllable
                break
              }
            } else {
              // Check if it's a FULL_CONSONANT - those should start their own syllable
              if (next.form === ClusterKey.FULL_CONSONANT) {
                // FULL_CONSONANT starts its own syllable, don't add to current
                break
              }

              syllable.clusters.push(next)
              i++
            }
          }
        } else {
          // No vowel found - we have a consonant-only syllable
          // The consonants we've collected so far form a syllabic unit
          // Check if we should end this syllable based on what's next

          // If we have a reasonable consonant cluster, end the syllable when:
          // 1. We hit an END_CONSONANT
          // 2. We already have a START_CONSONANT and hit another START_CONSONANT
          // 3. We hit a FULL_CONSONANT (those always start their own syllable)

          if (syllable.clusters.length > 0) {
            const lastCluster =
              syllable.clusters[syllable.clusters.length - 1]!

            // If the last cluster is an END_CONSONANT, this syllable is complete
            if (lastCluster.form === ClusterKey.END_CONSONANT) {
              // Syllable is complete with consonants only
            }
            // If we have at least 2 consonants and see patterns suggesting syllable end
            else if (syllable.clusters.length >= 2) {
              // Look ahead to see if we should end here
              if (i < clusters.length) {
                const next = clusters[i]!

                if (
                  next.form === ClusterKey.START_CONSONANT ||
                  next.form === ClusterKey.FULL_CONSONANT
                ) {
                  // Next cluster starts a new syllable
                }
              }
            }
          }
        }

        break
      }

      case ClusterKey.END_CONSONANT: {
        // END_CONSONANT always ends a syllable - never add following consonants
        syllable.clusters.push(cluster)
        i++
        break
      }
    }

    if (syllable.clusters.length > 0) {
      // Check if any cluster in the syllable has emphasis
      if (syllable.clusters.some(c => c.emphasis === true)) {
        syllable.emphasis = true
      }

      syllables.push(syllable)
    }
  }

  return syllables
}
