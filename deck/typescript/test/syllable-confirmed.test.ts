/**
 * Splits confirmed correct by review, kept so they are not "fixed" later.
 *
 * WHY THESE EXIST. Each one looked wrong to an automated check and was
 * reviewed and found right. Without them written down the next sweep finds
 * the same three, calls them anomalies again, and someone changes the
 * grouper to make them go away. That nearly happened once already: a change
 * that forced a word break to end a syllable was written, and reverted,
 * because the first case below says it must not.
 */

import { describe, expect, it } from 'vitest'
import { ipaToTalk, syllables } from '../code'

type Result = { syllables?: { clusters?: { text: string }[] }[] }

/** The split, written with `.` between syllables. */
function shape(ipa: string): string {
  const result = syllables(ipaToTalk(ipa)) as Result

  return (result.syllables ?? [])
    .map(one => (one.clusters ?? []).map(cell => cell.text).join(''))
    .join('.')
}

describe('a syllable may run across a word boundary', () => {
  it('French enchaînement carries a coda onto the next word', () => {
    // `chou de Bruxelles`. The `b` of Bruxelles closes the syllable that
    // begins in `de`, which is how it is spoken, so the space must NOT end
    // the syllable. Forcing a break here gives `xu.dU.b$G$i.sEl` and is
    // wrong.
    expect(shape('ʃu də bʁy.sɛl')).toBe('xu.dUb.$G$i.sEl')
  })
})

describe('a syllable may have no vowel in it', () => {
  it('an Arabic CVCC closes with a vowelless final', () => {
    // `qaʕb`. The final `$'b` carries no nucleus and is still the right
    // reading, so "vowelless syllable" is not on its own a fault.
    expect(shape('qaʕb')).toBe('Ka.$\'b')
  })

  it('a Zulu prenasalized onset stands alone', () => {
    // `nɮoːvu`. The `n` is its own piece here rather than being folded into
    // the following lateral.
    expect(shape('nɮoːvu')).toBe('n.Zo<_>.vu')
  })
})
