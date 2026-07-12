import { describe, it, expect } from 'vitest'
import { tokenize } from '~/code/tokenizer'

describe('tokenize', () => {
  // ─── Basic consonants ─────────────────────────────────

  it('parses a single consonant', () => {
    const tokens = tokenize('t')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 't',
      variant: false,
    })
  })

  it('parses a variant consonant', () => {
    const tokens = tokenize('D')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 'D',
      variant: true,
    })
  })

  it('parses glottal stop', () => {
    const tokens = tokenize("'")
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: "'",
    })
  })

  // ─── Consonant flags ──────────────────────────────────

  it('parses ejective consonant', () => {
    const tokens = tokenize('t!')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 't',
      ejective: true,
    })
  })

  it('parses implosive consonant', () => {
    const tokens = tokenize('b?')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 'b',
      implosive: true,
    })
  })

  it('parses aspirated consonant', () => {
    const tokens = tokenize('th~')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 't',
      aspirated: true,
    })
  })

  it('parses palatalized consonant', () => {
    const tokens = tokenize('ny~')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 'n',
      palatalized: true,
    })
  })

  it('parses labialized consonant', () => {
    const tokens = tokenize('kw~')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 'k',
      labialized: true,
    })
  })

  it('parses velarized consonant', () => {
    const tokens = tokenize('lG~')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 'l',
      velarized: true,
    })
  })

  it('parses pharyngealized consonant', () => {
    const tokens = tokenize('dQ~')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 'd',
      pharyngealized: true,
    })
  })

  it('parses tense consonant', () => {
    const tokens = tokenize('s@')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 's',
      tense: true,
    })
  })

  it('parses stop consonant', () => {
    const tokens = tokenize('t.')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 't',
      stop: true,
    })
  })

  it('parses click consonant', () => {
    const tokens = tokenize('k*')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 'k',
      click: true,
    })
  })

  // ─── Basic vowels ─────────────────────────────────────

  it('parses a single vowel', () => {
    const tokens = tokenize('a')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      text: 'a',
      variant: false,
    })
  })

  it('parses a variant vowel', () => {
    const tokens = tokenize('A')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      text: 'A',
      variant: true,
    })
  })

  // ─── Vowel flags ──────────────────────────────────────

  it('parses stressed vowel', () => {
    const tokens = tokenize('a^')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      text: 'a',
      stressed: true,
    })
  })

  it('parses long vowel', () => {
    const tokens = tokenize('a_')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      text: 'a',
      long: true,
    })
  })

  it('parses short vowel', () => {
    const tokens = tokenize('a!')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      text: 'a',
      short: true,
    })
  })

  it('parses nasal vowel', () => {
    const tokens = tokenize('a&')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      text: 'a',
      nasal: true,
    })
  })

  it('parses non-syllabic vowel', () => {
    const tokens = tokenize('i@')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      text: 'i',
      nonsyllabic: true,
    })
  })

  it('parses rounded vowel', () => {
    const tokens = tokenize('i$')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      text: 'i',
      rounded: true,
    })
  })

  // ─── Tones ────────────────────────────────────────────

  it('parses high tone', () => {
    const tokens = tokenize('a+')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ form: 'vowel', tone: 'high' })
  })

  it('parses extra high tone', () => {
    const tokens = tokenize('a++')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      tone: 'extra-high',
    })
  })

  it('parses low tone', () => {
    const tokens = tokenize('a-')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ form: 'vowel', tone: 'low' })
  })

  it('parses extra low tone', () => {
    const tokens = tokenize('a--')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      tone: 'extra-low',
    })
  })

  it('parses rising tone', () => {
    const tokens = tokenize('a/')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ form: 'vowel', tone: 'rising' })
  })

  it('parses falling tone', () => {
    const tokens = tokenize('a\\')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ form: 'vowel', tone: 'falling' })
  })

  it('parses rising-2 tone', () => {
    const tokens = tokenize('a//')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ form: 'vowel', tone: 'rising-2' })
  })

  it('parses falling-2 tone', () => {
    const tokens = tokenize('a\\\\')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      tone: 'falling-2',
    })
  })

  it('parses falling-rising tone', () => {
    const tokens = tokenize('a\\/')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      tone: 'falling-rising',
    })
  })

  it('parses rising-falling tone', () => {
    const tokens = tokenize('a/\\')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      tone: 'rising-falling',
    })
  })

  // ─── Combined flags ───────────────────────────────────

  it('parses vowel with multiple flags', () => {
    const tokens = tokenize('a&^_+')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({
      form: 'vowel',
      text: 'a',
      nasal: true,
      stressed: true,
      long: true,
      tone: 'high',
    })
  })

  // ─── Sequences ────────────────────────────────────────

  it('parses CVC sequence', () => {
    const tokens = tokenize('tak')
    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toMatchObject({ form: 'consonant', text: 't' })
    expect(tokens[1]).toMatchObject({ form: 'vowel', text: 'a' })
    expect(tokens[2]).toMatchObject({ form: 'consonant', text: 'k' })
  })

  it('parses complex sequence with flags', () => {
    const tokens = tokenize('t!a++nDh~')
    expect(tokens).toHaveLength(4)
    expect(tokens[0]).toMatchObject({
      form: 'consonant',
      text: 't',
      ejective: true,
    })
    expect(tokens[1]).toMatchObject({
      form: 'vowel',
      text: 'a',
      tone: 'extra-high',
    })
    expect(tokens[2]).toMatchObject({ form: 'consonant', text: 'n' })
    expect(tokens[3]).toMatchObject({
      form: 'consonant',
      text: 'D',
      variant: true,
      aspirated: true,
    })
  })

  it('parses words with spaces', () => {
    const tokens = tokenize('ma na')
    expect(tokens).toHaveLength(5)
    expect(tokens[0]).toMatchObject({ form: 'consonant', text: 'm' })
    expect(tokens[1]).toMatchObject({ form: 'vowel', text: 'a' })
    expect(tokens[2]).toMatchObject({ form: 'space' })
    expect(tokens[3]).toMatchObject({ form: 'consonant', text: 'n' })
    expect(tokens[4]).toMatchObject({ form: 'vowel', text: 'a' })
  })

  // ─── Symbols and numerals ─────────────────────────────

  it('parses symbol escape', () => {
    const tokens = tokenize('=.')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ form: 'symbol', text: '.' })
  })

  it('parses numeral', () => {
    const tokens = tokenize('3')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ form: 'numeral', text: '3' })
  })

  it('parses mixed content', () => {
    const tokens = tokenize('ma=.3')
    expect(tokens).toHaveLength(4)
    expect(tokens[0]).toMatchObject({ form: 'consonant', text: 'm' })
    expect(tokens[1]).toMatchObject({ form: 'vowel', text: 'a' })
    expect(tokens[2]).toMatchObject({ form: 'symbol', text: '.' })
    expect(tokens[3]).toMatchObject({ form: 'numeral', text: '3' })
  })

  // ─── Edge cases ───────────────────────────────────────

  it('parses empty string', () => {
    expect(tokenize('')).toHaveLength(0)
  })

  it('parses all five vowels', () => {
    const tokens = tokenize('ieaou')
    expect(tokens).toHaveLength(5)
    expect(tokens.map(t => (t as any).text)).toEqual([
      'i',
      'e',
      'a',
      'o',
      'u',
    ])
  })

  it('does not confuse consonant n~ as modifier on previous', () => {
    const tokens = tokenize('mn')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({ form: 'consonant', text: 'm' })
    expect(tokens[1]).toMatchObject({ form: 'consonant', text: 'n' })
  })
})
