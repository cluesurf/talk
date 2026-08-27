/**
 * Generate the sound tables the readmes carry.
 *
 * WRITTEN, NOT HAND-MAINTAINED. The tables restate `base/phones.json` and
 * `base/modifiers.json`, so a hand-kept copy goes stale the first time a
 * spelling changes, silently, in four files at once.
 *
 * The CONSONANTS follow `base/chart/consonant-symbols.csv` and hold only
 * what it lists: that file is the IPA chart in chart order,
 * grouped by place and manner, which is the order a reader already knows.
 * The phone table holds a good deal more than the chart, and dumping all of
 * it made a reference nobody could scan.
 *
 * The VOWELS group by base letter, each with its `$` and `~` variants, which
 * is how the notation is actually built rather than how the chart draws it.
 *
 *   pnpm exec tsx code/make/readme-tables.ts
 */

import fs from 'fs'
import path from 'path'
import PHONES from '../../base/phones.json'
import MODIFIERS from '../../base/modifiers.json'

type Phone = {
  ipa: string
  talk: string
  xsampa: string
  form: string
}

type Modifier = {
  ipa: string
  talk: string
  xsampa: string
  feature: string
  slot: string
  order: number
  base: string
}

// INSIDE TALK, DELIBERATELY. The chart order came from a dataset in the
// wider ClueSurf tree, and reaching out of the package for it would make
// this build depend on a checkout it is not published with. The file is
// vendored at `base/chart/` instead, so the package is self-contained.
const CSV = path.join(
  import.meta.dirname,
  '../../base/chart/consonant-symbols.csv',
)

const phones = PHONES as Phone[]
const modifiers = MODIFIERS as Modifier[]

const byIpa = new Map(phones.map(one => [one.ipa, one]))

/** One CSV row, split on commas that are not inside quotes. */
function cells(line: string): string[] {
  const out: string[] = []
  let cell = ''
  let quoted = false

  for (const one of line) {
    if (one === '"') {
      quoted = !quoted
    } else if (one === ',' && !quoted) {
      out.push(cell)
      cell = ''
    } else {
      cell += one
    }
  }

  out.push(cell)

  return out
}

const lines = fs.readFileSync(CSV, 'utf8').trim().split('\n')
const head = cells(lines[0]!)
const rows = lines.slice(1).map(line => {
  const row = cells(line)

  return Object.fromEntries(head.map((key, at) => [key, row[at] ?? '']))
})

const escape = (one: string): string => one.replace(/\|/g, '\\|')

/**
 * A spelling in a `<code>` element rather than a backtick span.
 *
 * Several X-SAMPA spellings CONTAIN a backtick: the retroflex plosive is
 * `` d` `` and the uvular trill `` R\ ``. A markdown code span ends at the
 * first backtick it meets, so those rendered as broken markup. An element
 * has no such problem, so the markup characters are escaped instead.
 */

/**
 * A spelling as a markdown code span.
 *
 * NOT `<code>`. Raw HTML renders on GitHub and is stripped by npm,
 * crates.io and PyPI, which showed a bare `L</code>` in the table. Markdown
 * has its own answer: a span may be opened with a longer run of backticks
 * than the content holds, so a spelling CONTAINING a backtick, like the
 * retroflex `` d` ``, is wrapped in two and padded with spaces.
 *
 * A pipe is escaped even inside the span, since the table cell is split
 * before the span is read.
 */

