# @cluesurf/talk (TypeScript)

The TypeScript implementation of **talk**, a phonetic encoding. It
converts between IPA, talk (an ASCII form), a readable simplified form,
and a token form that packs each sound into a single Hangul code point
for compact, one-token-per-sound tokenization.

This is the TypeScript version of
[`@cluesurf/talk`](https://github.com/cluesurf/talk). A Python port
builds on the same shared data.

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
talk.machine('th~a') // => one Hangul code point per sound
talk.syllables('txando') // => the word split into syllables
```

## API

Every function takes a string and returns a string, except `tokenize`,
`segment`, and `syllables`, which return structured results.

| function                       | direction                                       |
| :----------------------------- | :---------------------------------------------- |
| `ipaToTalk(ipa)`               | IPA to talk                                     |
| `talkToIpa(talk)`              | talk to IPA                                     |
| `readable(talk)`               | talk to the simplified reading form             |
| `machine(talk)`                | talk to one Hangul code point per sound         |
| `machineOutputs(talk)`         | the machine code points as an array             |
| `tokenize(talk)`               | talk to an array of `Sound`                     |
| `segment(talk)`                | the same as `tokenize`                          |
| `syllables(talk)`              | talk to its syllables                           |
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

## Syllables

`syllables` groups a talk string into syllables, each a list of clusters.
It is also available on its own subpath.

```ts
import { syllables } from '@cluesurf/talk/syllable'

syllables('txando').syllables // two syllables: txan, do
```

## How it works

The encoding is entirely data. The code reads three files and scans with
a trie.

- **base/phones.json** is the base sounds.
- **base/modifiers.json** is the affixes, with the rules for what they
  attach to.
- **base/tokens.json** is the frozen sound to Hangul code point map.

These live in `base/`, copied at build time from the single shared data
source that every language port of talk is built on.

A sound is a base plus its modifiers in a fixed slot order, so any set of
modifiers has exactly one talk spelling. IPA feeds one trie (IPA has no
base-versus-affix spelling clash). Talk feeds two: a starter trie for
bases and symbols, and a separate modifier trie, because a base like `h~`
(ɦ) shares its spelling with the aspiration modifier `h~` and only
position tells them apart.

## Token stability

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

## Development

The data in `base/` is copied from the shared source, so the source of
truth stays in one place across every language port.

```bash
pnpm copy:base   # populate base/ from the shared data
pnpm build       # copy:base, then bundle to host/ (ESM and CJS)
pnpm test        # run the suite
```

The suite checks full chart coverage, one code point per sound, no code
point assigned twice, round-trip stability, and syllabification parity.

## License

MIT

## ClueSurf

Part of the [ClueSurf](https://clue.surf) toolset.
