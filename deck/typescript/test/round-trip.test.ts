import { describe, expect, it } from 'vitest'

import { ipaToTalk, talkToIpa } from '../code'
import PHONES from '../base/phones.json'

// Ported from the v1 round-trip suite. talk is the canonical normal
// form, so converting a talk letter to IPA and back must return the
// same talk letter. This is the "no lossy data" guarantee. (IPA -> talk
// -> IPA is many-to-one on purpose and is not asserted.)
const phones = PHONES as { ipa: string; talk: string }[]
const inventory = [...new Set(phones.map(p => p.talk))]

describe('talk -> ipa -> talk is the identity', () => {
  it('has a non-trivial canonical inventory', () => {
    expect(inventory.length).toBeGreaterThan(100)
  })

  it('every canonical talk letter round-trips', () => {
    const broken: string[] = []

    for (const talk of inventory) {
      const ipa = talkToIpa(talk)
      const back = ipaToTalk(ipa)

      if (back !== talk) {
        broken.push(`${talk} -> ${ipa} -> ${back}`)
      }
    }

    expect(broken).toEqual([])
  })
})

describe('the rounded front-vowel pair is consistent both directions', () => {
  it('$e <-> ø round-trips', () => {
    expect(talkToIpa('$e')).toBe('ø')
    expect(ipaToTalk('ø')).toBe('$e')
  })

  it('~e <-> œ round-trips', () => {
    expect(talkToIpa('~e')).toBe('œ')
    expect(ipaToTalk('œ')).toBe('~e')
  })
})
