import { segment as segmentTalk } from '../string/sound'
import { Trie, TrieBuilder } from '../trie'
import { CLUSTERS } from './clusters'
import PHONES from '../../base/phones.json'
import MODIFIERS from '../../base/modifiers.json'
import FEATURE_DATA from '../../base/talk/features.json'
import PUNCTUATION_DATA from '../../base/talk/punctuation.json'

// The vowel-mark axes, matching how talk builds vowel glyphs. Every
// vowel takes a variant, nasal, syllabic, tone, duration, and accent
// slot, and the segment table below is generated over their product.
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
  /**
   * The exact talk this segment was read from.
   *
   * WHY IT IS CARRIED RATHER THAN REBUILT. `serialize` used to spell a
   * segment back out of its feature flags, which meant a cluster text was a
   * RECONSTRUCTION and not the input. Any modifier the flag table did not
   * name simply vanished, and the flags themselves still spelled in v1's
   * suffixes, so `k<wh>` came back as `k`. Carrying the text makes the
   * split lossless by construction: the clusters run together are always
   * the word they came from.
   */
  talk?: string
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

// A punctuation/feature record carries a `talk` key plus the segment
// fields. Feature records may also carry a `form` category ('tone') that is
// not a segment field, so it is stripped when the runtime map is built.
type SegmentRecord = Segment & { talk: string }
type FeatureRecord = Omit<Segment, 'form'> & {
  talk: string
  form?: string
}

const PUNCTUATION = PUNCTUATION_DATA as unknown as SegmentRecord[]
const FEATURE = FEATURE_DATA as unknown as FeatureRecord[]

// The base talk alphabet comes from the sound inventory (phones.json), so
// each letter is declared in exactly one place. Consonant letters are every
// single-character consonant except retroflex D (ɖ), which talk folds into
// its dental spelling. Vowel glyphs are the single-character vowels (their
// $ variant is a mark applied during generation).
type PhoneEntry = { talk: string; form: 'consonant' | 'vowel' }

const phones = PHONES as PhoneEntry[]

function baseLetters(want: 'consonant' | 'vowel'): string[] {
  const out: string[] = []

  for (const phone of phones) {
    const glyph =
      want === 'vowel' ? phone.talk.replace('$', '') : phone.talk

    // A LETTER IS ONE SOUND, NOT ONE CHARACTER. The test was
    // `glyph.length !== 1`, which held while every base was a single
    // letter and silently dropped every one spelled with a marker the
    // moment they arrived: `$n` is the velar nasal written two characters,
    // and leaving it out meant the chunker could not read `si$nk` at all.
    //
    // A modified sound is still excluded, since those are built from a
    // base plus a bracketed run rather than being bases themselves.
    if (phone.form !== want || glyph.includes('<') || glyph === 'D') {
      continue
    }

    // One sound: a letter, optionally carrying a `$` or `~` variant marker
    // and a `!` click marker. Anything longer is a cluster.
    if (!/^[$~]?.[!]?$/u.test(glyph)) {
      continue
    }

    if (!out.includes(glyph)) {
      out.push(glyph)
    }
  }

  return out
}

const CONSONANT_LETTERS = baseLetters('consonant')
const BASE_VOWEL_GLYPHS = baseLetters('vowel')

// The consonant feature flags. A modified consonant is a base letter plus a
// modifier suffix that contributes one of these. (Note `!` is ejection on a
// consonant but truncation on a vowel mark, so consonant modifiers are kept
// separate from the vowel EXTRA_FEATURES table.)
type FlagKey =
  | 'click'
  | 'stop'
  | 'tense'
  | 'ejection'
  | 'dentalization'
  | 'voicelessness'
  | 'aspiration'
  | 'labialization'
  | 'palatalization'
  | 'velarization'
  | 'pharyngealization'

// Mark-only merges: a modifier that stands alone as its own segment.
const MERGE_MARKS: { talk: string; flag: FlagKey }[] = [
  { talk: 'h!', flag: 'voicelessness' },
  { talk: 'h~', flag: 'aspiration' },
  { talk: 'w~', flag: 'labialization' },
  { talk: 'y~', flag: 'palatalization' },
  { talk: 'G~', flag: 'velarization' },
  { talk: 'Q~', flag: 'pharyngealization' },
]

// The base letters each modifier suffix composes with, in the order the
// segments are inserted. `.`(stop) and `@`(tense) share the same obstruent
// set. Every modified variant is inserted before the plain base letters so
// readSegments matches the longer key first.
const STOP_TENSE_BASES = [
  'n',
  'q',
  'g',
  'd',
  'b',
  'p',
  't',
  'k',
  's',
  'f',
  'v',
  'z',
  'j',
  'x',
  'c',
]
const EJECT_BASES = [...STOP_TENSE_BASES, 'C', 'y', 'w', 'Q', 'l', 'r']
const CONSONANT_FAMILIES: {
  suffix: string
  flag: FlagKey
  bases: string[]
}[] = [
  { suffix: '*', flag: 'click', bases: ['l', 't', 'd', 'k', 'p'] },
  { suffix: '.', flag: 'stop', bases: STOP_TENSE_BASES },
  { suffix: '@', flag: 'tense', bases: STOP_TENSE_BASES },
  { suffix: '!', flag: 'ejection', bases: EJECT_BASES },
  { suffix: '~', flag: 'dentalization', bases: ['n', 't', 'd'] },
]

