import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { enumerateSounds, machine } from '../code'

/**
 * The committed snapshot of every computed code.
 *
 * Codes are derived from the model rather than assigned, so nothing at
 * runtime reads this and no package ships it. It is here to catch SILENT
 * RENUMBERING: a code depends on the bases, the axes, the marks and their
 * sort order, so adding a modifier or renaming a slot moves codes without
 * any test noticing.
 *
 * Read from the shared `base/` rather than the copied one, since the copy
 * only carries what the runtime loads.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const FILE = resolve(HERE, '../../../base/tokens.json')

type Entry = { talk: string; code: number }

const snapshot = JSON.parse(readFileSync(FILE, 'utf8')) as Entry[]

describe('machine codes match the committed snapshot', () => {
  it('covers the same sounds', () => {
    const live = new Set(
      enumerateSounds()
        .filter(sound => machine({ text: sound.talk, type: 'tone', system: 'mesh' })[0]! >= 0)
        .map(sound => sound.talk),
    )
    const stored = new Set(snapshot.map(entry => entry.talk))

    const added = [...live].filter(talk => !stored.has(talk))
    const removed = [...stored].filter(talk => !live.has(talk))

    expect({ added: added.slice(0, 5), removed: removed.slice(0, 5) }).toEqual(
      { added: [], removed: [] },
    )
  })

  it('gives every sound the same code it had', () => {
    const drift: string[] = []

    for (const entry of snapshot) {
      const [code] = machine({ text: entry.talk, type: 'tone', system: 'mesh' })

      if (code !== entry.code) {
        drift.push(`${entry.talk}: ${entry.code} -> ${code}`)
      }
    }

    // If this fails the codes have moved. That is fine when intended:
    // re-run `pnpm tokens` and commit the diff. It is a bug when not.
    expect(drift.slice(0, 5)).toEqual([])
  })

  it('is still a bijection', () => {
    const byCode = new Map<number, string>()
    const collisions: string[] = []

    for (const entry of snapshot) {
      const prior = byCode.get(entry.code)

      if (prior !== undefined) {
        collisions.push(`${prior} and ${entry.talk} both -> ${entry.code}`)
      }

      byCode.set(entry.code, entry.talk)
    }

    expect(collisions).toEqual([])
  })
})
