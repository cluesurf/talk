// Emits `machine-gaps.csv`, the documented snapshot of every
// (IPA symbol + modifier) combination that `makeIpaToTalk` maps to a
// valid Talk string which `talk.machine()` then CANNOT encode into
// Hangul.
//
// These are the Talk letters that need a precomposed Hangul glyph
// added to `CONSONANTS` in `make/index.ts`. The feature marks that
// cause them (`~` dental, `@` tense, `!` ejection, `?` implosion,
// `Q~` pharyngealization, `.` stop) are suffix-only: they must be
// baked into a single base+feature glyph, they cannot stand alone or
// begin a token.
//
// The machine test asserts the live gap set equals this file, so the
// coverage hole is visible and cannot silently grow. Regenerate after
// adding glyphs:
//   tsx test/build-machine-gaps.ts

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { allCombos, comboTalk, machine, TEST_DIR } from '~/test/helper'

const seen = new Set<string>()
const rows: string[] = []

for (const combo of allCombos()) {
  const talkText = comboTalk(combo)
  if (talkText == null) {
    continue
  }
  if (machine(talkText) == null) {
    const line = `${combo.ipa},${talkText},${combo.feature}`
    if (!seen.has(line)) {
      seen.add(line)
      rows.push(line)
    }
  }
}

rows.sort()
const outPath = resolve(TEST_DIR, 'machine-gaps.csv')
writeFileSync(outPath, ['ipa,talk,feature', ...rows].join('\n') + '\n')
console.log(`[build-machine-gaps] wrote ${outPath} (${rows.length} gaps)`)
