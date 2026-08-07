# @cluesurf/talk (TypeScript)

The TypeScript implementation of **talk**, a phonetic encoding. It reads
and writes IPA, converts to and from **tone** (an ASCII notation), and
turns either into integer codes for compact, one-token-per-sound
tokenization.

The LIBRARY is called talk; the NOTATION it defines is called tone. This
is the reference implementation; the Rust and Python ports build on the
same shared data and are verified against it.

## Install

```bash
npm install @cluesurf/talk
```

## Usage

```ts
import talk from '@cluesurf/talk'

talk.ipaToTalk('tʰa') // => 'th~a'
talk.talkToIpa('th~a') // => 'tʰa'
talk.readable('th~a') // => 'tʰa'   (simplified, human-readable)
talk.normalizeIpa('ʆ') // => 'ʃʲ'   (folds the many ways IPA is written)
talk.machine({ text: 'th~a', type: 'tone', system: 'mesh' }) // => [20594, 7592]
talk.syllables('txando') // => the word split into syllables
```

## API

Most functions take a string and return a string. `tokenize`, `segment`
and `syllables` return structured results; `machine` returns integers.

| function | direction |
| :--- | :--- |
| `ipaToTalk(ipa)` | IPA to tone |
| `talkToIpa(tone)` | tone to IPA |
| `readable(tone)` | tone to the simplified reading form |
| `normalizeIpa(ipa)` | IPA to the one form the parser reads |
| `machine({ text, type, system })` | to integer codes |
| `machineText({ text, type, system })` | to fixed-width characters, for indexes |
| `machineBytes({ text, type, system })` | to fixed-width bytes |
| `parseIpa(ipa)` | IPA to bases with their modifiers |
| `segment(tone)` | tone to `Sound`s |
| `syllables(tone)` | tone to syllables |
| `enumerateSounds()` | every canonical sound |

`machine` and its two siblings take `type` (which notation) and `system`
(which tier), so the same call shape reaches all six encodings.

## Encodings

Two NOTATIONS crossed with three TIERS, so six encodings. Which one you
want follows from two questions: does it need to give the sound back
exactly, and how much detail does it need to carry.

**`ipa`** is lossless, so what goes in comes back out. Use it wherever
something downstream is compared to, displayed as, or exported as the
original.

**`tone`** is deliberately coarser: `O` covers six IPA vowels, `i$` covers
`ɨ`, `y` and `ʏ`. That is what makes the space small enough to be a
model's vocabulary, and it is why tone does not round-trip every
distinction IPA can write.

| tier | holds | `tone` | `ipa` | bytes |
| :--- | :--- | ---: | ---: | :--- |
| `seed` | one atomic unit: a base, or a single mark | 110 | 168 | 1 |
| `band` | a base plus its segmental marks | 2,161 | 7,432,128 | 2 / 3 |
| `mesh` | a base plus everything, suprasegmentals included | 25,426 | 166,167,936 | 2 / 4 |

```ts
import { machine, machineBytes, byteWidth, sizeOf } from '@cluesurf/talk'

// Same call shape, all six encodings.
machine({ text: 'tʰa', type: 'ipa', system: 'seed' }) // [18, 104, 0]
machine({ text: 'tʰa', type: 'ipa', system: 'mesh' }) // [49710672, 0]
machine({ text: 'th~a', type: 'tone', system: 'band' }) // [1778, 683]
machine({ text: 'th~a', type: 'tone', system: 'mesh' }) // [20594, 7592]

machineBytes({ text: 'th~a', type: 'tone', system: 'mesh' }) // 4 bytes
byteWidth({ type: 'ipa', system: 'mesh' }) // 4
sizeOf({ type: 'tone', system: 'mesh' }) // 25584
```

For a single sound rather than a string, `encodeUnit` and `decodeUnit`
take a `Composition` and the same `type` / `system` pair.

Codes are COMPUTED, never looked up. A table for `ipa mesh` would be over
a gigabyte, so each code is a mixed-radix index: the base picks an offset
and each axis contributes a digit whose radix is how many marks that axis
offers that base. The only tables are the bases, the axes and a per-base
offset, a few thousand integers, so the package ships no code registry and
this runs in a browser as happily as on a server.

### Choosing a tier

The number that decides it is not vocabulary size but how often a tier
MERGES two sounds some language contrasts. Across Phoible's 3,020
doculects, `tone mesh` still costs 29% of documented languages a
distinction, because talk's base inventory is deliberately coarse and no
tier setting recovers that. If a merged contrast would be a bug, use
`ipa`.

## Syllables

```ts
import { syllables } from '@cluesurf/talk'

syllables('txando') // => marks and clusters, grouped into syllables
```

## How it works

Everything derives from three data files in `base/` and a double-array
trie scan, with no runtime dependencies.

- `phones.json` is the base inventory, one row per IPA symbol with its
  place, manner and voicing.
- `modifiers.json` is the affixes, each with the axis it varies and the
  rule saying where it can attach.
- The tries are built once at load: one keyed by tone, one by IPA, one by
  X-SAMPA.

Attachment rules are what keep the space honest. Aspiration needs a
plosive or a fricative and refuses the glottal place, so `hʰ` is never
generated. A nasal cannot take a nasal release. Those rules are also what
make the counts above producible rather than merely writable.

## Code stability

A code is derived from the model, so it is stable as long as the bases,
the axes, the marks and their sort order are. Adding a modifier or
renaming a slot renumbers the space.

`base/tokens.json` is a committed SNAPSHOT of every code, excluded from
the published package. `test/tokens.test.ts` compares the live codes
against it, so a renumbering shows up as a failing test rather than
silently. When the change is intended, run `pnpm tokens` and commit the
diff.

## Development

```bash
pnpm install
pnpm test          # 264 tests
pnpm build         # bundles to host/
pnpm tokens        # refresh the code snapshot
```

The shared data lives in the repo-root `base/`, and `pnpm copy:base`
copies what the runtime reads into this package. Edit the shared copy, not
this one.

## License

MIT

## ClueSurf

Built by [ClueSurf](https://clue.surf).
