# Split test.ts and add IPA <-> Talk <-> Hangul coverage tests

## Summary

Splits the old top-level `test.ts` visual runner into a real vitest
suite under `test/`, and adds coverage that verifies the IPA <-> Talk
converters are equivalent and that the Talk -> Hangul (`machine`)
encoding is lossless where it can be.

## What changed

- **`test.ts`** reduced to a tombstone (its `parse()` cases moved to
  `test/syllable.test.ts`). Safe to `git rm`.
- **`test/syllable.test.ts`** — the syllabification cases, now
  assertions: each checks letters are preserved and the split matches.
- **`test/coverage.test.ts`** — every `consonants.csv` / `vowels.csv`
  symbol either maps through `makeIpaToTalk` or is listed in
  `missing.csv`; `mappings.json` is asserted in sync with the live
  conversion.
- **`test/round-trip.test.ts`** — `Talk -> IPA -> Talk` is the identity
  over the canonical Talk inventory (the lossless direction; IPA -> Talk
  is many-to-one by design so it is not asserted).
- **`test/machine.test.ts`** — glyph-table integrity (unique `i`, unique
  single-codepoint `x`), machine injectivity (distinct Talk -> distinct
  Hangul), and a pinned coverage snapshot.
- **`test/helper.ts`** — shared CSV/JSON loaders and combo generators.
- **`test/build-machine-gaps.ts`** + **`test/machine-gaps.csv`** — the
  snapshot of real phones with no Hangul glyph. Now empty (all closed),
  kept as a regression guard.
- **`make/index.ts`** — added 12 precomposed glyphs (Hangul U+CF84..CF8F)
  that close all 20 machine-encoding gaps: dentals `b~ p~ m~ s~ z~ l~ S~`,
  voiceless implosive `t?`, and ejectives `c! F! ky~! xy~!`. Verified the
  longest-match tokenizer still yields the old readings (`cç -> ky~hy~`,
  `ɕ -> xy~`) and that every new glyph has a unique key and codepoint.
- **`make/ipa.ts`** — fixed a `ø` / `œ` swap: `makeTalkToIpa` mapped
  `a$ -> œ` and `e$ -> ø`, the opposite of `makeIpaToTalk` /
  `mappings.json`, so those two vowels never round-tripped. Now
  `a$ <-> ø` and `e$ <-> œ` both ways.
- **`vitest.config.ts`** — added the `~/*` alias so tests import from
  `~/make` like the source does.
- **`package.json`** — `test` now runs `vitest run`; added `test:watch`,
  `mappings`, and `machine-gaps` (snapshot regen).

## Findings

1. **20 real phones had no Hangul glyph, now closed.** They came from
   suffix-only feature marks with no precomposed glyph on the base:
   dental `~` (`p̪ b̪ s̪ z̪ l̪ ɬ̪ ɱ` and the dental affricates), ejective
   `!` (`cʼ ɕʼ ɸʼ θʼ tɕʼ p̪fʼ t̪θʼ`), and implosion `?` (`ɗ̥`). Twelve
   atomic glyphs cover all twenty (the affricates reuse existing letters,
   e.g. `p~f!` = new `p~` + existing `f!`). `machine-gaps.csv` is now
   empty. Vowels were already complete (0 failures across every
   suprasegmental combo).

   The readable `o` forms for the new glyphs follow the nearest existing
   convention (dentals drop the mark like `t~ -> t`, implosion uses the
   grave like `b?`, ejectives use the acute like `s!`). They are the one
   cosmetic guess here and are trivial to adjust; the `i` keys and Hangul
   `x` codepoints are what make `machine()` lossless.

2. **2 exotic phones still do not round-trip** (allow-listed in
   `round-trip.test.ts`, a separate `Talk -> IPA -> Talk` concern from
   the machine encoding): `ʙ̥` (`bbh! -> bb̥ -> bp`) and `ɗ̥` (`t?`, since
   `makeTalkToIpa` has no `?` inverse). Left as-is rather than guessed.

## How it was tested

```
pnpm test            # vitest run -> 5 files, 167 tests, all passing
tsx test/build-machine-gaps.ts   # regenerates the snapshot (20 gaps)
```

`tsc --skipLibCheck` (the build's config) reports no errors in the
package or test code. The remaining `tsc` noise is vitest/vite type
resolution under `moduleResolution: node`, which is unrelated (vitest
runs via esbuild).

## Follow-ups

- Optionally give `makeTalkToIpa` a `?` (implosion) inverse so `ɗ̥`
  round-trips, and map `bb -> ʙ` for the voiceless bilabial trill.
- Sanity-check the readable `o` forms on the 12 new glyphs.
- `git rm test.ts` (tombstone).
