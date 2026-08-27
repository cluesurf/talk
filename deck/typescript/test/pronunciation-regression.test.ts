/**
 * The pronunciations that did not syllabify, kept as cases.
 *
 * These are the whole tail of a run over all 3,567,376 distinct
 * pronunciations in the export: 2,916,522 of the valid-IPA ones split
 * cleanly and these are every one that did not. They are written down here
 * because a corpus run is slow and lives outside the suite, so without them
 * the next regression would only surface the next time somebody thought to
 * do the sweep.
 *
 * Each one is named with the language and word it came from.
 */

import { describe, expect, it } from 'vitest'
import { ipaToTalk, syllables, segment, isValidIpa } from '../code'

type Result = { syllables?: { clusters?: { form: string; text: string }[] }[] }

/** The clusters of a word, run back together. */
function rejoin(talk: string): string {
  const result = syllables(talk) as Result

  return (result.syllables ?? [])
    .map(one => (one.clusters ?? []).map(cell => cell.text).join(''))
    .join('')
}

/** The sounds the tokenizer reads, which is what a split has to preserve. */
function soundsOf(talk: string): string {
  return segment(talk)
    .filter(sound => sound.base)
    .map(sound => sound.talk)
    .join('')
}

/**
 * A MARK WITH NO READING FOR ITS BASE.
 *
 * `ipaToTalk` spells a palatalized vowel `i<y^>`, and palatalization is
 * written for a consonant. The tokenizer read a bracketed run strictly
 * against the form of its base, found no vowel reading for `y`, and gave up
 * on the whole run: the brackets then leaked out of the tokenizer one raw
 * character at a time, so `huni<y^>an` split as `huniy^an` and the
 * palatalization and the stress both became loose letters.
 *
 * These are sixteen of the twenty-six failures, from nine languages, and
 * every one of them carries `^` inside the brackets.
 */

const LEAKED: [string, string, string][] = [
  ['french', 'Provence', 'pʁoˈvaⁿ̃sə'],
  ['french', 'Salon-de-Provence', 'saˈlɔ̃ᵑ də pχoˈvaⁿ̃sə'],
  ['gaelic-(scottish)', 'ùine', 'ˈũːʲɲʲə'],
  ['indonesian', 'hunian', 'huˈniʲan'],
  ['indonesian', 'kiai', 'ˈkiʲaʲi'],
  ['indonesian', 'béa masuk', 'ˈbeʲa ˈmasʊk̚'],
  ['lakota', 'ṫunžaŋ', 'tʊ̃ˈʒãʰ'],
  ['lakota', 'igmu', 'iɡˈmũʰ'],
  ['lakota', 'ukpaŋ', 'jũkˈpãʰ'],
  ['lakota', 'yuštaŋ', 'juˈʃtãʰ'],
  ['portuguese', 'carmim', 'kaɦ.ˈmiʲ̃'],
  ['romanian', 'copii', 'koˈpiʲ'],
  ['norwegian-(bokmål)', 'øy', 'ˈœ̼ʏ̯'],
  ['bavarian', 'heier', 'ˈhæːʲɐ'],
  ['franco-provencal', 'âla', 'ˈeːlo͉˔'],
  ['plautdietsch', 'jəˈhɔ̃ʷn', 'jəˈhɔʷ̃n'],
]

describe('a modifier with no reading for its base still parses', () => {
  for (const [language, word, ipa] of LEAKED) {
    it(`${language} ${word}`, () => {
      const talk = ipaToTalk(ipa)

      // The brackets survive tokenizing. This is the actual regression: a
      // leaked run shows up as a `<` that is its own raw sound.
      expect(talk, 'talk should hold a bracketed run').toContain('<')
      expect(
        segment(talk).filter(one => one.raw && one.talk === '<'),
        'no bracket leaked out as a raw character',
      ).toEqual([])

      expect(rejoin(talk)).toBe(soundsOf(talk))
    })
  }
})

/**
 * A PRONUNCIATION WITH NO SOUNDS IN IT.
 *
 * `˦˧` is two bare tone letters, `ˈ ˌ ː` is three bare marks and `ˈ...ˌ` is
 * an ellipsis between two stress marks. Each passes `isValidIpa`, because
 * every character in it is IPA, and none of them holds a single phone.
 *
 * There is nothing to syllabify, so no syllables is the right answer. What
 * must not happen is a throw, and what must not happen is a split that
 * invents a sound that was never there.
 */

const EMPTY: [string, string, string][] = [
  ['english', 'cheeko', '˦˧'],
  ['faroese', 'mildur', 'ˈ ˌ ː'],
  ['german', 'Kyrieleis', 'ˈ...ˌ'],
  ['german', 'Nienborg', 'ˌ...ˈ'],
]

describe('a pronunciation holding no sounds', () => {
  for (const [language, word, ipa] of EMPTY) {
    it(`${language} ${word}`, () => {
      expect(isValidIpa(ipa), 'the characters are all ipa').toBe(true)

      const talk = ipaToTalk(ipa)

      expect(soundsOf(talk), 'it holds no phones').toBe('')
      expect(() => syllables(talk)).not.toThrow()
      expect(rejoin(talk), 'and so it invents none').toBe('')
    })
  }
})
