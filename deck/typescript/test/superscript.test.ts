/**
 * The IPA notations a symbol catalog writes that talk used to carry
 * through as `unknown`: the prenasalized stops beyond `ᵐ ⁿ ᵑ`, the velar
 * accompaniment written before a click, the pre-stopped nasals and
 * fricatives, the fricative releases, the whistled and middle-tilde marks,
 * the superscript letters of the Phonetic Extensions block, and a tone
 * written as a combining accent on its vowel. Every value below is the
 * sound a language's own orthography gives the letter, so each must read
 * with nothing left over, and spell back to itself.
 */

import { describe, expect, it } from 'vitest'
import { ipaToTalk, normalizeIpa, parseIpa, talkToIpa } from '../code'

/** The characters talk could not place, empty when it read everything. */

function unread(ipa: string): string[] {
  return parseIpa(ipa).flatMap(unit =>
    unit.role === 'unknown' ? [unit.text] : [],
  )
}

/** Whether the value survives IPA to talk to IPA unchanged. */

function roundTrips(ipa: string): boolean {
  return (
    talkToIpa(ipaToTalk(ipa)).normalize('NFC') ===
    normalizeIpa(ipa).normalize('NFC')
  )
}

describe('prenasalized stops', () => {
  const values = ['ᵐb', 'ᵑɡ', 'ᶮɟ', 'ᶬv', 'ᶯɖ', 'ᶰq', 'ᶮd͡ʒ', 'ᶯɖʐ', 'ᵐbʷ']

  it('reads every nasal superscript before a stop', () => {
    for (const value of values) expect(unread(value), value).toEqual([])
  })

  it('puts the nasal before the stop it belongs to', () => {
    expect(ipaToTalk('ᶮɟ')).toBe('<ny~>g<y>')
    expect(ipaToTalk('ᶬv')).toBe('<$m~>v')
    expect(ipaToTalk('ᶯɖ')).toBe('<N~>D')
  })

  it('leads the next stop inside a word, never trails the vowel', () => {
    // A vowel takes no nasal release, so the mark is the onset of what
    // follows: Swahili, Malagasy and Fula write it mid-word.
    expect(ipaToTalk('aᵐba')).toBe('a<m~>ba')
    expect(ipaToTalk('aᶮɟa')).toBe('a<ny~>g<y>a')
  })

  it('round-trips', () => {
    for (const value of values) expect(roundTrips(value), value).toBe(true)
  })
})

describe('clicks with a velar onset', () => {
  const values = ['ᵏǀ', 'ᵏǃʰ', 'ᶢǀʱ', 'ᶢǁʱ', 'ᵏǀʷʰ', 'ŋᵏǀʼ', 'ᵑǃ']

  it('reads the velar accompaniment written before the click', () => {
    for (const value of values) expect(unread(value), value).toEqual([])
  })

  it('binds the onset to the click, not to a nasal before it', () => {
    expect(ipaToTalk('ᵏǀ')).toBe('<k~>t!')
    expect(ipaToTalk('ŋᵏǀʼ')).toBe('$n<k~>t!<!>')
  })

  it('round-trips', () => {
    for (const value of values) expect(roundTrips(value), value).toBe(true)
  })
})

// The retroflex click of Central ǃKung, U+1DF0A since Unicode 14 (Miller
// and Sands, L2/20-115), which the Latin script page sounds from that
// proposal. Khoisanist work wrote it `‼` before the letter existed, and
// both spellings must reach the one phone `T!`.

describe('the retroflex click', () => {
  const values = ['𝼊', 'k𝼊', 'ᵏ𝼊', 'ᵑ𝼊', '𝼊ʰ']

  it('reads the letter alone and with an onset or release', () => {
    for (const value of values) expect(unread(value), value).toEqual([])
  })

  it('spells it as its own click, apart from the alveolar one', () => {
    expect(ipaToTalk('𝼊')).toBe('T!')
    expect(ipaToTalk('ǃ')).toBe('k!')
    expect(talkToIpa('T!')).toBe('𝼊')
  })

  it('folds the older doubled exclamation mark into the letter', () => {
    expect(ipaToTalk('‼')).toBe('T!')
    expect(normalizeIpa('k‼')).toBe('k𝼊')
  })

  it('round-trips', () => {
    for (const value of values) expect(roundTrips(value), value).toBe(true)
  })
})

describe('pre-stopped nasals and fricatives', () => {
  const values = ['ᵗn', 'ᶜɲ', 'ᵇv', 'ᵈz']

  it('reads the stop written before the segment', () => {
    for (const value of values) expect(unread(value), value).toEqual([])
    expect(ipaToTalk('ᵗn')).toBe('<t~>n')
  })

  it('round-trips', () => {
    for (const value of values) expect(roundTrips(value), value).toBe(true)
  })
})

describe('fricative releases and two diacritics', () => {
  const values = ['kˣ', 'sᶲ', 't͡sᶲ', 'z̤ᵝ', 's͎', 'z͎', 'b̴', 's̴']

  it('reads them', () => {
    for (const value of values) expect(unread(value), value).toEqual([])
    expect(ipaToTalk('kˣ')).toBe('k<H~>')
    expect(ipaToTalk('s͎')).toBe('s<w+>')
    expect(ipaToTalk('b̴')).toBe('b<$q>')
  })

  it('round-trips', () => {
    for (const value of values) expect(roundTrips(value), value).toBe(true)
  })
})

describe('superscript letters of the Phonetic Extensions', () => {
  const marks = ['ᵄ', 'ᵅ', 'ᶛ', 'ᶟ', 'ᶶ', 'ᶝ', 'ᶡ', 'ᶫ', 'ᶩ', 'ʴ', 'ʵ', 'ʶ', 'ᶴ', 'ᶭ', 'ᶼ', 'ᶽ']

  it('reads each on a segment', () => {
    for (const mark of marks) expect(unread(`t${mark}`), mark).toEqual([])
  })

  it('round-trips', () => {
    for (const mark of marks) expect(roundTrips(`t${mark}`), mark).toBe(true)
  })
})

describe('a tone written as an accent on its vowel', () => {
  const values = ['á', 'áː', 'ã́', 'ɛ̃́ː', 'ɪ́', 'ʌ́', 'r̩̂']

  it('reads the accent as the tone', () => {
    for (const value of values) expect(unread(value), value).toEqual([])
    expect(ipaToTalk('áː')).toBe('a<t4_>')
  })
})