const code = (one: string): string => {
  const body = one.replace(/\|/g, '\\|')

  // PADDED WHENEVER A BACKTICK OR BACKSLASH IS INSIDE. A backtick would
  // close the span early, and a trailing backslash sitting against the
  // closing backtick escapes it. The alveolar lateral click is `|\|\`,
  // which has both problems at once and broke the whole table.
  return /[`\\]/.test(body) ? `\`\` ${body} \`\`` : `\`${body}\``
}

/**
 * X-SAMPA is ASCII BY DEFINITION, so a spelling that is not ASCII is not
 * X-SAMPA. Eight of the chart symbols postdate the scheme and were never
 * given one: the labiodental flap, the retroflex and palatal lateral
 * fricatives, the retroflex lateral flap, the retroflex implosive and the
 * retroflex click. The phone table carries the IPA character in the field
 * as a placeholder, which reads in a table as though X-SAMPA spelled it
 * that way. It does not, so the cell is left empty instead.
 */

const sampa = (one: string): string =>
  /^[\x20-\x7e]+$/.test(one) ? code(one) : '—'

// ── consonants, in chart order ──────────────────────────────────────────

const consonant: string[] = [
  '| IPA | talk | X-SAMPA | place | manner | voice |',
  '| --- | ---- | ------- | ----- | ------ | ----- |',
]

for (const row of rows) {
  const phone = byIpa.get(row.symbol!)

  if (!phone) {
    continue
  }

  consonant.push(
    `| ${escape(row.symbol!)} | ${code(phone.talk)} | ${sampa(phone.xsampa)} | ${row.place} | ${row.manner} | ${row.voice} |`,
  )
}

// ── vowels, by base letter ──────────────────────────────────────────────

const BASES = ['i', 'I', 'E', 'e', 'A', 'a', 'O', 'o', 'U', 'u']
const byTalk = new Map(phones.map(one => [one.talk, one]))

const vowel: string[] = [
  '| base | plain | `$` variant | `~` variant |',
  '| ---- | ----- | ----------- | ----------- |',
]

for (const base of BASES) {
  const cell = (talk: string): string => {
    const phone = byTalk.get(talk)

    return phone ? `${phone.ipa} \`${talk}\`` : '—'
  }

  vowel.push(
    `| \`${base}\` | ${cell(base)} | ${cell(`$${base}`)} | ${cell(`~${base}`)} |`,
  )
}

// ── modifiers, by slot in the order they are written ────────────────────
//
// The table used to be in file order, which is the order they were added.
// A reader wants them grouped by what they do, and within a group in the
// order `combine` writes them, since that is the order they appear in a
// spelling.

const GROUPS: { title: string; blurb: string; slots: string[] }[] = [
  {
    title: 'Tongue and lips',
    blurb: 'Where the sound is made, and what the lips do',
    slots: [
      'articulation',
      'tongue-blade',
      'tongue-body',
      'tongue-root',
      'tongue-shape',
      'labial',
      'rounding',
    ],
  },
  {
    title: 'Manner',
    blurb: 'How the air gets out',
    slots: ['manner', 'frication', 'rhoticity', 'nasal', 'release'],
  },
  {
    title: 'Voice',
    blurb: 'What the larynx does',
    slots: ['laryngeal', 'phonation', 'tension'],
  },
  {
    title: 'Length and syllabicity',
    blurb: 'How long it is held, and whether it carries a syllable',
    slots: ['duration', 'length', 'syllabicity'],
  },
  {
    title: 'Tone and stress',
    blurb: 'Pitch and prominence',
    slots: ['tone', 'stress'],
  },
]

const seen = new Set<string>()
const grouped: string[] = []

for (const group of GROUPS) {
  const held = modifiers
    .filter(one => group.slots.includes(one.slot))
    .sort((a, b) => a.order - b.order || a.talk.localeCompare(b.talk))

  if (!held.length) {
    continue
  }

  grouped.push('', `#### ${group.title}`, '', `${group.blurb}.`, '')
  grouped.push('| IPA | talk | X-SAMPA | feature | applies to |')
  grouped.push('| --- | ---- | ------- | ------- | ---------- |')

  for (const one of held) {
    seen.add(one.talk + one.feature)
    grouped.push(
      `| ${escape(one.ipa)} | ${code('<' + one.talk + '>')} | ${sampa(one.xsampa)} | ${one.feature} | ${one.base} |`,
    )
  }
}

const rest = modifiers
  .filter(one => !seen.has(one.talk + one.feature))
  .sort((a, b) => a.order - b.order || a.talk.localeCompare(b.talk))

if (rest.length) {
  const slots = [...new Set(rest.map(one => one.slot))].sort()

  grouped.push('', '#### Other', '', `Slots: ${slots.join(', ')}.`, '')
  grouped.push('| IPA | talk | X-SAMPA | feature | applies to |')
  grouped.push('| --- | ---- | ------- | ------- | ---------- |')

  for (const one of rest) {
    grouped.push(
      `| ${escape(one.ipa)} | ${code('<' + one.talk + '>')} | ${sampa(one.xsampa)} | ${one.feature} | ${one.base} |`,
    )
  }
}

const OUT = path.join(import.meta.dirname, '../../../../tmp/readme-tables.md')

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(
  OUT,
  [
    '<!-- CONSONANTS -->',
    consonant.join('\n'),
    '',
    '<!-- VOWELS -->',
    vowel.join('\n'),
    '',
    '<!-- MODIFIERS -->',
    grouped.join('\n'),
    '',
  ].join('\n'),
  'utf8',
)

console.log(
  `consonants=${consonant.length - 2} vowels=${vowel.length - 2} modifiers=${modifiers.length} -> ${OUT}`,
)
