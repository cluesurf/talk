// Precomputes the modified-consonant Talk letters into
// `code/data/consonants.json`, which `index.ts` imports to build the
// glyph table. Run it after changing the bases or modifiers:
//
//   pnpm glyphs
//
// It runs each base consonant through `makeIpaToTalk` with every
// modifier-diacritic combination and keeps the distinct, valid results.
// Doing this at build time (rather than at module load) keeps the
// runtime cost to a plain JSON import.

import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeIpaToTalk } from '~/code/ipa'

const HERE = dirname(fileURLToPath(import.meta.url))

// Base IPA consonants (single chart letters, plus the two-letter
// retroflex trills). Everything modified is generated from these.
const BASE_CONSONANTS = [
  'm', 'ɱ', 'n', 'ɳ', 'ɲ', 'ŋ', 'ɴ',
  'p', 'b', 't', 'd', 'ʈ', 'ɖ', 'c', 'ɟ', 'k', 'ɡ', 'q', 'ɢ', 'ʔ',
  's', 'z', 'ʃ', 'ʒ', 'ʂ', 'ʐ', 'ɕ', 'ʑ',
  'ɸ', 'β', 'f', 'v', 'θ', 'ð', 'ç', 'ʝ', 'x', 'ɣ', 'χ', 'ʁ', 'ħ', 'ʕ',
  'h', 'ɦ',
  'ʋ', 'ɹ', 'ɻ', 'j', 'ɰ', 'ⱱ', 'ɾ', 'ɽ', 'ʙ', 'r', 'ʀ', 'ɽr', 'ɽ̊r̥',
  'ɬ', 'ɮ', 'l', 'ɭ', 'ʎ', 'ɺ',
  'ʍ', 'w', 'ɥ', 'ɫ',
  'ɓ', 'ɗ', 'ʄ', 'ɠ', 'ʛ',
]

// One array per modifier dimension (each optional). Mark order in the
// IPA string does not matter: `makeIpaToTalk` sets feature flags and
// serializes them in one canonical order.
const DENTAL = ['', '̪']
const SECONDARY = ['', 'ʲ', 'ʷ', 'ˠ', 'ˤ']
const ASPIRATION = ['', 'ʰ']
const EJECTIVE = ['', 'ʼ']
const VOICELESS = ['', '̥']

// A few bases carry a secondary mark in their Talk value already
// (`ɥ` -> `yw~`), so re-applying the same mark would double it. Reject
// any doubled suffix mark rather than special-casing those bases.
function isJunk(talk: string) {
  return /~~|y~y~|w~w~|G~G~|Q~Q~|h~h~|h!h!|!!|\?\?|@@|\.\./.test(talk)
}

const seen = new Set<string>()
const out: string[] = []

for (const base of BASE_CONSONANTS) {
  for (const dental of DENTAL) {
    for (const secondary of SECONDARY) {
      for (const aspiration of ASPIRATION) {
        for (const ejective of EJECTIVE) {
          for (const voiceless of VOICELESS) {
            const ipa =
              base + dental + secondary + aspiration + ejective + voiceless

            let talk: string

            try {
              talk = makeIpaToTalk(ipa, { tones: false })
            } catch {
              continue
            }

            if (talk && !isJunk(talk) && !seen.has(talk)) {
              seen.add(talk)
              out.push(talk)
            }
          }
        }
      }
    }
  }
}

out.sort()

const outPath = resolve(HERE, 'data/consonants.json')

writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n')
console.log(`[glyph-builder] wrote ${outPath} (${out.length} sounds)`)
