import { describe, expect, it } from 'vitest'

import { combine, ipaToTalk, segment, tokenize } from '../code'

// The chunk sequence a talk string tokenizes into.
const chunks = (talk: string) => segment(talk).map(s => s.talk)

describe('chunking keeps each base with its modifiers', () => {
  it('an aspirated consonant is one chunk', () => {
    expect(chunks('th~a')).toEqual(['th~', 'a'])
  })

  it('a labialized consonant is one chunk', () => {
    expect(chunks('kw~a')).toEqual(['kw~', 'a'])
  })

  it('a pharyngealized consonant is one chunk', () => {
    expect(chunks('sQ~a')).toEqual(['sQ~', 'a'])
  })

  it('a voiceless-marked sonorant is one chunk', () => {
    expect(chunks('mh!im')).toEqual(['mh!', 'i', 'm'])
  })

  it('an ejective is one chunk', () => {
    expect(chunks('t!arEba')).toEqual(['t!', 'a', 'r', 'E', 'b', 'a'])
  })

  it('stacked consonant modifiers stay in one chunk', () => {
    expect(chunks('txy~h~im')).toEqual(['t', 'xy~h~', 'i', 'm'])
  })

  it('a vowel keeps its stress mark', () => {
    expect(chunks('txando^')).toEqual(['t', 'x', 'a', 'n', 'd', 'o^'])
  })

  it('a vowel keeps tone, length, and nasal marks in one chunk', () => {
    expect(chunks('a&+_')).toEqual(['a&+_'])
    expect(chunks('txya@+a-a++u')).toEqual([
      't',
      'x',
      'y',
      'a@+',
      'a-',
      'a++',
      'u',
    ])
  })
})

describe('clicks are single chunks', () => {
  it('does not split a click off its base letter', () => {
    expect(chunks('p*at*')).toEqual(['p*', 'a', 't*'])
    expect(chunks('k*')).toEqual(['k*'])
    expect(chunks('c*a')).toEqual(['c*', 'a'])
  })
})

describe('symbols, numerals, and space', () => {
  it('passes them through as their own chunks', () => {
    expect(chunks('=. 7')).toEqual(['=.', ' ', '7'])
  })

  it('marks them as symbol sounds', () => {
    const [dot, space, seven] = segment('=. 7')
    expect(dot?.kind).toBe('symbol')
    expect(space?.kind).toBe('symbol')
    expect(seven?.kind).toBe('symbol')
  })
})

describe('real words', () => {
  const cases: [string, string[]][] = [
    ['siqk', ['s', 'i', 'q', 'k']],
    ['aiyuQaK', ['a', 'i', 'y', 'u', 'Q', 'a', 'K']],
    ['HEth~Ah', ['H', 'E', 'th~', 'A', 'h']],
    ["s'oQya&te", ['s', "'", 'o', 'Q', 'y', 'a&', 't', 'e']],
    ["batO_'aH", ['b', 'a', 't', 'O_', "'", 'a', 'H']],
  ]

  for (const [word, expected] of cases) {
    it(`chunks ${word}`, () => {
      expect(chunks(word)).toEqual(expected)
    })
  }
})

describe('sound structure', () => {
  it('exposes the base and modifier features', () => {
    const [sound] = segment('th~a')
    expect(sound?.base?.talk).toBe('t')
    expect(sound?.kind).toBe('consonant')
    expect(sound?.modifiers.map(m => m.feature)).toEqual(['aspirated'])
  })

  it('exposes vowel modifier features', () => {
    const [sound] = segment('a&+_')
    expect(sound?.kind).toBe('vowel')
    expect(sound?.base?.talk).toBe('a')
    expect(new Set(sound?.modifiers.map(m => m.feature))).toEqual(
      new Set(['nasalized', 'high-tone', 'long']),
    )
  })

  it('every non-raw chunk equals its base plus modifiers, in canonical order', () => {
    for (const sound of segment('txya@+a-a++u th~a p*a')) {
      if (!sound.raw && sound.base) {
        expect(sound.talk).toBe(
          combine(sound.base.talk, sound.modifiers),
        )
      }
    }
  })
})

describe('canonicalization', () => {
  it('tokenizing is idempotent on canonical talk', () => {
    for (const word of ['th~a', 'kw~asQ~o', 'a&+_', 'p*at*', 'mh!im']) {
      expect(chunks(word).join('')).toBe(word)
    }
  })

  it('ipaToTalk output tokenizes back to the same chunks', () => {
    for (const ipa of ['tʰa', 'kʷasˤo', 'ˈmama', 'ãtu']) {
      const talk = ipaToTalk(ipa)
      expect(chunks(talk).join('')).toBe(talk)
    }
  })

  it('tokenize is an alias for segment', () => {
    expect(tokenize('th~a')).toEqual(segment('th~a'))
  })
})
