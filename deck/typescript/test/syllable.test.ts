import { describe, expect, it } from 'vitest'

import { syllables } from '../code'
import FIXTURE from './fixture/syllable-parity.json'

// The fixture is v1's `chunk()` output over a corpus, captured once. v2
// must syllabify every word into the same clusters. Only the code points
// differ between the two builds, so we compare `form:text`, not the code.
type Case = { word: string; syllables: string[][] }

const shape = (word: string): string[][] => {
  const result = syllables(word) as {
    syllables?: { clusters?: { form: string; text: string }[] }[]
  }

  return (result.syllables ?? []).map(s =>
    (s.clusters ?? []).map(c => `${c.form}:${c.text}`),
  )
}

describe('syllabification matches v1 exactly', () => {
  for (const testCase of FIXTURE as Case[]) {
    it(`splits ${testCase.word}`, () => {
      expect(shape(testCase.word)).toEqual(testCase.syllables)
    })
  }
})

describe('syllable basics', () => {
  it('splits into onset + nucleus syllables', () => {
    const result = syllables('mama') as {
      syllables: { clusters: { text: string }[] }[]
    }
    const texts = result.syllables.map(s =>
      s.clusters.map(c => c.text).join(''),
    )

    expect(texts).toEqual(['ma', 'ma'])
  })

  it('keeps a whole word with no vowel as one syllable', () => {
    const result = syllables('siqk') as {
      syllables: { clusters: { text: string }[] }[]
    }

    expect(result.syllables).toHaveLength(1)
  })
})
