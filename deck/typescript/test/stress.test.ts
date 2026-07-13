import { describe, expect, it } from 'vitest'

import { ipaToTalk, segment } from '../code'

describe('stress placement', () => {
  it('lands on the syllable vowel, not an onset consonant', () => {
    // IPA marks the stressed syllable with a leading tick. Talk puts the
    // stress on that syllable's vowel, past any onset consonants.
    expect(ipaToTalk('ʔeˈmet')).toBe("'eme^t")
    expect(ipaToTalk('ˈmama')).toBe('ma^ma')
  })

  it('always marks a vowel as the stressed sound', () => {
    for (const ipa of ['ʔeˈmet', 'ˈmama', 'uˈǁɔːlɔ', 'ɬaɡaˈniːpʰa']) {
      const stressed = segment(ipaToTalk(ipa)).filter(s =>
        s.modifiers.some(m => m.feature === 'stress'),
      )

      expect(stressed).toHaveLength(1)
      expect(stressed[0]?.kind).toBe('vowel')
    }
  })
})
