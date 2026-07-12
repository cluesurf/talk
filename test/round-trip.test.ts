// Round-trip equivalence of the two converters.
//
// `makeIpaToTalk` is many-to-one on purpose: several IPA symbols
// normalize to the same Talk letter (e.g. `ɡ` and `ɢ` both -> `g`,
// `χ` and `x` both -> `H`). So IPA -> Talk -> IPA is expected to be
// lossy and is NOT asserted.
//
// The lossless direction is Talk -> IPA -> Talk. Talk is the canonical
// normal form, so converting a Talk letter to IPA and back must return
// the same Talk letter. This is the "no lossy data" guarantee.

import { describe, expect, it } from 'vitest'
import { ipaToTalk, loadMappings, talkToIpa } from '~/test/helper'

// Two exotic phones whose Talk form has no unambiguous single-symbol
// IPA inverse, so they cannot round-trip today:
//   bbh! = ʙ̥ (voiceless bilabial trill): Talk `bb` -> IPA `bb`, and the
//          voiceless mark then devoices `b` to `p`.
//   t?   = ɗ̥ (voiceless dental implosive): makeTalkToIpa has no `?`
//          (implosion) case, so it throws.
const KNOWN_ROUND_TRIP_GAPS = new Set(['bbh!', 't?'])

describe('Talk -> IPA -> Talk is the identity', () => {
  const mappings = loadMappings()
  const talkLetters = [
    ...new Set([
      ...Object.values(mappings.consonants),
      ...Object.values(mappings.vowels),
    ]),
  ]

  it('has coverage: the canonical Talk inventory is non-trivial', () => {
    expect(talkLetters.length).toBeGreaterThan(100)
  })

  it('every canonical Talk letter round-trips (except known gaps)', () => {
    const broken: string[] = []

    for (const talkText of talkLetters) {
      if (KNOWN_ROUND_TRIP_GAPS.has(talkText)) {
        continue
      }

      const ipa = talkToIpa(talkText)

      if (ipa == null) {
        broken.push(`${talkText} -> IPA threw`)
        continue
      }

      const back = ipaToTalk(ipa)

      if (back !== talkText) {
        broken.push(`${talkText} -> ${ipa} -> ${back}`)
      }
    }

    expect(broken).toEqual([])
  })

  it('the known round-trip gaps really do still fail', () => {
    // If one starts passing, drop it from the allowlist above.
    const stillBroken: string[] = []

    for (const talkText of KNOWN_ROUND_TRIP_GAPS) {
      const ipa = talkToIpa(talkText)
      const back = ipa == null ? null : ipaToTalk(ipa)

      if (ipa != null && back === talkText) {
        stillBroken.push(talkText)
      }
    }

    expect(stillBroken).toEqual([])
  })
})

describe('the ø / œ pair is consistent across both directions', () => {
  it('a$ <-> ø round-trips', () => {
    expect(talkToIpa('a$')).toBe('ø')
    expect(ipaToTalk('ø')).toBe('a$')
  })

  it('e$ <-> œ round-trips', () => {
    expect(talkToIpa('e$')).toBe('œ')
    expect(ipaToTalk('œ')).toBe('e$')
  })
})
