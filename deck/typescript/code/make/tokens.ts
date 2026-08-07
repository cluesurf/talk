// Snapshot base/tokens.json: the computed machine code for every sound.
//
// Codes are no longer ASSIGNED here. They are derived from the model by
// `codeOf`, so this file generates nothing the library needs at runtime
// and is excluded from all three published packages.
//
// It exists as a REGRESSION CHECK. A computed code depends on the bases,
// the axes, the marks and their sort order, so adding a modifier or
// renaming a slot silently renumbers the space. Committing the snapshot
// makes that visible as a diff, and `test/tokens.test.ts` fails when the
// two disagree.
//
// Re-run and commit the diff when a change to the codes is intended:
//
//   pnpm tokens

import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { enumerateSounds, machine } from '..'

const HERE = dirname(fileURLToPath(import.meta.url))
const FILE = resolve(HERE, '../../../../base/tokens.json')

type Entry = { talk: string; code: number }

const out: Entry[] = []
const seen = new Map<number, string>()
const collisions: string[] = []

for (const sound of enumerateSounds()) {
  const [code] = machine({ text: sound.talk, type: 'tone', system: 'mesh' })

  if (code === undefined || code < 0) continue

  const prior = seen.get(code)

  if (prior !== undefined && prior !== sound.talk) {
    collisions.push(`${prior} and ${sound.talk} both -> ${code}`)
  } else {
    seen.set(code, sound.talk)
  }

  out.push({ talk: sound.talk, code })
}

out.sort((a, b) => a.code - b.code)

writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n')

console.log(`[snapshot] wrote ${FILE}`)
console.log(`  sounds:     ${out.length}`)
console.log(`  highest:    ${out[out.length - 1]?.code ?? 0}`)
console.log(`  collisions: ${collisions.length}`)

for (const line of collisions.slice(0, 5)) {
  console.log(`    ${line}`)
}

if (collisions.length) {
  process.exitCode = 1
}