// The vowel-mark feature table: each mark (tone, tense, duration, etc.)
// maps to the segment flags it contributes. The `form` category on tone
// records is metadata, not a segment flag, so it is left out here.
const EXTRA_FEATURES: Record<string, Segment> = {}

for (const record of FEATURE) {
  const flags: Segment = {}

  for (const key of Object.keys(record)) {
    if (key === 'talk' || key === 'form') {
      continue
    }

    ;(flags as Record<string, unknown>)[key] = (
      record as Record<string, unknown>
    )[key]
  }

  EXTRA_FEATURES[record.talk] = flags
}

// The segment table, keyed by talk spelling. Insertion order matters:
// readSegments matches the first key that prefixes the input, so mark-only
// merges and modified variants (h!, n., n@) must precede their base letters
// (h, n). Punctuation and the modifier families are inserted first; vowels
// are generated last over the mark product.
const SEGMENT: Record<string, Segment> = {}

for (const { talk, ...seg } of PUNCTUATION) {
  SEGMENT[talk] = seg
}

for (const { talk, flag } of MERGE_MARKS) {
  SEGMENT[talk] = { [flag]: true }
}

for (const { suffix, flag, bases } of CONSONANT_FAMILIES) {
  for (const base of bases) {
    const seg: Segment = { type: 'consonant', value: base }

    seg[flag] = true
    SEGMENT[`${base}${suffix}`] = seg
  }
}

