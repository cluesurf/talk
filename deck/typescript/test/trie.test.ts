import { describe, expect, it } from 'vitest'

import { buildTrie } from '../code/trie'

describe('double-array trie', () => {
  const trie = buildTrie<string>([
    ['t', 'T'],
    ['th~', 'TH'],
    ['ty~', 'TY'],
    ['𝼊', 'CLICK'], // astral char (surrogate pair)
  ])

  it('takes the longest matching prefix', () => {
    expect(trie.matchAt('th~a', 0)).toBe('TH')
    expect(trie.matchedLength).toBe(3)
  })

  it('falls back to a shorter key when the longer one does not match', () => {
    expect(trie.matchAt('tz', 0)).toBe('T')
    expect(trie.matchedLength).toBe(1)
  })

  it('matches from an offset', () => {
    expect(trie.matchAt('xty~', 1)).toBe('TY')
    expect(trie.matchedLength).toBe(3)
  })

  it('returns undefined when nothing matches', () => {
    expect(trie.matchAt('zzz', 0)).toBeUndefined()
    expect(trie.matchedLength).toBe(0)
  })

  it('matches an astral-plane key', () => {
    expect(trie.matchAt('𝼊', 0)).toBe('CLICK')
    expect(trie.matchedLength).toBe(2) // two code units
  })

  it('keeps the first spelling when a key is added twice', () => {
    const dupes = buildTrie<string>([
      ['a', 'first'],
      ['a', 'second'],
    ])

    expect(dupes.matchAt('a', 0)).toBe('first')
  })
})
