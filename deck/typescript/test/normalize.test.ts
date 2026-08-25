/**
 * Tests for IPA canonicalisation.
 *
 * Every input here was observed in 3,896,910 IPA strings drawn from
 * several hundred sources. The point of the suite is the line between a
 * LOOKALIKE, which folds because two codepoints mean one sound, and a
 * REAL SYMBOL, which must not, because folding it would rewrite correct
 * transcription.
 */

import { describe, expect, it } from 'vitest'
import { normalizeIpa } from '../code'

/** Compared composed, since the normalizer returns NFD by design. */

function normalized(text: string): string {
  return normalizeIpa(text).normalize('NFC')
}

describe('greek letters that ARE ipa', () => {
  it('keeps beta, theta and chi', () => {
    // 166,790 uses across 171 languages. These are the IPA's own
    // symbols for the voiced bilabial, voiceless dental and voiceless
    // uvular fricatives, and they live in the Greek block.
    expect(normalized('ɰβan')).toBe('ɰβan')
    expect(normalized('aˈθeʔ')).toBe('aˈθeʔ')
    expect(normalized('χʷˑˈba')).toBe('χʷˑˈba')
  })
})

describe('greek letters that are NOT ipa', () => {
  it('folds gamma to the latin ipa gamma', () => {
    expect(normalized('aγa')).toBe('aɣa')
  })

  it('folds delta to eth', () => {
    expect(normalized('baoδō')).toBe('baoðō')
  })

  it('folds phi to the latin ipa phi', () => {
    expect(normalized('φupne')).toBe('ɸupne')
  })

  it('folds the vowels to their latin ipa letters', () => {
    expect(normalized('ε')).toBe('ɛ')
    expect(normalized('ι')).toBe('ɪ')
    expect(normalized('υ')).toBe('ʊ')
    expect(normalized('α')).toBe('ɑ')
  })

  it('leaves lambda alone, which no single mapping fits', () => {
    // Americanist notation uses it for the lateral affricate `tɬ`;
    // other sources use it for the palatal lateral `ʎ`. Mapping would
    // pick one and be wrong for the other half of the corpus.
    expect(normalized('λā-psa')).toBe('λā-psa')
  })
})

describe('lookalikes from other blocks', () => {
  it('folds the cyrillic a-ie ligature to latin ae', () => {
    expect(normalized('vihreӕ')).toBe('vihreæ')
  })

  it('folds a curly apostrophe to the ejective mark', () => {
    expect(normalized('ats’á')).toBe('atsʼá')
  })

  it('still folds the straight apostrophe', () => {
    expect(normalized("ats'á")).toBe('atsʼá')
  })
})

describe('delimiters and junk', () => {
  it('unwraps phonemic slashes', () => {
    expect(normalized('/lɛwɨz/')).toBe('lɛwɨz')
  })

  it('unwraps phonetic brackets', () => {
    expect(normalized('[mbʰan̪]')).toBe('mbʰan̪')
  })

  it('keeps a slash that is not wrapping the string', () => {
    // Inside a string a slash separates two readings, and cutting it
    // would join them into a word that is neither.
    expect(normalized('a/b')).toBe('a/b')
  })

  it('drops private use area characters', () => {
    // A font assigns these whatever glyph it likes and no two agree,
    // so nothing downstream can know what was meant.
    expect(normalized('ɔ̀kɔ́tɔ̀')).toBe('ɔ̀kɔ́tɔ̀'.normalize('NFC'))
  })
})

describe('detail is kept, always', () => {
  it('keeps breathy voice, which is contrastive', () => {
    // Dropping it would merge two different sounds across South Asia.
    expect(normalized('b̤a')).toBe('b̤a'.normalize('NFC'))
  })

  it('keeps murmur apart from aspiration', () => {
    // `ʱ` used to be rewritten to `ʰ`, which filed a breathy-voiced
    // release as plain aspiration and merged the two series.
    expect(normalized('ɡʱ')).not.toBe(normalized('ɡʰ'))
  })

  it('keeps a cedilla attached to its own letter', () => {
    // `ç` is one phone. Sorting another mark inside it split it into `c`
    // plus a cedilla the tries have never heard of.
    expect(normalized('ç̟')).toBe('ç̟'.normalize('NFC'))
  })
})

describe('archiphonemes', () => {
  it('leaves them alone, so the parser can report them', () => {
    // Each stands for a set of realizations the source declined to
    // choose between. These used to fold to `r`, `n` and `d`, which
    // wrote a segment into the record that the description refused to
    // pick.
    expect(normalized('R')).toBe('R')
    expect(normalized('N')).toBe('N')
    expect(normalized('ᴅ')).toBe('ᴅ')
  })
})

describe('idempotence', () => {
  it('normalizing twice changes nothing', () => {
    for (const one of [
      '/lɛwɨz/',
      'aγa',
      'vihreӕ',
      'ats’á',
      'χʷˑˈba',
      'ɰβan',
      'b̤a',
      'ɡʱ',
      'ç̟',
    ]) {
      const once = normalizeIpa(one)

      expect(normalizeIpa(once)).toBe(once)
    }
  })
})
