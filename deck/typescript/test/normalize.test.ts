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
import { ipaToTalk, normalizeIpa, talkToIpa } from '../code'

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

describe('tone is a sequence, not a set', () => {
  it('keeps the order of a chao tone run', () => {
    // The run used to be sorted by pitch, which turned every rise into a
    // fall and could not be undone: `˩˩˦` and `˦˩˩` are the same three
    // letters and only their order says which tone was meant.
    expect(normalized('la˦˥')).toBe('la˦˥')
    expect(normalized('tʰaːn˩˩˦')).toBe('tʰaːn˩˩˦')
    expect(normalized('muːn˧la˦˥tʰaːn˩˩˦')).toBe('muːn˧la˦˥tʰaːn˩˩˦')
  })

  it('keeps mandarin third tone dipping', () => {
    // 214, a fall to the bottom and back up. Sorted it read 421.
    expect(normalized('ma˨˩˦')).toBe('ma˨˩˦')
    expect(normalized('ma˧˥')).toBe('ma˧˥')
  })

  it('keeps the vietnamese rises', () => {
    // `mả` is the dipping-rising hỏi tone and `mã` the creaky-rising ngã.
    // Both were stored as pure falls.
    expect(normalized('maː˧˩˧')).toBe('maː˧˩˧')
    expect(normalized('maˀ˧˥')).toBe('maˀ˧˥')
  })

  it('keeps downstep where it was written', () => {
    // It lowers the register of everything after it, so which side of a
    // tone letter it sits on is the difference between two readings.
    expect(normalized('a↓˥')).toBe('a↓˥')
    expect(normalized('a˥↓')).toBe('a˥↓')
  })

  it('keeps stacked tone accents in order', () => {
    // Two combining accents on one vowel spell a contour the same way two
    // Chao letters do. Neither is in the order table, so they used to sort
    // against each other by codepoint.
    expect(normalizeIpa('a\u{030b}\u{030f}')).toBe('a\u{030b}\u{030f}')
    expect(normalizeIpa('a\u{030f}\u{030b}')).toBe('a\u{030f}\u{030b}')
  })

  it('keeps a mark on the side of the tone letter it was written on', () => {
    // This used to assert `a˥ʰ` and `aʰ˥` were one string. They are not. A
    // tone letter is a point in time and a mark before it is not the same
    // as a mark after it, which is the whole reason Vietnamese can write
    // `˦ˀ˥` and mean a rise with a catch partway up.
    expect(normalized('a˥ʰ')).not.toBe(normalized('aʰ˥'))
    expect(normalized('a˥ʰ')).toBe('a˥ʰ')
    expect(normalized('aʰ˥')).toBe('aʰ˥')
  })

  it('keeps the vietnamese glottal inside its contour', () => {
    // 2,838 rows. The ngã tone is a rise interrupted by glottalisation
    // partway up. Sorting dragged the `ˀ` to the front and left a catch
    // followed by a clean rise, which is a different tone.
    expect(normalized('ɣo˦ˀ˥')).toBe('ɣo˦ˀ˥')
    expect(normalized('maːŋ˦ˀ˥')).toBe('maːŋ˦ˀ˥')
    expect(normalized('ŋaː˦ˀ˥')).toBe('ŋaː˦ˀ˥')
  })

  it('keeps a tone accent on its vowel rather than on the length mark', () => {
    // 3,707 rows across three languages. `ː` has combining class zero, so
    // an accent pushed past it attaches to the length mark and renders on
    // it, and a reader asking which segment carries the tone is told `ː`.
    expect(normalized('tʼóː')).toBe('tʼóː')
    expect(normalized('péːhònɪ́sɪ̀n')).toBe('péːhònɪ́sɪ̀n')
    expect(normalized('wóːʒt͡ʃʼĩ́ːt')).toBe('wóːʒt͡ʃʼĩ́ːt')
  })

  it('still canonicalises the marks that do commute', () => {
    // Neither the dental nor the voiceless mark is an anchor, and both are
    // true of the whole segment, so an order is picked and either input
    // reaches it. This is what the sort is for and it still works.
    expect(normalized('n̪̥')).toBe(normalized('n̥̪'))
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
      'ma˨˩˦',
      'tʰaːn˩˩˦',
      'a↓˥',
    ]) {
      const once = normalizeIpa(one)

      expect(normalizeIpa(once)).toBe(once)
    }
  })
})

describe('nothing is dropped', () => {
  it('keeps the syllable boundary', () => {
    // 14,271 deletions in Thai alone. `ʔeː˧.t͡ɕʰia̯˧.buː˧` states three
    // syllables and without the marks a reader has to guess.
    expect(normalized('a.b')).toBe('a.b')
    expect(normalized('ʔeː˧.t͡ɕʰia̯˧.buː˧')).toBe('ʔeː˧.t͡ɕʰia̯˧.buː˧')
  })

  it('keeps the link between two words spoken as one', () => {
    expect(normalized('a‿b')).toBe('a‿b')
  })

  it('keeps the tie, which says two letters are one segment', () => {
    // `t͡ʃ` is one affricate. `tʃ` may be a stop meeting a fricative across
    // a boundary. Dropping the tie merged the two.
    expect(normalized('t͡ʃ')).toBe('t͡ʃ')
    expect(normalized('k͡p')).toBe('k͡p')
  })

  it('folds the tie below onto the tie above, which IS one thing twice', () => {
    // The only genuine fold of the four. U+035C is written underneath when
    // a descender leaves no room, exactly as the ring below is.
    expect(normalizeIpa('t͜ʃ')).toBe(normalizeIpa('t͡ʃ'))
  })

  it('round-trips all three through talk', () => {
    for (const one of ['t͡ʃa', 'a.b', 'a‿b']) {
      expect(talkToIpa(ipaToTalk(one))).toBe(one)
    }
  })
})
