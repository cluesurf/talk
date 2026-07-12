import { makeIpaToTalk } from '~/code/ipa'

// The base IPA consonants (single chart letters, plus the two-letter
// retroflex trills). Every modified sound is GENERATED from these by
// applying the modifier diacritics below, so nothing is listed by hand
// and no junk cross-product ever appears: `makeIpaToTalk` only emits
// valid Talk, so a combination it cannot form is simply never produced.
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

// One array per modifier dimension (each optional). The order the marks
// appear in the IPA string does not matter: `makeIpaToTalk` records
// feature flags and always serializes them in one canonical order, so
// every dimension order yields the same Talk letter.
const DENTAL = ['', '̪'] // ̪
const SECONDARY = ['', 'ʲ', 'ʷ', 'ˠ', 'ˤ'] // palatal, labial, velar, pharyngeal
const ASPIRATION = ['', 'ʰ']
const EJECTIVE = ['', 'ʼ']
const VOICELESS = ['', '̥'] // ̥

// Every valid modified consonant sound, as the Talk string
// `makeIpaToTalk` emits, deduped. This is what the glyph table
// precomposes so `machine()` gives one Hangul code point per sound.
export const CONSONANT_INPUTS: string[] = buildConsonantInputs()

function buildConsonantInputs() {
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

              if (talk && !seen.has(talk)) {
                seen.add(talk)
                out.push(talk)
              }
            }
          }
        }
      }
    }
  }

  return out
}
