# @cluesurf/talk (TypeScript)

The TypeScript implementation of **talk**, a phonetic encoding. It
converts between IPA, talk (an ASCII form), a readable simplified form,
and a machine form that packs each sound into a single Hangul code point
for compact tokenization.

For what talk is and why, see the [repository readme](../../readme.md).
This document is the API.

## Install

```bash
npm install @cluesurf/talk
```

## Zero dependencies

The whole engine is one module, `code/index.ts`, plus three JSON data
files. It has no runtime dependencies. Conversion is a longest-match
trie scan, linear in the length of the input.

## Usage

```ts
import talk, {
  ipaToTalk,
  talkToIpa,
  machine,
  readable,
  tokenize,
} from '@cluesurf/talk'

ipaToTalk('tʰa') // => 'th~a'
talkToIpa('th~a') // => 'tʰa'
readable('th~a') // => 'tʰa'   (simplified, human-readable)
machine('th~a') // => one Hangul code point per sound

// The default export bundles the same functions.
talk.ipaToTalk('kʷasˤo') // => 'kw~asQ~o'
```

## API

Every function takes a string and returns a string, except `tokenize`
and `segment`, which return structured sounds.

| function                       | direction                                       |
| :----------------------------- | :---------------------------------------------- |
| `ipaToTalk(ipa)`               | IPA to talk                                     |
| `talkToIpa(talk)`              | talk to IPA                                     |
| `readable(talk)`               | talk to the simplified reading form             |
| `machine(talk)`                | talk to one Hangul code point per sound         |
| `machineOutputs(talk)`         | the machine code points as an array             |
| `tokenize(talk)`               | talk to an array of `Sound`                     |
| `segment(talk)`                | the same as `tokenize`                          |
| `combine(baseTalk, modifiers)` | a base and modifiers to canonical talk          |
| `enumerateSounds()`            | every valid canonical sound (used by the build) |

A `Sound` carries all four forms plus the phonetic breakdown:

```ts
type Sound = {
  talk: string
  ipa: string
  simple: string
  machine: string
  kind: 'consonant' | 'vowel' | 'symbol'
  base?: Phone // the base sound, absent for passthrough symbols
  modifiers: Modifier[] // the affixes, in canonical order
  raw?: boolean // true for passthrough symbols and unknown input
}
```

```ts
const [sound] = tokenize('th~a')
sound.base?.talk // => 't'
sound.modifiers.map(m => m.feature) // => ['aspirated']
```

## How it works

The encoding is entirely data. `code/index.ts` reads three files and
scans with a trie.

- **base/phones.json** is the base sounds.
- **base/modifiers.json** is the affixes, with the rules for what they
  attach to.
- **base/tokens.json** is the frozen sound to Hangul code point map.

See [`code/base/readme.md`](code/base/readme.md) for the data model, the
coverage guarantee, the provisional merges, and the open todos
(including pre-features like prenasalization and preaspiration).

A sound is a base plus its modifiers in a fixed slot order, so any set
of modifiers has exactly one talk spelling. IPA feeds one trie (IPA has
no base-versus-affix spelling clash). Talk feeds two: a starter trie for
bases and symbols, and a separate modifier trie, because a base like
`h~` (ɦ) shares its spelling with the aspiration modifier `h~` and only
position tells them apart.

## Machine stability

`machine()` assigns each canonical sound one Hangul code point from
`base/tokens.json`. That file is append-only: a code point is never
renumbered once assigned, so tokens stay stable across releases. Any
model or index built on them survives an upgrade.

Regenerate it after adding a sound or modifier:

```bash
npx tsx code/make/tokens.ts
```

The build keeps every existing assignment and gives new sounds the next
free code point. A run that adds nothing leaves the file byte for byte
identical.

## Tests

```bash
npx vitest run
```

The suite checks full chart coverage, one code point per sound, no code
point assigned twice, and round-trip stability.