for (const base of CONSONANT_LETTERS) {
  SEGMENT[base] = { type: 'consonant', value: base }
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
    // COUNTED IN SOUNDS, NOT CHARACTERS. `count` says how many chunks the
    // cluster consumes, and a chunk is a sound. That was the string length,
    // which held only while every sound was one letter: `nk` was two of
    // each. A sound is now written with a marker where it needs one, so
    // `$nk` is three characters and two sounds, and counting characters
    // asked for one chunk too many and never matched.
    //
    // The markers are `$` and `~`, which choose among a letter's variants,
    // and `!` which makes a click. None is a sound on its own, so removing
    // them leaves one character per sound.
    const count = vowel
      ? cluster.replace(/[$~!]/g, '').length
      : cluster.replace(/:/g, '').replace(/[$~!]/g, '').length
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

  for (const chunk of chunks) {
    offsetOfIndex.push(text.length)
    text += chunk.value ?? ''
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
  const offset = frame.offsetOfIndex[i]
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

/**
 * The feature a modifier carries, as the flag this file reasons with.
 *
 * The syllabifier asks whether a segment is aspirated or clicked, not which
 * characters spell it, so the tokenizer's feature names are translated once
 * here and nothing downstream looks at a letter again.
 */

/** Modifiers by talk spelling, longest first so `v-` is read before `v`. */

const MODIFIER_BY_TALK = [...MODIFIERS].sort(
  (a, b) => b.talk.length - a.talk.length,
)

const FLAG_OF_FEATURE: Record<string, FlagKey> = {
  aspirated: 'aspiration',
  ejective: 'ejection',
  dental: 'dentalization',
  labialized: 'labialization',
  palatalized: 'palatalization',
  pharyngealized: 'pharyngealization',
  velarized: 'velarization',
  voiceless: 'voicelessness',
}

// Step 1: Read the string as sounds.
//
// TOKENIZED, NOT PATTERN-MATCHED. This walked a `SEGMENT` table built by
// crossing every base letter with every mark, which produced spellings no
// phone table ever held: `$` was joined to a vowel as a SUFFIX, so the
// table contained `i$`, and `si$nk` matched it greedily and came out
// `s | i$ | n | k` rather than `s | i | $n | k`. A generated alphabet can
// invent a letter; a tokenizer over real sounds cannot.
//
// `segment` is the same scanner the rest of the library reads talk with, so
// there is now one alphabet rather than two that have to agree.
export function readSegments(string: string) {
  const chunks: Segment[] = []

  for (const sound of segmentTalk(string)) {
    const base = sound.base

    if (!base) {
      // STRESS BELONGS TO THE SOUND BEFORE IT. `^` is a mark, not a sound,
      // and the tokenizer hands it back on its own because it has no base.
      // Filed as punctuation it would break the nucleus in two and drop the
      // mark from the cluster text, so it is folded onto the segment it
      // modifies instead.
      if (sound.talk === '^') {
        const last = chunks[chunks.length - 1]

        if (last && last.type !== 'punctuation') {
          last.emphasis = true
          last.talk = (last.talk ?? '') + sound.talk
          continue
        }
      }

      // A passthrough: punctuation, a space, a digit. Carried with its own
      // text so nothing is dropped, and typed so the grouper skips it.
      chunks.push({ type: 'punctuation', value: sound.talk, talk: sound.talk })
      continue
    }

    // A DERIVED PHONE CARRIES ITS MARKS IN ITS OWN SPELLING. `m̥` is one
    // entry in the phone table spelled `m<v->`, so the tokenizer hands it
    // back as a base rather than as `m` plus voiceless. The grouper reasons
    // about a LETTER and a set of flags, so the bracket is opened here and
    // its marks join the ones the sound already carries.
    const at = base.talk.indexOf('<')
    const letter = at === -1 ? base.talk : base.talk.slice(0, at)
    const inside = at === -1 ? '' : base.talk.slice(at + 1, -1)

    const seg: Segment = {
      type: base.form as 'consonant' | 'vowel',
      value: letter,
      talk: sound.talk,
    }

    for (const one of [...sound.pre, ...sound.modifiers]) {
      const flag = FLAG_OF_FEATURE[one.feature]

      if (flag) {
        seg[flag] = true
      }
    }

    for (const one of MODIFIER_BY_TALK) {
      if (inside.includes(one.talk)) {
        const flag = FLAG_OF_FEATURE[one.feature]

        if (flag) {
          seg[flag] = true
        }
      }
    }

    chunks.push(seg)
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

    const chunk = chunks[i]

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
                const rightPart = colonParts[1]
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
    const node = list[i]

    for (let j = 0; j < node.length; j++) {
      const span = node[j]

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
            const mark = span.chunk[k]

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
                match: leftPart,
                form: ClusterType.END_CONSONANT,
              },
              {
                ...span,
                chunk: right,
                match: rightPart,
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
    const node = list[i++]

    if (!last) {
      continue
    }

    const lastSpan = last[last.length - 1]
    const nodeSpan = node[0]

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
        const mark = lastSpan.chunk[j]

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

    const cluster = CLUSTER_MAP[span.form]
    const form = CLUSTER_KEY[span.form]

    const result: Cluster = {
      form,
      text: span.chunk.map(serialize).join(''),
      code: cluster[span.match],
    }

    if (hasEmphasis) {
      result.emphasis = true
    }

    return result
  })

  return clusters
}

export function serialize(mark: Segment) {
  // The text it was read from, when there is one. The flag-based spelling
  // below is the fallback for a segment built by hand rather than by the
  // tokenizer, and it still writes v1's suffixes.
  if (mark.talk !== undefined) {
    return mark.talk
  }

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
    const cluster = clusters[i]

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
          const next = clusters[i]

          // A WORD BREAK IS NOT A SYLLABLE BREAK. Spoken French runs a coda
          // onto the next word: `ʃu də bʁy.sɛl` is `xu.dUb.$G$i.sEl`, with
          // the `b` of Bruxelles closing the syllable that starts in `de`.
          // That is enchaînement, and it is the right answer, so punctuation
          // is stepped over here rather than ending the gather.
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
          clusters[i].form !== ClusterKey.VOWEL
        ) {
          const next = clusters[i]

          // A WORD BREAK IS NOT A SYLLABLE BREAK. Spoken French runs a coda
          // onto the next word: `ʃu də bʁy.sɛl` is `xu.dUb.$G$i.sEl`, with
          // the `b` of Bruxelles closing the syllable that starts in `de`.
          // That is enchaînement, and it is the right answer, so punctuation
          // is stepped over here rather than ending the gather.
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
            syllable.clusters[0].form === ClusterKey.START_CONSONANT &&
            syllable.clusters[syllable.clusters.length - 1].form ===
              ClusterKey.CONSONANT
          ) {
            // Look ahead to see what's coming
            if (i < clusters.length) {
              const upcomingCluster = clusters[i]

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
              clusters[i].form !== ClusterKey.VOWEL
            ) {
              break
            }
          }
        }

        // Add the vowel if found
        if (
          i < clusters.length &&
          clusters[i].form === ClusterKey.VOWEL
        ) {
          syllable.clusters.push(clusters[i])
          i++

          // Look for trailing consonants
          while (i < clusters.length) {
            const next = clusters[i]

            // Stepped over, not a break: see the note above on enchaînement.
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
              syllable.clusters[syllable.clusters.length - 1]

            // If the last cluster is an END_CONSONANT, this syllable is complete
            if (lastCluster.form === ClusterKey.END_CONSONANT) {
              // Syllable is complete with consonants only
            }
            // If we have at least 2 consonants and see patterns suggesting syllable end
            else if (syllable.clusters.length >= 2) {
              // Look ahead to see if we should end here
              if (i < clusters.length) {
                const next = clusters[i]

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
