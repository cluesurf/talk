import { describe, expect, it } from 'vitest'

import talk, {
  enumerateSounds,
  ipaToTalk,
  machine,
  normalizeIpa,
  readable,
  segment,
  talkToIpa,
} from '../code'
import PHONES from '../base/phones.json'

const phones = PHONES as { ipa: string; talk: string }[]

describe('coverage', () => {
  it('maps every chart symbol to a talk spelling', () => {
    const unmapped = phones.filter(p => !p.talk)

    expect(unmapped).toEqual([])
  })

  it('maps every phone IPA back to its own talk spelling', () => {
    const drift: string[] = []

    for (const p of phones) {
      // A phone distinguished ONLY by a mark this encoding drops (the
      // raised `˔` on `ɹ̠˔`, `̝` on `ʟ̝`) collapses onto its plain base by
      // design, so it has no talk spelling of its own to come back to.
      // `normalizeIpa` changing the string is exactly that condition.
      if (normalizeIpa(p.ipa) !== p.ipa.normalize('NFD')) {
        continue
      }

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
      if ([...machine({ text: p.talk, type: 'tone', system: 'mesh' })].length !== 1) {
        bad.push(p.talk)
      }
    }

    expect(bad).toEqual([])
  })

  it('gives exactly one code point per enumerated sound', () => {
    const bad: string[] = []

    for (const s of enumerateSounds()) {
      if ([...machine({ text: s.talk, type: 'tone', system: 'mesh' })].length !== 1) {
        bad.push(s.talk)
      }
    }

    expect(bad).toEqual([])
  })

  it('never gives two sounds the same code', () => {
    // The registry is gone, so this checks the COMPUTED codes are still a
    // bijection: what `tokens.json` used to guarantee by construction now
    // has to hold by arithmetic.
    const seen = new Map<number, string>()
    const dupes: string[] = []

    for (const sound of enumerateSounds()) {
      const [code] = machine({ text: sound.talk, type: 'tone', system: 'mesh' })

      if (code === undefined || code < 0) continue

      const prior = seen.get(code)

      if (prior !== undefined && prior !== sound.talk) {
        dupes.push(`${prior} and ${sound.talk} both -> ${code}`)
      } else {
        seen.set(code, sound.talk)
      }
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
    expect([...talk.machine({ text: 'th~', type: 'tone', system: 'mesh' })]).toHaveLength(1)
  })

  it('tokenizes into sounds with features', () => {
    const [first] = segment('th~a')

    expect(first?.base?.talk).toBe('t')
    expect(first?.modifiers.map(m => m.feature)).toEqual(['aspirated'])
  })

  it('carries symbols and numerals through', () => {
    expect(readable('\\. 7')).toBe('. 7')
  })
})
