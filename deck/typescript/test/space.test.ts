import { describe, expect, it } from 'vitest'

import {
  CAPACITY,
  bytesFor,
  countAttested,
  countSpace,
  enumerateSounds,
  reportSpace,
  ipaToTalk,
  normalizeIpa,
  segment,
  talkToIpa,
  unitFor,
} from '../code'

describe('the three spaces', () => {
  it('orders them attested < producible < permitted', () => {
    // A sound can be writable without being pronounceable, and
    // pronounceable without anyone pronouncing it. The counts have to
    // reflect that ordering or the model is wrong.
    for (const type of ['ipa', 'tone'] as const) {
      for (const system of ['band', 'mesh'] as const) {
        const producible = countSpace({ type: type, system: system, space: 'producible' })
        const permitted = countSpace({ type: type, system: system, space: 'permitted' })

        expect(producible).toBeLessThan(permitted)
      }
    }
  })

  it('grows from seed to band to mesh', () => {
    for (const type of ['ipa', 'tone'] as const) {
      const seed = countSpace({ type: type, system: 'seed', space: 'producible' })
      const band = countSpace({ type: type, system: 'band', space: 'producible' })
      const mesh = countSpace({ type: type, system: 'mesh', space: 'producible' })

      expect(seed).toBeLessThan(band)
      expect(band).toBeLessThan(mesh)
    }
  })

  it('makes ipa larger than tone at every system past seed', () => {
    // talk is deliberately coarser, so its space must be the smaller one.
    for (const system of ['band', 'mesh'] as const) {
      expect(countSpace({ type: 'ipa', system: system, space: 'producible' })).toBeGreaterThan(
        countSpace({ type: 'tone', system: system, space: 'producible' }),
      )
    }
  })
})

describe('attachment rules do real work', () => {
  it('cuts the permitted space by orders of magnitude', () => {
    const producible = countSpace({ type: 'ipa', system: 'mesh', space: 'producible' })
    const permitted = countSpace({ type: 'ipa', system: 'mesh', space: 'permitted' })

    // Without rules a mark attaches anywhere, which is most of the space.
    expect(permitted / producible).toBeGreaterThan(100)
  })

  it('never generates aspiration on the glottal fricative', () => {
    // `hʰ` is the canonical impossible combination: `h` IS glottal
    // friction, so aspirating it is vacuous. The rule lives on
    // GENERATION, not parsing: the scanner still reads `hʰ` if a source
    // writes it, because reporting what a source said is not the same as
    // claiming it is pronounceable.
    const generated = enumerateSounds().some(sound => {
      const [first] = segment(sound.talk)

      return (
        first?.base?.talk === 'h' &&
        first.modifiers.some(mod => mod.feature === 'aspirated')
      )
    })

    expect(generated).toBe(false)
  })
})

describe('unitFor', () => {
  it('splits a phoneme into atomic units at seed', () => {
    expect(unitFor({ phoneme: 'pʰ', type: 'ipa', system: 'seed' })).toEqual(['p', 'ʰ'])
  })

  it('keeps a phoneme whole at mesh', () => {
    expect(unitFor({ phoneme: 'pʰ', type: 'ipa', system: 'mesh' })).toEqual(['pʰ'])
  })

  it('strips suprasegmentals at band', () => {
    expect(unitFor({ phoneme: 'aː', type: 'ipa', system: 'band' })).toEqual(['a'])
    expect(unitFor({ phoneme: 'a˥', type: 'ipa', system: 'band' })).toEqual(['a'])
  })

  it('keeps segmental marks at band', () => {
    expect(unitFor({ phoneme: 'pʰ', type: 'ipa', system: 'band' })).toEqual(['pʰ'])
  })
})

describe('countAttested', () => {
  it('counts distinct units, not occurrences', () => {
    const corpus = ['p', 'p', 'pʰ', 'b']

    expect(countAttested({ phonemes: corpus, type: 'ipa', system: 'mesh' })).toBe(3)
    // At seed the units are p, ʰ, b.
    expect(countAttested({ phonemes: corpus, type: 'ipa', system: 'seed' })).toBe(3)
  })

  it('never exceeds the producible space it draws from', () => {
    const corpus = ['p', 'pʰ', 'b', 'a', 'aː', 'n̪̥']

    for (const type of ['ipa', 'tone'] as const) {
      for (const system of ['band', 'mesh'] as const) {
        expect(countAttested({ phonemes: corpus, type: type, system: system })).toBeLessThanOrEqual(
          countSpace({ type: type, system: system, space: 'producible' }),
        )
      }
    }
  })
})

describe('reportSpace', () => {
  it('covers both notations at all three tiers', () => {
    const report = reportSpace()

    expect(report).toHaveLength(6)
    expect(report.every(row => row.attested === null)).toBe(true)
  })

  it('fills the attested column when given a corpus', () => {
    const report = reportSpace(['p', 'pʰ', 'a'])

    expect(report.every(row => typeof row.attested === 'number')).toBe(true)
  })
})

