/**
 * Generate `../rust/test/fixture/parity.json`.
 *
 * TypeScript is the reference build, so the Rust port asserts itself against
 * this rather than against hand-written cases. Every enumerated sound is run
 * through each public entry point and the answer recorded.
 *
 * REGENERATE AFTER ANY NOTATION CHANGE. The fixture is TypeScript's output on
 * the day it was written, so a change to how a sound is spelled makes every
 * row stale at once and the Rust suite fails on all of them. That is the
 * intended signal, not a fault in the port.
 *
 * SAMPLED, BECAUSE THE FULL SET IS 161 MB. Every enumerated sound gives
 * about 780 bytes of expected output, and 206,922 of them is far past what
 * GitHub will take (100 MB) and past what anyone wants in a clone. The
 * committed fixture is therefore every `STRIDE`th case, which is a fixed,
 * reproducible spread across the whole inventory rather than a prefix.
 *
 * Pass `--full` to write the complete set to `tmp/parity-full.json`, which
 * is gitignored, for a deep check before a release.
 *
 *   pnpm exec tsx test/parity.ts
 *   pnpm exec tsx test/parity.ts --full
 */

import fs from 'fs'
import path from 'path'
import {
  enumerateSounds,
  machine,
  readable,
  segment,
  syllables,
  talkToIpa,
  ipaToTalk,
} from '../code'
import {
  readSegments,
  groupSegmentsIntoClusters,
} from '../code/syllable/syllable'

const FULL = process.argv.includes('--full')

/** A prime, so the sample is spread rather than landing on a pattern. */
const STRIDE = 31

const OUT = FULL
  ? path.join(import.meta.dirname, '../tmp/parity-full.json')
  : path.join(import.meta.dirname, '../../rust/test/fixture/parity.json')

type Cell = { form: string; text: string; code?: unknown; emphasis?: boolean }

const cell = (one: Cell) => ({
  form: one.form,
  text: one.text,
  code: String(one.code ?? ''),
  emphasis: one.emphasis === true,
})

const sounds = enumerateSounds()
const inputs = sounds.map(one => one.talk)

/**
 * Whether this build is known to disagree with the ports on an input.
 *
 * A JavaScript string is UTF-16, and the scanner walks it by code unit, so a
 * character outside the basic plane is read as its two surrogate halves and
 * comes back as two sounds. Rust and Python walk by character and return it
 * whole, which is the better answer.
 *
 * The ports assert against this fixture, so the disagreement is recorded
 * rather than papered over: a case marked here is skipped by the port, and
 * the COUNT of them is asserted, so a new divergence cannot appear unnoticed.
 */
const lossy = (input: string): boolean =>
  [...input].some(one => one.codePointAt(0)! > 0xffff)

const segmentCases = inputs.map(input => ({
  input,
  lossy: lossy(input),
  sounds: segment(input).map(one => ({
    talk: one.talk,
    ipa: one.ipa,
    simple: one.simple,
    machine: one.machine,
    kind: one.kind,
    base: one.base?.talk ?? null,
    modifiers: one.modifiers.map(mark => mark.talk),
    raw: one.raw,
  })),
}))

const convertCases = inputs.map(input => ({
  input,
  lossy: lossy(input),
  talkToIpa: talkToIpa(input),
  readable: readable(input),
  machine: [...machine({ text: input, type: 'tone', system: 'mesh' })],
}))

const ipaSeen = new Set<string>()
const ipaCases: { input: string; lossy: boolean; output: string }[] = []

for (const one of sounds) {
  if (ipaSeen.has(one.ipa)) {
    continue
  }

  ipaSeen.add(one.ipa)
  ipaCases.push({
    input: one.ipa,
    lossy: lossy(one.ipa),
    output: ipaToTalk(one.ipa),
  })
}

const syllableCases = inputs.map(input => {
  try {
    const marks = readSegments(input)
    const spans = groupSegmentsIntoClusters(marks)
    const result = syllables(input) as {
      syllables?: { emphasis?: boolean; clusters?: Cell[] }[]
    }

    return {
      input,
      lossy: lossy(input),
      ok: true,
      marks: marks.map(one => ({
        kind: (one as { type?: string }).type ?? null,
        value: (one as { value?: string }).value ?? null,
        tone: (one as { tone?: string }).tone ?? null,
        flags: Object.keys(one)
          .filter(
            key =>
              key !== 'type' &&
              key !== 'value' &&
              key !== 'tone' &&
              key !== 'talk' &&
              (one as Record<string, unknown>)[key] === true,
          )
          .sort(),
      })),
      clusters: spans.flat().map(one => cell(one as unknown as Cell)),
      syllables: (result.syllables ?? []).map(one => ({
        emphasis: one.emphasis === true,
        clusters: (one.clusters ?? []).map(cell),
      })),
    }
  } catch {
    return {
      input,
      lossy: lossy(input),
      ok: false,
      marks: [],
      clusters: [],
      syllables: [],
    }
  }
})

const sample = <T,>(rows: T[]): T[] =>
  FULL ? rows : rows.filter((_, at) => at % STRIDE === 0)

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(
  OUT,
  JSON.stringify({
    // The sample step, so a port can take the same rows out of its OWN
    // enumeration and compare like with like. Without it a sampled
    // `enumerate` list looks like a shorter inventory rather than a slice.
    stride: FULL ? 1 : STRIDE,
    segment: sample(segmentCases),
    convert: sample(convertCases),
    ipaToTalk: sample(ipaCases),
    enumerate: sample(
      sounds.map(one => ({
        talk: one.talk,
        ipa: one.ipa,
        simple: one.simple,
        kind: one.kind,
      })),
    ),
    syllables: sample(syllableCases),
  }),
  'utf8',
)

console.log(
  `segment=${segmentCases.length} convert=${convertCases.length} ipaToTalk=${ipaCases.length} enumerate=${sounds.length} syllables=${syllableCases.length} -> ${OUT}`,
)
