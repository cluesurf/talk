// Capture the TypeScript build's input/output over a broad corpus, so the Rust
// port can be checked against it call for call. Run from deck/rust with:
//
//   npx tsx test/parity.ts
//
// The corpus is built by enumeration, never sampling, so a rerun on unchanged
// data produces a byte-identical fixture.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  enumerateSounds,
  ipaToTalk,
  machine,
  readable,
  segment,
  talkToIpa,
} from '../../typescript/code'
import { syllables } from '../../typescript/code/syllable'
import PHONES from '../../typescript/base/phones.json'
import MODIFIERS from '../../typescript/base/modifiers.json'
import SYLLABLE_FIXTURE from '../../typescript/test/fixture/syllable-parity.json'

const HERE = dirname(fileURLToPath(import.meta.url))

const phones = PHONES as { ipa: string; talk: string; form: string }[]
const modifiers = MODIFIERS as { ipa: string; talk: string }[]

// ─── the corpus ──────────────────────────────────────────────────────────────

const unique = (list: string[]) => [...new Set(list)].filter(Boolean)

const consonantLetters = unique(
  phones.filter(p => p.form === 'consonant' && p.talk.length === 1).map(p => p.talk),
)
const vowelGlyphs = unique(
  phones
    .filter(p => p.form === 'vowel')
    .map(p => p.talk.replace('$', ''))
    .filter(g => g.length === 1),
)
const vowelMarks = ['', '$', '&', '@', '^', '_', '!', '+', '++', '-', '--', '&+_', '@+', '&^_+']

// Systematic words: every consonant against every vowel, then the same with a
// coda, then two-syllable forms. Enumerated, so the set is stable.
function generatedWords(): string[] {
  const words: string[] = []

  for (const c of consonantLetters) {
    for (const v of vowelGlyphs) {
      words.push(`${c}${v}`)
      words.push(`${c}${v}${c}`)
      words.push(`${c}${v}${c}${v}`)
    }
  }

  for (const v of vowelGlyphs) {
    for (const mark of vowelMarks) {
      words.push(`${v}${mark}`)
      words.push(`t${v}${mark}k`)
    }
  }

  // Consonant modifiers stacked onto a base, which is where chunking is
  // hardest.
  for (const c of consonantLetters) {
    for (const suffix of ['h~', 'y~', 'w~', 'G~', 'Q~', 'h!', '!', '*', '.', '@', '~']) {
      words.push(`${c}${suffix}a`)
      words.push(`a${c}${suffix}`)
    }
  }

  return words
}

const talkCorpus = unique([
  '',
  ...phones.map(p => p.talk),
  ...enumerateSounds().map(s => s.talk),
  ...generatedWords(),
  ...(SYLLABLE_FIXTURE as { word: string }[]).map(entry => entry.word),
  'th~a',
  'kw~asQ~o',
  'a&+_',
  'p*at*',
  'mh!im',
  'txando^',
  'txya@+a-a++u',
  't!arEba',
  'siqk',
  'aiyuQaK',
  'HEth~Ah',
  "s'oQya&te",
  "batO_'aH",
  'ma na',
  '=. 7',
  'ma=.3',
  'mama',
  'ieaou',
  'mn',
  't.',
  'a/',
  'many~a',
  'bbh!',
  // Deliberately unmapped characters, to check the passthrough path.
  'zzz?',
  'qx',
  'aéb',
  '\u{1DF0A}',
])

// IPA inputs: each phone and modifier on its own, each phone with each
// consonant modifier attached, plus stress and known multi-sound words.
function ipaCorpus(): string[] {
  const list: string[] = ['']

  for (const phone of phones) {
    list.push(phone.ipa)

    for (const modifier of modifiers) {
      if (modifier.ipa) {
        list.push(`${phone.ipa}${modifier.ipa}`)
      }
    }
  }

  // Consecutive triples, so multi-sound scanning is exercised in order.
  for (let i = 0; i + 2 < phones.length; i += 1) {
    list.push(phones[i]!.ipa + phones[i + 1]!.ipa + phones[i + 2]!.ipa)
  }

  list.push(
    'tʰa',
    'kʷasˤo',
    'ˈmama',
    'ãtu',
    'sˤuːl',
    'nʲokʰ',
    'tʰʷ',
    'tʷʰ',
    'ʔeˈmet',
    'uˈǁɔːlɔ',
    'ɬaɡaˈniːpʰa',
    'ø',
    'œ',
    'ã́',
    'xyz',
    '𝼊a',
    '.?!+- 7',
  )

  return unique(list).concat([''])
}

// ─── the shapes ──────────────────────────────────────────────────────────────

