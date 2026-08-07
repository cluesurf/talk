// Generate base/tokens.json: one 24-bit integer per canonical sound.
//
// Append-only. Existing assignments are kept exactly, new sounds take the
// next free code, so a sound's code never changes once assigned and a
// model trained on one release still reads the next.
//
// WHY 24 BITS. The encoding used to be one Hangul syllable per sound,
// which capped the inventory at the block's 11,172 code points. Letting
// length and stress attach to consonants, and adding the release and
// syllabicity slots, took the enumerated space past 120,000, so the cap
// stopped being theoretical. Three bytes hold 16,777,216 codes, which is
// two orders of magnitude beyond the inventory and still a fixed, compact
// width to serialize.
//
//   pnpm tokens

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { enumerateSounds } from '..'

const HERE = dirname(fileURLToPath(import.meta.url))
const FILE = resolve(HERE, '../../../../base/tokens.json')

/** Three bytes, so the highest assignable code. */
const LIMIT = 0xffffff

type Entry = { talk: string; code: number }

/**
 * The file as it was, in its recorded order.
 *
 * Rows are read positionally when they predate the integer format: the
 * first release keyed sounds by a Hangul character, and rewriting those to
 * integers by position keeps every sound's identity in the same order it
 * already had.
 */

type StoredEntry = { talk: string; code?: number; token?: string }

const stored = JSON.parse(readFileSync(FILE, 'utf8')) as StoredEntry[]

const byTalk = new Map<string, number>()
const used = new Set<number>()
const out: Entry[] = []

let migrated = 0

for (const [index, entry] of stored.entries()) {
  const code = entry.code ?? index

  if (entry.code === undefined) {
    migrated += 1
  }

  byTalk.set(entry.talk, code)
  used.add(code)
  out.push({ talk: entry.talk, code })
}

let cursor = 0

function nextCode(): number {
  while (used.has(cursor)) {
    cursor++
  }

  if (cursor > LIMIT) {
    throw new Error(`ran out of codes (past ${LIMIT})`)
  }

  const code = cursor

  used.add(code)
  cursor++

  return code
}

const sounds = enumerateSounds()

let added = 0

for (const sound of sounds) {
  if (byTalk.has(sound.talk)) {
    continue
  }

  const code = nextCode()

  byTalk.set(sound.talk, code)
  out.push({ talk: sound.talk, code })
  added++
}

writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n')

console.log(`[build-tokens] wrote ${FILE}`)
console.log(`  sounds enumerated: ${sounds.length}`)
console.log(`  total assigned:    ${out.length}`)
console.log(`  newly added:       ${added}`)
console.log(`  migrated to int:   ${migrated}`)
// Reduced rather than spread: `Math.max(...used)` overflows the call
// stack once the inventory runs to six figures.
let highest = 0
for (const code of used) {
  if (code > highest) highest = code
}

console.log(`  highest code:      ${highest} of ${LIMIT}`)
