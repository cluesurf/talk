// Generate base/machine.json: one Hangul code point per canonical sound.
//
// Append-only. Existing assignments are kept exactly, new sounds take the
// next free code point. A sound's code point never changes once assigned,
// so machine tokens stay stable across releases.
//
//   npx tsx code/make/machine.ts

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { enumerateSounds } from '..'

const HERE = dirname(fileURLToPath(import.meta.url))
const FILE = resolve(HERE, '../base/machine.json')

// Hangul Syllables block.
const START = 0xac00
const END = 0xd7a3

type Entry = { talk: string; token: string }

const existing = JSON.parse(readFileSync(FILE, 'utf8')) as Entry[]

const byTalk = new Map<string, string>()
const used = new Set<number>()

for (const entry of existing) {
  byTalk.set(entry.talk, entry.token)
  used.add(entry.token.codePointAt(0)!)
}

let cursor = START

function nextCodePoint(): number {
  while (used.has(cursor)) {
    cursor++
  }

  if (cursor > END) {
    throw new Error(
      `ran out of Hangul code points (past U+${END.toString(16)})`,
    )
  }

  const point = cursor

  used.add(point)
  cursor++

  return point
}

const sounds = enumerateSounds()
const out: Entry[] = [...existing]

let added = 0

for (const sound of sounds) {
  if (byTalk.has(sound.talk)) {
    continue
  }

  const token = String.fromCodePoint(nextCodePoint())

  byTalk.set(sound.talk, token)
  out.push({ talk: sound.talk, token })
  added++
}

writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n')

console.log(`[build-machine] wrote ${FILE}`)
console.log(`  sounds enumerated: ${sounds.length}`)
console.log(`  total assigned:    ${out.length}`)
console.log(`  newly added:       ${added}`)
console.log(
  `  code points used:  U+${START.toString(16)}..U+${(cursor - 1).toString(16)}`,
)
