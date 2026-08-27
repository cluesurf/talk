/**
 * Real pronunciations, from the export, syllabified.
 *
 * WHY REAL DATA. The other suites are written cases, and a written case
 * only covers what its author already knew to write. These are 4,225
 * pronunciations sampled out of the 3.5 million in
 * `base/export/language/*​/strings.jsonl`, from 52 languages picked for how
 * much of the IPA space they use: the clicks and lateral obstruents of
 * Bella Coola and Taa, the ejectives of Georgian and Archi, the tone
 * letters of Vietnamese and Burmese, the stød and creak of Danish, the
 * pharyngeals of Arabic and Hebrew, the diacritic-dense transcriptions of
 * Japanese and Korean.
 *
 * They are sampled by SHAPE, not by frequency: each pronunciation is
 * reduced to the set of non-letter marks it carries and only a couple of
 * examples per shape are kept. Taking the commonest instead would be four
 * thousand copies of `CVCV` and would test nothing.
 *
 * THE BAR IS EVERY ONE OF THEM. A pronunciation that is valid IPA has to
 * convert to talk and split into syllables that, run back together, hold
 * every SOUND the tokenizer read out of it. A split that loses a modifier
 * is a silent wrong answer, which is worse than a throw.
 *
 * Separators are not sounds. A `.` and a space mark boundaries, and the
 * syllabifier consumes them rather than filing them inside a syllable, so
 * the comparison is against the tokenizer's own reading of the string and
 * not against its raw text.
 */

import { describe, expect, it } from 'vitest'
import { ipaToTalk, syllables, isValidIpa, segment } from '../code'
import SAMPLE from './fixture/pronunciation-sample.json'

type Case = { language: string; word: string; ipa: string }

const CASES = SAMPLE as Case[]

type Result = { syllables?: { clusters?: { form: string; text: string }[] }[] }

/** The clusters of a word, run back together. */
function rejoin(talk: string): string {
  const result = syllables(talk) as Result

  return (result.syllables ?? [])
    .map(one => (one.clusters ?? []).map(cell => cell.text).join(''))
    .join('')
}

const BY_LANGUAGE = [...new Set(CASES.map(one => one.language))].sort()

describe('every exported pronunciation syllabifies', () => {
  for (const language of BY_LANGUAGE) {
    const cases = CASES.filter(one => one.language === language)

    it(`${language} (${cases.length})`, () => {
      const broken: string[] = []

      for (const one of cases) {
        if (!isValidIpa(one.ipa)) {
          continue
        }

        let talk = ''

        try {
          talk = ipaToTalk(one.ipa)
        } catch (error) {
          broken.push(`${one.ipa} -> ipaToTalk threw ${(error as Error).message}`)
          continue
        }

        let back = ''

        try {
          back = rejoin(talk)
        } catch (error) {
          broken.push(`${one.ipa} (${talk}) -> threw ${(error as Error).message}`)
          continue
        }

        const sounds = segment(talk)
          .filter(sound => sound.base)
          .map(sound => sound.talk)
          .join('')

        if (back !== sounds) {
          broken.push(`${one.ipa} -> ${talk} -> ${back} (want ${sounds})`)
        }
      }

      expect(broken.slice(0, 8), `${broken.length} of ${cases.length}`).toEqual(
        [],
      )
    })
  }
})

describe('the sample is what it claims to be', () => {
  it('covers every language it was drawn from', () => {
    expect(BY_LANGUAGE.length).toBeGreaterThanOrEqual(45)
  })

  it('carries the hard material and not just plain syllables', () => {
    const has = (mark: string): boolean =>
      CASES.some(one => one.ipa.normalize('NFD').includes(mark))

    // A click, a tone letter, an ejective, a length mark, a nasal hook and
    // a tie. If the sampler ever degrades to taking the commonest rows
    // these stop being present and the suite quietly gets easier.
    expect(has('ǃ') || has('ǀ') || has('ǂ'), 'a click').toBe(true)
    expect(has('˥') || has('˧') || has('˩'), 'a tone letter').toBe(true)
    expect(has('ʼ'), 'an ejective').toBe(true)
    expect(has('ː'), 'a length mark').toBe(true)
    expect(has('̃'), 'a nasal hook').toBe(true)
    expect(has('͡') || has('͜'), 'a tie').toBe(true)
  })
})
