# cluesurf-talk (Rust)

The Rust implementation of **talk**, a phonetic encoding. It converts
between IPA, talk (an ASCII form), a readable simplified form, and a
token form that packs each sound into a single Hangul code point for
compact, one-token-per-sound tokenization.

This is the Rust port of
[`@cluesurf/talk`](https://github.com/cluesurf/talk). Every port shares
one source of truth for the phonetic data.

## Install

```bash
cargo add cluesurf-talk
```

The crate is published as `cluesurf-talk` and imported as `talk`.

## Usage

```rust
use talk::{ipa_to_talk, machine, readable, syllables, talk_to_ipa};

assert_eq!(ipa_to_talk("tʰa"), "th~a");
assert_eq!(talk_to_ipa("th~a"), "tʰa");
assert_eq!(readable("th~a"), "tʰa");

// One Hangul code point per sound.
assert_eq!(machine("th~a").chars().count(), 2);

// A word split into syllables and clusters.
let parsed = syllables("txando").expect("valid talk");
assert_eq!(parsed.syllables.len(), 3);
```

Break a string into sounds with their features:

```rust
for sound in talk::segment("th~a") {
    println!(
        "{} {:?} {:?}",
        sound.talk,
        sound.kind,
        sound
            .modifiers
            .iter()
            .map(|m| m.feature.as_str())
            .collect::<Vec<_>>()
    );
}
```

## API

Every function takes a `&str`. The conversions return a `String`;
`segment`, `tokenize`, and `syllables` return structured results.

| function                          | direction                               |
| :-------------------------------- | :-------------------------------------- |
| `ipa_to_talk(ipa)`                | IPA to talk                             |
| `talk_to_ipa(talk)`               | talk to IPA                             |
| `readable(talk)`                  | talk to the simplified reading form     |
| `machine(talk)`                   | talk to one Hangul code point per sound |
| `machine_outputs(talk)`           | the same, one entry per sound           |
| `segment(talk)` / `tokenize(talk)`| talk to a `Vec<Sound>`                  |
| `syllables(talk)`                 | talk to syllables and clusters          |
| `enumerate_sounds()`              | the full canonical sound inventory      |
| `combine(base_talk, mods)`        | base and modifiers to canonical talk    |

`syllables` returns `Result`, because a string the segment table does
not cover has no syllabification. Everything else carries an unknown
character through untouched.

## Differences from the TypeScript build

One, and it only shows up on input talk never contains. The TypeScript
build indexes strings by UTF-16 code unit, so an unknown character
outside the Basic Multilingual Plane comes back as two sounds, one per
surrogate half. Rust indexes by scalar value, so it comes back as one
sound holding the whole character. Every string-level conversion agrees
either way, because the halves rejoin when the sounds are joined back
into a string.

## Development

The data in `base/` is copied from the shared source by `build.rs`, so
the source of truth stays in one place across every language port. A
published crate carries that copy and builds without the repo.

```bash
cargo test     # run the suite
cargo clippy --all-targets
```

The suite checks full chart coverage, one code point per sound, no code
point assigned twice, round-trip stability, and syllabification parity
with v1.

It also runs a differential parity check against the TypeScript build.
`test/parity.ts` captures that build's output over a corpus of 4,347
talk inputs and 3,626 IPA inputs, and `test/parity.rs` asserts this port
returns the same thing for every one. Regenerate the fixture after any
change to the shared data:

```bash
npx tsx test/parity.ts
```

## License

MIT

## ClueSurf

Part of the [ClueSurf](https://clue.surf) toolset.