const soundShape = (sound: ReturnType<typeof segment>[number]) => ({
  talk: sound.talk,
  ipa: sound.ipa,
  simple: sound.simple,
  machine: sound.machine,
  kind: sound.kind,
  base: sound.base?.talk ?? null,
  modifiers: sound.modifiers.map(m => m.talk),
  raw: sound.raw === true,
})

const FLAGS = [
  'aspiration',
  'click',
  'dentalization',
  'ejection',
  'elongation',
  'emphasis',
  'implosion',
  'labialization',
  'nasalization',
  'palatalization',
  'pharyngealization',
  'stop',
  'tense',
  'truncation',
  'velarization',
  'voicelessness',
] as const

const markShape = (mark: Record<string, unknown>) => ({
  kind: (mark.type as string | undefined) ?? null,
  value: (mark.value as string | undefined) ?? null,
  tone: (mark.tone as string | undefined) ?? null,
  flags: FLAGS.filter(flag => mark[flag] === true),
})

const clusterShape = (cluster: {
  form: string
  text: string
  code?: string
  emphasis?: boolean
}) => ({
  form: cluster.form,
  text: cluster.text,
  code: cluster.code ?? '',
  emphasis: cluster.emphasis === true,
})

// ─── the fixture ─────────────────────────────────────────────────────────────

const ipaInputs = ipaCorpus()

const fixture = {
  segment: talkCorpus.map(input => ({
    input,
    sounds: segment(input).map(soundShape),
  })),
  convert: talkCorpus.map(input => ({
    input,
    talkToIpa: talkToIpa(input),
    readable: readable(input),
    machine: machine(input),
  })),
  ipaToTalk: ipaInputs.map(input => ({ input, output: ipaToTalk(input) })),
  enumerate: enumerateSounds(),
  syllables: talkCorpus.map(input => {
    try {
      const result = syllables(input) as {
        marks: Record<string, unknown>[]
        clusters: Parameters<typeof clusterShape>[0][]
        syllables: {
          emphasis?: boolean
          clusters: Parameters<typeof clusterShape>[0][]
        }[]
      }

      return {
        input,
        ok: true,
        marks: result.marks.map(markShape),
        clusters: result.clusters.map(clusterShape),
        syllables: result.syllables.map(syllable => ({
          emphasis: syllable.emphasis === true,
          clusters: syllable.clusters.map(clusterShape),
        })),
      }
    } catch {
      return { input, ok: false }
    }
  }),
}

// A talk string indexes by UTF-16 code unit here, so an unknown astral
// character is carried through as two lone surrogates rather than one
// character. Rust indexes by scalar value and emits the character whole. That
// is the one known difference between the builds, so those cases are marked and
// the Rust side asserts its own behaviour for them instead.
function hasLoneSurrogate(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i)

    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(i + 1)

      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        return true
      }

      i++
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return true
    }
  }

  return false
}

function lossy(value: unknown): boolean {
  if (typeof value === 'string') {
    return hasLoneSurrogate(value)
  }

  if (Array.isArray(value)) {
    return value.some(lossy)
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some(lossy)
  }

  return false
}

// Replace unpaired surrogates so the fixture is valid UTF-8 and any JSON reader
// can load it. The `lossy` flag says the case was rewritten.
function clean<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '�') as T
  }

  if (Array.isArray(value)) {
    return value.map(clean) as T
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, clean(inner)]),
    ) as T
  }

  return value
}

// Talk spellings are ASCII, so an astral character in a talk input can only
// reach the passthrough path, which is where the two builds part ways. Mark
// those cases whether or not the difference shows up in this particular field.
const astral = (text: string) => [...text].some(c => c.codePointAt(0)! > 0xffff)
const TALK_SIDE = new Set(['segment', 'convert', 'syllables'])

const marked = Object.fromEntries(
  Object.entries(fixture).map(([name, cases]) => [
    name,
    (cases as { input?: string }[]).map(entry => {
      const diverges =
        lossy(entry) || (TALK_SIDE.has(name) && astral(entry.input ?? ''))

      return diverges ? { ...clean(entry), lossy: true } : entry
    }),
  ]),
)

const target = resolve(HERE, 'fixture/parity.json')

mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(marked))

console.log(
  [
    `segment    ${fixture.segment.length}`,
    `convert    ${fixture.convert.length}`,
    `ipaToTalk  ${fixture.ipaToTalk.length}`,
    `enumerate  ${fixture.enumerate.length}`,
    `syllables  ${fixture.syllables.length} (${
      fixture.syllables.filter(entry => !entry.ok).length
    } rejected)`,
    `lossy      ${
      Object.values(marked).reduce(
        (total, cases) =>
          total + cases.filter(entry => (entry as { lossy?: boolean }).lossy).length,
        0,
      )
    } (astral talk input, see the note above)`,
    `wrote      ${target}`,
  ].join('\n'),
)
