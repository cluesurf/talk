// Precomputes the realistic modified-consonant Talk letters into
// `code/base/consonants.json`, which `index.ts` imports to build the
// glyph table. Run it after changing the phone chart or the rules:
//
//   pnpm glyphs
//
// It takes two sources and unions them:
//   1. Every phone in the chart (`code/base/consonants.csv`), which is
//      real by definition.
//   2. Rule-based extensions of the base pulmonic consonants (a
//      labialized `k`, a palatalized `s`, ...), where the modifiers
//      allowed on each base come from `code/glyph-rules.ts`, so no
//      nonsense (a dental glottal stop, an ejective glide) is produced.
//
// Each candidate IPA string is run through `makeIpaToTalk` to get its
// canonical Talk letter. Doing this at build time keeps the runtime a
// plain JSON import.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeIpaToTalk } from '~/code/ipa'
import {
  DENTAL,
  LABIAL,
  LARYNGEAL,
  TONGUE_BODY,
  VOICELESS,
} from '~/code/glyph-rules'

const HERE = dirname(fileURLToPath(import.meta.url))

const FULL_PLACES = new Set([
  'bilabial',
  'labiodental',
  'linguolabial',
  'dental',
  'alveolar',
  'postalveolar',
  'retroflex',
  'palatal',
  'velar',
  'uvular',
  'pharyngeal-epiglottal',
  'glottal',
])

type Row = {
  symbol: string
  place: string
  manner: string
  voicing: string
}

function readConsonants(): Row[] {
  const text = readFileSync(
    resolve(HERE, '../base/consonants.csv'),
    'utf8',
  ).trim()

  return text
    .split(/\r?\n/)
    .slice(1)
    .map(line => {
      const [symbol, place, manner, voicing] = line.split(',')

      return {
        symbol: symbol!,
        place: place!,
        manner: manner!,
        voicing: voicing!,
      }
    })
}

const seen = new Set<string>()
const out: string[] = []

function add(ipa: string) {
  let talk: string

  try {
    talk = makeIpaToTalk(ipa, { tones: false })
  } catch {
    return
  }

  // Skip vowel-mapped approximants (English `ɹ` -> `u$`): those are
  // vowels, with their own glyphs, not consonants.
  if (!talk || /^[aeiouAEIOU]/.test(talk) || seen.has(talk)) {
    return
  }

  seen.add(talk)
  out.push(talk)
}

const rows = readConsonants()

// 1. Every chart phone (guaranteed real).
for (const row of rows) {
  add(row.symbol)
}

// 2. Rule-based extensions of the single-letter pulmonic bases.
for (const row of rows) {
  if ([...row.symbol].length !== 1 || !FULL_PLACES.has(row.place)) {
    continue
  }

  const dentalMarks = DENTAL.places.includes(row.place)
    ? ['', DENTAL.ipa]
    : ['']
  // At most one tongue-body secondary, plus optional labialization
  // (a lip gesture that stacks on the tongue body, e.g. `y~w~`).
  const tongueBodyMarks = [
    '',
    ...TONGUE_BODY.filter(
      mod =>
        !mod.notPlaces.includes(row.place) &&
        (!mod.places || mod.places.includes(row.place)),
    ).map(mod => mod.ipa),
  ]
  const labialMarks = LABIAL.notPlaces.includes(row.place)
    ? ['']
    : ['', LABIAL.ipa]
  const laryngealMarks = [
    '',
    ...LARYNGEAL.filter(
      mod =>
        mod.manners.includes(row.manner) &&
        (!mod.voicings || mod.voicings.includes(row.voicing)) &&
        !mod.notPlaces?.includes(row.place),
    ).map(mod => mod.ipa),
  ]
  const voicelessMarks =
    VOICELESS.manners.includes(row.manner) &&
    VOICELESS.voicings.includes(row.voicing)
      ? ['', VOICELESS.ipa]
      : ['']

  for (const dental of dentalMarks) {
    for (const tongueBody of tongueBodyMarks) {
      for (const labial of labialMarks) {
        for (const laryngeal of laryngealMarks) {
          for (const voiceless of voicelessMarks) {
            add(
              row.symbol +
                dental +
                tongueBody +
                labial +
                laryngeal +
                voiceless,
            )
          }
        }
      }
    }
  }
}

out.sort()

const outPath = resolve(HERE, '../base/consonants.json')

writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n')
console.log(`[glyph-builder] wrote ${outPath} (${out.length} sounds)`)