describe('capacity', () => {
  it('fits tone seed and band in their hangul groups, but not mesh', () => {
    // Attachment rules on the last nine modifiers cut `tone` by roughly
    // three quarters, which brought `band` back inside its character
    // space. `mesh` is still six times too large.
    expect(
      countSpace({ type: 'tone', system: 'seed', space: 'producible' }),
    ).toBeLessThan(CAPACITY.seed)
    expect(
      countSpace({ type: 'tone', system: 'band', space: 'producible' }),
    ).toBeLessThan(CAPACITY.band)
    expect(
      countSpace({ type: 'tone', system: 'mesh', space: 'producible' }),
    ).toBeGreaterThan(CAPACITY.mesh)
  })

  it('never fits ipa band or mesh in a character space', () => {
    for (const system of ['band', 'mesh'] as const) {
      expect(
        countSpace({ type: 'ipa', system, space: 'producible' }),
      ).toBeGreaterThan(CAPACITY[system])
    }
  })

  it('sizes bytes by the count', () => {
    expect(bytesFor(200)).toBe(1)
    expect(bytesFor(70000)).toBe(3)
    expect(
      bytesFor(
        countSpace({ type: 'ipa', system: 'mesh', space: 'producible' }),
      ),
    ).toBe(4)
  })
})

describe('canonical mark order', () => {
  it('collapses marks that differ only by order', () => {
    // Combining marks sharing a Unicode class keep their input order under
    // NFD, so the same sound arrives as two strings. Worse, the parser
    // matches greedily: `n̥̪` would read as the phone `n̥` plus dental and
    // `n̪̥` as the phone `n̪` plus voiceless, giving two spellings.
    expect(normalizeIpa('n̥̪')).toBe(normalizeIpa('n̪̥'))
    expect(ipaToTalk('n̥̪')).toBe(ipaToTalk('n̪̥'))
  })

  it('orders spacing modifiers too', () => {
    expect(ipaToTalk('kʷʰ')).toBe(ipaToTalk('kʰʷ'))
  })

  it('never moves a leading modifier', () => {
    // `ʰk` is pre-aspirated and `kʰ` post-aspirated. Sorting them together
    // would silently change what a source said.
    expect(normalizeIpa('ʰk')).not.toBe(normalizeIpa('kʰ'))
  })

  it('stays idempotent', () => {
    for (const ipa of ['n̥̪', 'kʷʰ', 'ã̯', 'pʰ']) {
      expect(normalizeIpa(normalizeIpa(ipa))).toBe(normalizeIpa(ipa))
    }
  })
})

describe('pre-modifiers', () => {
  it('keeps pre-aspiration instead of dropping it', () => {
    // `ʰk` used to come back as plain `k`: a modifier before any base had
    // nowhere to go, so the distinction vanished silently.
    expect(ipaToTalk('ʰk')).toBe('h~k')
    expect(talkToIpa('h~k')).toBe('ʰk')
  })

  it('distinguishes pre from post', () => {
    expect(ipaToTalk('ʰk')).not.toBe(ipaToTalk('kʰ'))
    expect(ipaToTalk('ⁿd')).not.toBe(ipaToTalk('dⁿ'))
  })

  it('lets attachment decide an ambiguous sequence', () => {
    // The same three characters split two ways. A plosive carries
    // aspiration, so `pʰk` is `pʰ` then `k`. A vowel and a fricative do
    // not, so the mark must belong to what follows.
    const post = segment(ipaToTalk('pʰk'))
    expect(post[0]?.modifiers.map(m => m.feature)).toEqual(['aspirated'])
    expect(post[1]?.pre).toEqual([])

    // A fricative CAN be aspirated (Burmese `sʰ`, Tibetan `ɕʰ`), so the
    // cases that move are the ones no rule allows: a vowel and a nasal.
    for (const ipa of ['aʰk', 'mʰk']) {
      const pre = segment(ipaToTalk(ipa))
      expect(pre[0]?.modifiers).toEqual([])
      expect(pre[1]?.pre.map(m => m.feature)).toEqual(['aspirated'])
    }
  })

  it('reads the same way from either type', () => {
    for (const ipa of ['pʰk', 'aʰk', 'mʰk', 'sʰ', 'ʰk', 'kʰ', 'ⁿd', 'dⁿ']) {
      expect(talkToIpa(ipaToTalk(ipa)).normalize('NFD')).toBe(
        ipa.normalize('NFD'),
      )
    }
  })

  it('carries a dangling affix through rather than dropping it', () => {
    // Nothing follows, so the mark modifies nothing and cannot be a
    // pre-modifier. It comes back as its own unit, which shows the input
    // was incomplete instead of losing it silently.
    expect(segment('h~').map(sound => sound.talk).join('')).toBe('h~')
  })
})
