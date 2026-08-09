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

describe('falling diphthongs are one nucleus cluster', () => {
  // eI was always a single cluster while oU / aU / aO / oO split in
  // two, so "brown" and "program" chunked their nucleus as two vowels
  // and the syllabifier placed the offglide in the NEXT syllable
  // (pr.r.o | U.gr). The carrier-vowel diphthong spellings joined the
  // inventory on 2026-08-08.
  const nucleusOf = (word: string): string[] => {
    const result = syllables(word) as {
      clusters: { text: string; form: string }[]
    }

    return result.clusters
      .filter(c => c.form === 'vowel')
      .map(c => c.text)
  }

  it('oU is one cluster (typed tone)', () => {
    expect(nucleusOf('proUgrram')).toEqual(['oU', 'a'])
  })

  it('aU is one cluster (typed tone)', () => {
    expect(nucleusOf('braUn')).toEqual(['aU'])
  })

  it('aO is one cluster (as ipaToTalk spells aʊ)', () => {
    expect(nucleusOf('brraOn')).toEqual(['aO'])
  })

  it('oO is one cluster (as ipaToTalk spells oʊ)', () => {
    expect(nucleusOf('goOt')).toEqual(['oO'])
  })

  it('a diphthong stays inside ONE syllable', () => {
    const result = syllables('braUn') as {
      syllables: { clusters: { text: string }[] }[]
    }

    expect(result.syllables).toHaveLength(1)
  })

  it('a hiatus still splits: stressed i then eI stay two nuclei', () => {
    expect(nucleusOf('krri^eIxUn')).toEqual(['i^', 'eI', 'U'])
  })
})
