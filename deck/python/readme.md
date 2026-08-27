# cluesurf-talk (Python)

The Python implementation of **talk**, a phonetic encoding. It reads and
writes IPA, converts to and from **tone** (an ASCII notation), and turns
either into integer codes for compact, one-token-per-sound tokenization.

The LIBRARY is called talk; the NOTATION it defines is called tone. This
port is verified against the TypeScript reference on every one of
Phoible's 3,422 phonemes: the tone spelling, the machine codes and the
normalization all agree exactly.

## Install

```bash
pip install cluesurf-talk
```

## Usage

```python
import talk

talk.ipa_to_talk("tʰa")         # 't<h>a'
talk.talk_to_ipa("t<h>a")       # 'tʰa'
talk.readable("t<h>a")          # 'tʰa'   simplified, human-readable
talk.normalize_ipa("ʆ")         # 'ʃʲ'    folds the many ways IPA is written
talk.machine(text="t<h>a", type="tone", system="mesh")
talk.segment("t<h>a")           # Sounds, each a base plus its modifiers
talk.syllables("si$nk")         # syllables, each onset + nucleus + coda
```

## API

| function | direction |
| :--- | :--- |
| `ipa_to_talk(ipa)` | IPA to tone |
| `talk_to_ipa(tone)` | tone to IPA |
| `readable(tone)` | tone to the simplified reading form |
| `normalize_ipa(ipa)` | IPA to the one form the parser reads |
| `machine(text=, type=, system=)` | to integer codes |
| `machine_text(text=, type=, system=)` | to fixed-width characters, for indexes |
| `machine_bytes(text=, type=, system=)` | to fixed-width bytes |
| `parse_ipa(ipa)` | IPA to bases with their modifiers |
| `segment(tone)` | tone to `Sound`s |
| `enumerate_sounds()` | every canonical sound |
| `syllables(tone)` | tone to syllables, each a run of clusters |
| `read_segments(tone)` | tone to the sounds the syllabifier reasons about |
| `group_segments_into_clusters(marks)` | sounds to clusters |

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

```python
from talk import machine, machine_bytes, byte_width, size_of

# Same call shape, all six encodings.
machine(text="tʰa", type="ipa", system="seed")    # [18, 104, 0]
machine(text="tʰa", type="ipa", system="mesh")
machine(text="t<h>a", type="tone", system="band")
machine(text="t<h>a", type="tone", system="mesh")

machine_bytes(text="t<h>a", type="tone", system="mesh")  # 4 bytes
byte_width(type="ipa", system="mesh")   # 4
size_of(type="tone", system="mesh")     # 25584
```

For a single sound rather than a string, `encode_unit` and `decode_unit`
take a `Composition` and the same `type` / `system` pair.

Codes are COMPUTED, never looked up. A table for `ipa mesh` would be over
a gigabyte, so each code is a mixed-radix index: the base picks an offset
and each axis contributes a digit whose radix is how many marks that axis
offers that base. The only tables are the bases, the axes and a per-base
offset, a few thousand integers, so the package ships no code registry.

### Counting the space

```python
from talk import count_space, count_attested, report_space

count_space(type="ipa", system="mesh", space="producible")  # 166167936
count_attested(phonemes=corpus, type="tone", system="mesh")
report_space(corpus)   # all eighteen numbers
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
`ipa`.

## How it works

Everything derives from the data files in `code/talk/base/` and a
double-array trie scan, with no runtime dependencies.

- `phones.json` is the base inventory, one row per IPA symbol with its
  place, manner and voicing.
- `modifiers.json` is the affixes, each with the axis it varies and the
  rule saying where it can attach.
- `clusters/` is the syllable whitelists: which consonant runs may open a
  syllable, close one, or stand alone.

This port is checked against the TypeScript build rather than against cases
written here. `test_syllable_parity.py` reads
`deck/rust/test/fixture/parity.json`, which is TypeScript's own output, so
all three libraries are held to one answer.

Attachment rules are what keep the space honest. Aspiration needs a
plosive or a fricative and refuses the glottal place, so `hʰ` is never
generated. A nasal cannot take a nasal release.

## Development

```bash
uv sync
uv run pytest        # 122 tests
uv run ruff check
python code/make/copy_base.py   # refresh the shared data
```

The shared data lives in the repo-root `base/`; `copy_base.py` copies what
the runtime reads into this package. Edit the shared copy, not this one.

## License

MIT

## ClueSurf

Built by [ClueSurf](https://clue.surf).
