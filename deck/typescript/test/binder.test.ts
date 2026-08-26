/**
 * The binder, `<B>`, which ties graphemes into one segment.
 *
 * WHY IT REPLACED A TIE CHARACTER. The IPA tie sits BETWEEN the letters it
 * joins and says nothing about how far it reaches: a reader infers two from
 * where it sits. Talk carried it as a passthrough symbol, `\=`, which kept
 * the character and still could not say what it bound.
 *
 * `<B>` names the count instead. Two by default, `<B3>` for three, and it
 * follows its material the way the modifier brackets do.
 *
 * One case per concept below, and one per shape the notation allows.
 */

import { describe, expect, it } from 'vitest'
import { ipaToTalk, talkToIpa, segment } from '../code'

const TIE = '\u{0361}'

describe('binding two', () => {
  it('reads an affricate as one segment', () => {
    expect(segment('tx<B>')).toHaveLength(1)
    expect(talkToIpa('tx<B>')).toBe(`t${TIE}ʃ`)
  })

  it('reads a doubly-articulated stop', () => {
    expect(talkToIpa('kp<B>')).toBe(`k${TIE}p`)
  })

  it('comes back from ipa with the count named', () => {
    expect(ipaToTalk(`t${TIE}ʃ`)).toBe('tx<B>')
    expect(ipaToTalk(`k${TIE}p`)).toBe('kp<B>')
  })
})

describe('binding more than two', () => {
  it('takes a run of ties as one group', () => {
    // `t͡s͡ʃ` is three letters tied twice. One segment of three, not two of
    // two, so the count says three rather than the notation repeating.
    expect(ipaToTalk(`t${TIE}s${TIE}ʃ`)).toBe('tsx<B3>')
    expect(talkToIpa('tsx<B3>')).toBe(`t${TIE}s${TIE}ʃ`)
    expect(segment('tsx<B3>')).toHaveLength(1)
  })

  it('writes no count for two, since two is the default', () => {
    expect(ipaToTalk(`t${TIE}ʃ`)).not.toContain('B2')
  })
})

describe('modifiers and the tie', () => {
  it('hoists a mark outside the binding', () => {
    // A tie asserts two LETTERS are one segment, so a mark between them
    // breaks the thing being asserted. Aspiration belongs to the whole
    // affricate rather than to its stop half.
    expect(talkToIpa('t<h>x<B>')).toBe(`t${TIE}ʃʰ`)
  })

  it('still reads a source that wrote the mark inside', () => {
    // Refusing to read a source is worse than reading it and returning the
    // canonical form.
    expect(ipaToTalk(`tʰ${TIE}ʃ`)).toBe('t<h>x<B>')
    expect(talkToIpa(ipaToTalk(`tʰ${TIE}ʃ`))).toBe(`t${TIE}ʃʰ`)
  })

  it('keeps a leading mark in front of the whole group', () => {
    expect(talkToIpa('<h>tx<B>')).toBe(`ʰt${TIE}ʃ`)
  })

  it('round-trips a mark written after the tie', () => {
    expect(ipaToTalk(`t${TIE}ʃʰ`)).toBe('tx<h><B>')
    expect(talkToIpa('tx<h><B>')).toBe(`t${TIE}ʃʰ`)
  })
})

describe('what is not a binding', () => {
  it('leaves a tie with nothing before it alone', () => {
    // A source that wrote it loosely. Dropping it would invent a segment
    // boundary the source never gave.
    expect(ipaToTalk(`${TIE}ʃ`)).toContain(TIE)
  })

  it('leaves a tie with nothing after it alone', () => {
    expect(ipaToTalk(`t${TIE}`)).toContain(TIE)
  })

  it('does not bind across a space', () => {
    expect(segment('tx<B> ka').length).toBeGreaterThan(1)
  })
})

describe('the binder sits among the other brackets', () => {
  it('does not disturb what follows it', () => {
    expect(talkToIpa('tx<B>a')).toBe(`t${TIE}ʃa`)
    expect(ipaToTalk(`t${TIE}ʃa`)).toBe('tx<B>a')
  })

  it('does not disturb what precedes it', () => {
    expect(talkToIpa('atx<B>')).toBe(`at${TIE}ʃ`)
  })
})
