import { describe, expect, it } from 'vitest'

import talk, {
  enumerateSounds,
  ipaToTalk,
  machine,
  readable,
  segment,
  talkToIpa,
} from '../code'
import PHONES from '../base/phones.json'
import MACHINE from '../base/tokens.json'

const phones = PHONES as { ipa: string; talk: string }[]
const sounds = MACHINE as { talk: string; token: string }[]

describe('coverage', () => {
  it('maps every chart symbol to a talk spelling', () => {
    const unmapped = phones.filter(p => !p.talk)

    expect(unmapped).toEqual([])
  })

  it('maps every phone IPA back to its own talk spelling', () => {
    const drift: string[] = []

    for (const p of phones) {
      const t = ipaToTalk(p.ipa)

      if (t !== p.talk) {
        drift.push(`${p.ipa}: ${t} != ${p.talk}`)
      }
    }

    expect(drift).toEqual([])
  })
})

describe('machine encoding', () => {
  it('gives exactly one code point per phone', () => {
    const bad: string[] = []

    for (const p of phones) {
      if ([...machine(p.talk)].length !== 1) {
        bad.push(p.talk)
      }
    }

    expect(bad).toEqual([])
  })

  it('gives exactly one code point per enumerated sound', () => {
    const bad: string[] = []

    for (const s of enumerateSounds()) {
      if ([...machine(s.talk)].length !== 1) {
        bad.push(s.talk)
      }
    }

    expect(bad).toEqual([])
  })

  it('never assigns the same code point twice', () => {
    const seen = new Set<string>()
    const dupes: string[] = []

    for (const s of sounds) {
      if (seen.has(s.token)) {
        dupes.push(s.talk)
      }

      seen.add(s.token)
    }

    expect(dupes).toEqual([])
  })
})

describe('round trips', () => {
  const ipaWords = ['tʰa', 'kʷasˤo', 'ˈmama', 'ãtu', 'sˤuːl', 'nʲokʰ']

  it('ipa -> talk -> ipa is stable', () => {
    for (const w of ipaWords) {
      const t = ipaToTalk(w)

      // A second pass through talk -> ipa -> talk is a fixed point.
      expect(ipaToTalk(talkToIpa(t))).toBe(t)
    }
  })

  it('canonicalizes modifier order', () => {
    // Aspiration then labialization collapses to the canonical spelling.
    expect(ipaToTalk('tʰʷ')).toBe(ipaToTalk('tʷʰ'))
  })
})

describe('api', () => {
  it('exposes the conversions on the default export', () => {
    expect(talk.ipaToTalk('tʰ')).toBe('th~')
    expect(talk.talkToIpa('th~')).toBe('tʰ')
    expect(talk.readable('th~')).toBe('tʰ')
    expect([...talk.machine('th~')]).toHaveLength(1)
  })

  it('tokenizes into sounds with features', () => {
    const [first] = segment('th~a')

    expect(first?.base?.talk).toBe('t')
    expect(first?.modifiers.map(m => m.feature)).toEqual(['aspirated'])
  })

  it('carries symbols and numerals through', () => {
    expect(readable('=. 7')).toBe('. 7')
  })
})
