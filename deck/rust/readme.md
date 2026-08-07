# cluesurf-talk (Rust)

The Rust implementation of **talk**, a phonetic encoding. It reads and
writes IPA, converts to and from **tone** (an ASCII notation), and turns
either into integer codes for compact, one-token-per-sound tokenization.

The LIBRARY is called talk; the NOTATION it defines is called tone. This
port is verified against the TypeScript reference on every one of
Phoible's 3,422 phonemes: the tone spelling, the machine codes and the
normalization all agree exactly.

## Install

```bash
cargo add cluesurf-talk
```

The crate is published as `cluesurf-talk` and imported as `talk`.

## Usage

```rust
use talk::{Notation, Tier, ipa_to_talk, machine, normalize_ipa, readable, talk_to_ipa};

assert_eq!(ipa_to_talk("tʰa"), "th~a");
assert_eq!(talk_to_ipa("th~a"), "tʰa");
assert_eq!(readable("th~a"), "tʰa");

// Folds the many ways IPA gets written into the one form the parser reads.
assert_eq!(normalize_ipa("ʆ"), "ʃʲ");

// One integer per sound, at the notation and tier you ask for.
assert_eq!(
    machine("th~a", Notation::Tone, Tier::Mesh),
    vec![20594, 7592]
);
```

## API

| function | direction |
| :--- | :--- |
| `ipa_to_talk(ipa)` | IPA to tone |
| `talk_to_ipa(tone)` | tone to IPA |
| `readable(tone)` | tone to the simplified reading form |
| `normalize_ipa(ipa)` | IPA to the one form the parser reads |
| `machine(text, type, system)` | to integer codes |
| `machine_text(text, type, system)` | to fixed-width characters, for indexes |
| `machine_bytes(text, type, system)` | to fixed-width bytes |
| `parse_ipa(ipa)` | IPA to bases with their modifiers |
| `segment(tone)` | tone to `Sound`s |
| `syllables(tone)` | tone to syllables |
| `enumerate_sounds()` | every canonical sound |

## Encodings

Two NOTATIONS crossed with three TIERS, so six encodings. Which one you
want follows from two questions: does it need to give the sound back
exactly, and how much detail does it need to carry.

**`Notation::Ipa`** is lossless, so what goes in comes back out. Use it
wherever something downstream is compared to, displayed as, or exported as
the original.

**`Notation::Tone`** is deliberately coarser: `O` covers six IPA vowels,
`i$` covers `ɨ`, `y` and `ʏ`. That is what makes the space small enough to
be a model's vocabulary, and it is why tone does not round-trip every
distinction IPA can write.

| tier | holds | `tone` | `ipa` | bytes |
| :--- | :--- | ---: | ---: | :--- |
| `Seed` | one atomic unit: a base, or a single mark | 110 | 168 | 1 |
| `Band` | a base plus its segmental marks | 2,161 | 7,432,128 | 2 / 3 |
| `Mesh` | a base plus everything, suprasegmentals included | 25,426 | 166,167,936 | 2 / 4 |

```rust
use talk::{Notation, Tier, byte_width, machine, machine_bytes, size_of};

// Same call shape, all six encodings.
machine("tʰa", Notation::Ipa, Tier::Seed);   // [18, 104, 0]
machine("tʰa", Notation::Ipa, Tier::Mesh);   // [49710672, 0]
machine("th~a", Notation::Tone, Tier::Band); // [1778, 683]
machine("th~a", Notation::Tone, Tier::Mesh); // [20594, 7592]

machine_bytes("th~a", Notation::Tone, Tier::Mesh); // 4 bytes
assert_eq!(byte_width(Notation::Ipa, Tier::Mesh), 4);
assert_eq!(size_of(Notation::Tone, Tier::Mesh), 25584);
```

For a single sound rather than a string, `encode_unit` and `decode_unit`
take a `Composition` and the same notation / tier pair.

Codes are COMPUTED, never looked up. A table for `ipa mesh` would be over
a gigabyte, so each code is a mixed-radix index: the base picks an offset
and each axis contributes a digit whose radix is how many marks that axis
offers that base. The only tables are the bases, the axes and a per-base
offset, a few thousand integers, so the crate ships no code registry.

### Counting the space

```rust
use talk::{Notation, Space, Tier, count_attested, count_space};

count_space(Notation::Ipa, Tier::Mesh, Space::Producible); // 166_167_936
count_attested(corpus, Notation::Tone, Tier::Mesh);
```

Three counts matter and they differ by orders of magnitude. ATTESTED is
what some documented language is recorded saying. PRODUCIBLE is what a
human vocal tract can make. PERMITTED is what the notation can write,
articulation ignored. A conlang tool wants the middle one, because a
designed language draws from sounds nobody happens to use: only 2,161 of
`tone mesh`'s 25,426 producible sounds are attested anywhere.

### Choosing a tier

The number that decides it is not vocabulary size but how often a tier
MERGES two sounds some language contrasts. Across Phoible's 3,020
doculects, `tone mesh` still costs 29% of documented languages a
distinction, because talk's base inventory is deliberately coarse and no
tier setting recovers that. If a merged contrast would be a bug, use
`Notation::Ipa`.

## Syllables

```rust
use talk::syllables;

let word = syllables("txando");
```

## How it works

Everything derives from two data files in `base/` and a double-array trie
scan. The tries are built once behind a `OnceLock`, so the cost is paid on
first use and never again.

- `phones.json` is the base inventory, one row per IPA symbol with its
  place, manner and voicing.
- `modifiers.json` is the affixes, each with the axis it varies and the
  rule saying where it can attach.

Attachment rules are what keep the space honest. Aspiration needs a
plosive or a fricative and refuses the glottal place, so `hʰ` is never
generated. A nasal cannot take a nasal release.

`base/` is committed rather than generated at build time, because `cargo
package` refuses to ship files git does not track. `build.rs` copies it
from the repo-root `base/`, so a change to the shared data leaves a diff
here to commit.

## Development

```bash
cargo test      # 94 tests
cargo clippy
cargo fmt
```

The parity suite compares this port against a fixture generated by the
TypeScript build, which is what catches divergence between the two.

## License

MIT

## ClueSurf

Built by [ClueSurf](https://clue.surf).
