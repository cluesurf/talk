<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>

<p align='center'>
  <img src='https://github.com/cluesurf/talk/blob/make/view/talk.svg?raw=true' height='160'>
</p>

<h3 align='center'>
  talk
</h3>
<p align='center'>
  A phonetic sequence encoding Θ
</p>

<br/>
<br/>
<br/>

## Overview

**Talk** is a phonetic front end and tokenization layer for speech and
language models. Its **machine** encoding turns text or IPA into one
integer per sound, so a model gets a finite, normalized phone vocabulary
instead of raw IPA or byte-pair fragments that split a pronunciation
across several tokens. If you build TTS, ASR, G2P, or any
multilingual pipeline that has to reason about how words sound, this
gives you one clean token per phone that converts losslessly to and from
IPA, plus syllabification for free.

It is also a readable, keyboard-typable **romanization**. The notation is
called **tone**, and it uses the Latin script with diacritics to encode
most of Earth's natural language features, enough that you can write every language in the same
Latin-oriented system and land close to a realistic pronunciation,
including nasalized vowels, tense consonants, clicks, and tones. It
reads like the pronunciation guides people already know, so a
non-linguist can get the gist without special training.

There are two NOTATIONS and one machine form:

- **tone**: the ASCII notation, for writing in a text editor without
  fancy symbols. Deliberately coarser than IPA.
- **ipa**: read and written losslessly, for anything that has to give
  back exactly what a source said.
- **machine**: one integer per sound, for compact tokenization. Useful
  for AI models, indexes and lookups.

A note on names: the LIBRARY is `talk`, the NOTATION it defines is
`tone`. Older docs use "talk" for both.

Talk is not trying to compete with or replace IPA. It is for writing
pronunciations in plain ASCII and tokenizing them in a standard way for
tools like NLP, AI, and databases. It aims for about 95% accuracy, which
is plenty for a tokenizer or a learner, and it speaks IPA fluently for
the cases where you need the last 5%.

## Libraries

Implementations of Talk, one per language. Each converts between IPA,
tone, and the machine (token) encoding, and each carries the tiered codec.
The TypeScript and Rust libraries also split words into syllables.

All three are verified against the same fixture: they agree on the talk
spelling, machine codes and normalization of every one of Phoible's 3,422
phonemes.

| Language   | Library                             | Syllables | Tiers | Status |
| :--------- | :---------------------------------- | :-------- | :---- | :----- |
| TypeScript | [`@cluesurf/talk`](deck/typescript) | ✅        | ✅    | ✅     |
| Rust       | [`cluesurf-talk`](deck/rust)        | ✅        | ✅    | ✅     |
| Python     | [`cluesurf-talk`](deck/python)      |           | ✅    | ✅     |

## Examples

The `machine` column is the machine encoding: `talk.machine(...)` gives
one 24-bit integer per sound, base plus all its modifiers, so a whole
word becomes a compact array with one entry per sound rather than per
character.

| tone            | machine                                        |
| :-------------- | :--------------------------------------------- |
| txando^         | 9018 27318 81544 1152 12846 80393              |
| siqk            | 22530 79048 6864 19074                         |
| mh!im           | 96 79048 0                                     |
| t!arEba         | 9114 81544 45342 80776 8586 81544              |
| s\'oQya\~te     | 22530 22338 80392 22146 41706 81640 9018 80008 |

## Encoding

Here are the modifiers on consonants, vowels, and symbols (like
punctuation), and how they look in ASCII.

### Modifiers

There are a few affixes on consonants and vowels. There are 5 tone
affixes (extra low, low, neutral, high, and extra high), which can be
combined in standard ways.

| category  | symbol  | meaning                                                                                                                              |
| :-------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------- |
| consonant | h~      | Aspiration                                                                                                                           |
| consonant | w~      | Labialization                                                                                                                        |
| consonant | y~      | Palatalization                                                                                                                       |
| consonant | G~      | Velarization                                                                                                                         |
| consonant | Q~      | Pharyngealization                                                                                                                    |
| consonant | y$~     | Labial-palatalization (ᶣ)                                                                                                            |
| consonant | n~      | Nasal release (ⁿ)                                                                                                                    |
| consonant | l~      | Lateral release (ˡ)                                                                                                                  |
| consonant | g~      | Glottalization (ˀ)                                                                                                                   |
| consonant | $       | Dental (`n$` is n̪, `t$` is t̪)                                                                                                        |
| consonant | h!      | Voiceless (`n$h!` is n̪̥)                                                                                                              |
| consonant | !       | Makes consonant ejective                                                                                                             |
| consonant | ?       | Makes consonant implosive                                                                                                            |
| consonant | @       | Syllabic (`n@` is n̩)                                                                                                                 |
| consonant | .       | Makes consonant a stop consonant (korean, so when you end on `t.`, it is making the mouth shape of `t` but not really pronouncing it) |
| consonant | \*      | Click consonant: `p*` (ʘ), `t*` (ǀ), `k*` (ǃ), `l*` (ǁ), `d*` (ǂ), `c*` (𝼊), `K*` (ʞ), `R*` (‼ retroflex)                             |
| consonant | doubled | Rolled / trilled: `bb` (ʙ), `rr` (r), `RR` (ɽr), `GG` (ʀ), `rrh!` (r̥)                                                                |
| consonant | capital | Consonant variant                                                                                                                    |
| both      | ^       | Stress (after any vowel or consonant)                                                                                                |
| both      | \_      | Long / geminated (after any vowel or consonant: `b_` is bː)                                                                          |
| both      | \_!     | Half-long (ˑ)                                                                                                                        |
| both      | !!      | Extra-short (̆)                                                                                                                       |
| vowel     | \~      | Nasal vowel (`a~` is ã)                                                                                                              |
| vowel     | @       | Non-syllabic vowel (`O@` is ʊ̯; `a@~` is a nasal non-syllabic a)                                                                      |
| vowel     | capital | Vowel variant                                                                                                                        |
| vowel     | $       | Vowel variant                                                                                                                        |
| vowel     | +       | High tone (mandarin high)                                                                                                            |
| vowel     | ++      | Extra high tone                                                                                                                      |
| vowel     | \*      | Mid tone (˧)                                                                                                                         |
| vowel     | -       | Low tone (mandarin low)                                                                                                              |
| vowel     | --      | Extra low tone                                                                                                                       |
| vowel     | /       | Rising tone (vietnamese sắc, mandarin rising)                                                                                        |
| vowel     | //      | Rising tone 2 (vietnamese ngã)                                                                                                       |
| vowel     | \\      | Falling tone (vietnamese huyền, mandarin falling)                                                                                    |
| vowel     | \\\\    | Falling tone 2 (vietnamese nặng)                                                                                                     |
| vowel     | /\\     | Rising falling tone                                                                                                                  |
| vowel     | \\/     | Falling rising tone (vietnamese hỏi)                                                                                                 |
| symbol    | \\       | When preceding, writes a literal symbol: `\\.` is a period, `\\+` is a plus                                                           |

Two conventions are worth calling out.

`~` FORMS A SUPERSCRIPT on a consonant. `n~` is ⁿ, `l~` is ˡ, `y~` is ʲ.
On a vowel the same mark is nasality, `a~` being ã. Dental moved to `$`
to free it.

`@` IS SYLLABICITY read against the base's default. A vowel is syllabic
unless marked and a consonant is not, so `@` means non-syllabic on `i@`
and syllabic on `n@`.

### Consonants

This is the full set of IPA consonants we map, in tone and machine form.
Every consonant, however modified, is a single machine code.

_Note: GitHub markdown doesn't really render the diacritics that nicely,
some are misaligned. We will have a font to remedy this for websites._

| IPA | ascii   | machine |
| :-- | :------ | :------ |
| m̥ | mh! | 96 |
| m | m | 0 |
| ɱ̊ | m$h! | 672 |
| ɱ | m$ | 576 |
| n̼ | n | 1152 |
| n̪̊ | n$h! | 3168 |
| n̪ | n$ | 3072 |
| n̥ | nh! | 1248 |
| n | n | 1152 |
| n̠̊ | nh! | 1248 |
| n̠ | n | 1152 |
| ɳ̊ | Nh! | 5088 |
| ɳ | N | 4992 |
| ɲ̊ | ny\~h! | 1632 |
| ɲ | ny\~ | 1536 |
| ŋ̊ | qh! | 6960 |
| ŋ | q | 6864 |
| ɴ̥ | qh! | 6960 |
| ɴ | q | 6864 |
| p | p | 8016 |
| b | b | 8586 |
| p̪ | p$ | |
| b̪ | b$ | |
| t̼ | t | 9018 |
| d̼ | d | 12846 |
| t̪ | t$ | 10932 |
| d̪ | d$ | 14286 |
| t | t | 9018 |
| d | d | 12846 |
| ʈ | T | 15726 |
| ɖ | D | 16872 |
| c | ky\~ | 17736 |
| ɟ | gy\~ | 18498 |
| k | k | 19074 |
| ɡ | g | 20172 |
| q | K | 21000 |
| ɢ | g | 20172 |
| ʔ | ' | 22338 |
| s̪ | s$ | 23964 |
| z̪ | z$ | 26358 |
| s | s | 22530 |
| z | z | 25398 |
| ʃ | x | 27318 |
| ʒ | j | 28176 |
| ʂ | X | 28752 |
| ʐ | J | 29610 |
| ɕ | xy\~ | 27600 |
| ʑ | jy\~ | 28368 |
| ɸ | F | 31080 |
| β | V | 31506 |
| f | f | 31794 |
| v | v | 32220 |
| θ̼ | c | 32508 |
| ð̼ | C | 35376 |
| θ | c | 32508 |
| ð | C | 35376 |
| θ̠ | c | 32508 |
| ð̠ | C | 35376 |
| ɹ̠˔ | u$ | 37296 |
| ɻ˔ | u$ | 37296 |
| ç | hy\~ | 41136 |
| ʝ | y | 41706 |
| x | H | 42090 |
| ɣ | G | 42948 |
| χ | H | 42090 |
| ʁ | G | 42948 |
| ħ | Hh\~ | 43524 |
| ʕ | Q | 22146 |
| h | h | 43806 |
| ɦ | hh\~ | 43998 |
| β̞ | V | 31506 |
| ʋ | V | 31506 |
| ð̞ | C | 35376 |
| ɹ | u$ | 37296 |
| ɹ̠ | u$ | 37296 |
| ɻ | u$ | 37296 |
| j | y | 41706 |
| ɰ | W | 44190 |
| ⱱ̟ | V | 31506 |
| ⱱ | V | 31506 |
| ɾ̥ | rh! | 45438 |
| ɾ | r | 45342 |
| ɽ̊ | Rh! | 49278 |
| ɽ | R | 49182 |
| ɢ̆ | g | 20172 |
| ʙ̥ | bbh! | 50430 |
| ʙ | bb | 50334 |
| r̥ | rrh! | 51006 |
| r | rr | 50910 |
| r̠ | rr | 50910 |
| ɽ̊r̥ | RRh! | 54750 |
| ɽr | RR | 55326 |
| ʀ̥ | GGh! | 56573 |
| ʀ | GG | 56477 |
| ɬ̪ | S$ | 59063 |
| ɬ | S | 57629 |
| ɮ | Z | 60497 |
| ʎ̝ | ly\~ | 62417 |
| l̪ | l$ | 65057 |
| l̥ | lh! | 63281 |
| l | l | 63185 |
| l̠ | l | 63185 |
| ɭ̊ | Lh! | 67073 |
| ɭ | L | 66977 |
| ʎ̥ | ly\~h! | 62609 |
| ʎ | ly\~ | 62417 |
| ɺ̥ | lh! | 63281 |
| ɺ | l | 63185 |
| ʍ | wh! | 68129 |
| w | w | 68705 |
| ɥ | y$ | 69856 |
| ɧ | H$ | 71008 |
| ɫ | lQ\~ | 64289 |
| ɓ | b? | 72136 |
| ɗ | d? | 72712 |
| ʄ | gy\~ | 18498 |
| ɠ | g? | 73288 |
| ʛ | g? | 73288 |
| ɓ̥ | b?h\! | |
| ɗ̥ | t? | 73864 |
| ʄ̥ | gy\~h! | 74440 |
| ɠ̊ | g?h\! | |
| ʛ̥ | g?h\! | |
| pʼ | p! | 8112 |
| tʼ | t! | 9114 |
| ʈʼ | T! | 15822 |
| cʼ | ky\~! | 17928 |
| kʼ | k! | 19170 |
| qʼ | K! | 21096 |
| fʼ | f! | 31842 |
| sʼ | s! | 22578 |
| ʂʼ | X! | 28800 |
| ɕʼ | xy\~! | 27648 |
| xʼ | H! | 42138 |
| χʼ | H! | 42138 |
| ɸʼ | F! | 31128 |
| θʼ | c! | 32556 |
| ʃʼ | x! | 27366 |
| ʄ̊ | gy\~h! | 74440 |
| ɬʼ | S! | 57677 |
| ʘ | p\* | 75016 |
| ǀ | t\* | 75592 |
| ǃ | k\* | 76168 |
| 𝼊 | c\* | 76744 |
| ǂ | d\* | 77320 |
| ʞ | K\* | 77896 |
| ǁ | l\* | 78472 |
### Vowels

This is the full set of IPA vowels we map. Every vowel, with any tone,
length, stress, or nasalization, is a single machine code.

| IPA | tone | machine |
| :-- | :---- | :------ |
| i | i | 79048 |
| y | i$ | 79240 |
| ɨ | i$ | 79240 |
| ʉ | u | 79432 |
| ɯ | O | 79624 |
| u | u | 79432 |
| ɪ | I | 79816 |
| ʏ | i$ | 79240 |
| ʊ | O | 79624 |
| e | e | 80008 |
| ø | a$ | 80200 |
| ɘ | I | 79816 |
| ɵ | O | 79624 |
| ɤ | O | 79624 |
| o | o | 80392 |
| e̞ | e | 80008 |
| ø̞ | a$ | 80200 |
| ə | U | 80584 |
| ɤ̞ | O | 79624 |
| o̞ | o | 80392 |
| ɛ | E | 80776 |
| œ | e$ | 80968 |
| ɜ | O | 79624 |
| ɞ | U | 80584 |
| ʌ | U | 80584 |
| ɔ | o$ | 81160 |
| æ | A | 81352 |
| ɐ | a | 81544 |
| a | a | 81544 |
| ɶ | e$ | 80968 |
| ä | a | 81544 |
| ɑ | a | 81544 |
| ɒ | a | 81544 |
Every vowel takes the same modifier set (stress, length, nasal, tone,
etc.). Here are all the combos for the letter `a`, and the same pattern
applies to all vowels.

| IPA  | ascii | machine |
| :--- | :---- | :------ |
| æ | A | 81352 |
| œ | e$ | 80968 |
| ˈa | a^ | 81545 |
| aː | a\_ | 81546 |
| aʼ | a\! | |
| a̰ | a | 81544 |
| a͈ | a | 81544 |
| a˦ | a+ | 81568 |
| a˥ | a++ | 81576 |
| a˨ | a- | 81560 |
| a˩ | a-- | 81552 |
| a˧˥ | a\+\+\* | |
| a˩˥ | a\+\+\-\- | |
| a˥˧ | a\+\+\* | |
| a˥˩ | a\+\+\-\- | |
| a˩˥˩ | a\+\+\-\-\-\- | |
| a˥˩˥ | a\+\+\+\+\-\- | |
_Note: Exact tone sequences can be represented with sequences like
`a+a++a--`, where one vowel is spread across multiple tones. But common
tones, across languages, can take advantage of the shortened
syntax/encoding._

## IPA Diacritics

The IPA defines a set of **diacritics** that modify a base symbol,
grouped by `type` below. The `state` column says whether Talk maps the
diacritic to a phonetic feature, or ignores it, and `talk` is the
resulting Talk affix when it is mapped.

| symbol | type                   | meaning               | state   | tone |
| :----- | :--------------------- | :-------------------- | :------ | :--- |
| ◌ʰ | secondary articulation | aspirated | mapped | h\~ |
| ◌ʷ | secondary articulation | labialized | mapped | w\~ |
| ◌ʲ | secondary articulation | palatalized | mapped | y\~ |
| ◌ˠ | secondary articulation | velarized | mapped | G\~ |
| ◌ˤ | secondary articulation | pharyngealized | mapped | Q\~ |
| ◌ⁿ | secondary articulation | nasal release | mapped | n\~ |
| ◌̥ | phonation | voiceless | mapped | h! |
| ◌̬ | phonation | voiced | dropped | |
| ◌̤ | phonation | breathy voice | dropped | |
| ◌̰ | phonation | creaky voice | dropped | |
| ◌̹ | phonation | more rounded | dropped | |
| ◌̜ | phonation | less rounded | dropped | |
| ◌̟ | relative articulation | advanced | dropped | |
| ◌̠ | relative articulation | retracted | dropped | |
| ◌̈ | relative articulation | centralized | dropped | |
| ◌̽ | relative articulation | mid-centralized | dropped | |
| ◌̝ | relative articulation | raised | dropped | |
| ◌̞ | relative articulation | lowered | dropped | |
| ◌̘ | tongue root | advanced tongue root | dropped | |
| ◌̙ | tongue root | retracted tongue root | dropped | |
| ◌̪ | articulation | dental | mapped | $ |
| ◌̺ | articulation | apical | dropped | |
| ◌̻ | articulation | laminal | dropped | |
| ◌̃ | nasality | nasalized | mapped | \~ |
| ◌̩ | syllabicity | syllabic | mapped | @ |
| ◌̯ | syllabicity | non-syllabic | mapped | @ |
| ◌ː | length | long | mapped | \_ |
| ◌ˑ | length | half-long | mapped | \_! |
| ◌̆ | length | extra-short | mapped | !! |
| ◌̚ | release | no audible release | dropped | |
| ◌ʼ | airstream | ejective | mapped | ! |
| ◌ˈ | stress | primary stress | mapped | ^ |
| ◌ˌ | stress | secondary stress | unmapped | |
| ◌˥ | tone | extra high | mapped | ++ |
| ◌˦ | tone | high | mapped | + |
| ◌˧ | tone | mid | mapped | \* |
| ◌˨ | tone | low | mapped | - |
| ◌˩ | tone | extra low | mapped | -- |
| ◌‖ | prosody | major phrase break | unmapped | |
| ◌↗ | prosody | global rise | unmapped | |
| ◌↘ | prosody | global fall | unmapped | |
**On the ignored ones.** IPA itself is not perfectly exact. Real speech
has far more subtle variation than any discrete character set can
capture, and the ignored diacritics above (relative articulation,
breathy/creaky voice, tongue-root position, half-long, and so on) mark
distinctions so fine-grained that they are hard to even hear reliably,
hard to transcribe consistently, and hard to reproduce the same way
across recordings. For a discrete model of sound aimed at AI and coding,
they are mostly unnecessary, so Talk lets them fall through rather than
inventing symbols for detail it cannot use.

## Syllables

Talk also splits a word into syllables, each a sequence of onset,
nucleus, and coda clusters. IPA and X-SAMPA give you symbols and stop
there, so this comes built in, which the TTS, speech-recognition, and
language-learning use cases all need.

Some rarer sounds are not yet handled by the syllable system. The
current gaps are listed in
[`base/syllable/unsupported.csv`](base/syllable/unsupported.csv)
(dentals, retroflex plosives, implosives, ejectives, and clicks).

## Token encoding

Every canonical sound has a **24-bit integer code**, so a word encodes to
one fixed-width code per effective sound rather than per character.

```ts
import { machine, machineText, machineBytes } from '@cluesurf/talk'

machine('takw~a') // [131, 1927, 284, 1927]
machineBytes('takw~a') // Uint8Array(12), three bytes per sound
machineText('takw~a') // two characters per sound, for a text index
```

Three bytes hold 16,777,216 codes against an inventory of 82,335, so the
space is 0.5% used and has room to grow. The codes live in
`base/tokens.json` and are APPEND-ONLY: a sound's code is assigned once
and never changes, so a model trained on one release still reads the
next.

`machineText` encodes each code as two characters from a contiguous block
of CJK ideographs (U+4E00 onward). It exists for text indexes: the block
is printable, has no control characters, no combining marks and no case
folding, and the fixed two-character width means a match on a character
boundary is always a match on a sound boundary.

An earlier release used one Hangul syllable per sound. That capped the
inventory at the block's 11,172 code points, which stopped being
theoretical once length and stress could attach to consonants.

### Tiers

The flat code above holds a whole sound. Three TIERS trade detail for a
smaller space, and each has its own dense integer coding:

| tier | holds | `tone` | `ipa` | bytes |
| :--- | :--- | ---: | ---: | :--- |
| `seed` | one atomic unit, a base or a single mark | 110 | 168 | 1 |
| `band` | a base with its segmental marks | 2,161 | 7,432,128 | 2 / 3 |
| `mesh` | a base with everything, suprasegmentals included | 25,426 | 166,167,936 | 2 / 4 |

```ts
import { encodeUnit, decodeUnit, pack, byteWidth } from '@cluesurf/talk'

const code = encodeUnit({
  composition: { base: 'k', marks: [/* one per axis */] },
  notation: 'tone',
  tier: 'mesh',
})

decodeUnit({ code, notation: 'tone', tier: 'mesh' })
byteWidth({ notation: 'ipa', tier: 'mesh' }) // 4
pack({ codes: [code], notation: 'tone', tier: 'mesh' }) // 2 bytes
```

Codes are COMPUTED, not looked up. A table for `ipa mesh` would be over a
gigabyte, so each code is a mixed-radix index instead: the base picks an
offset and each axis contributes a digit whose radix is how many marks
that axis offers that base. The only tables are the bases, the axes and a
per-base offset, a few thousand integers in total, so this runs in a
browser as happily as on a server.

`byteWidth` sizes to the tier rather than to one global width, since
`tone seed` fits in a byte and `ipa mesh` needs four. `pack` and `unpack`
use it, big-endian, with no framing, so a buffer is exactly
`codes.length * width`.

### Choosing a token vocabulary

The 82,335 figure is the COMBINATORIAL space, every base crossed with
every legal modifier combination. Attested usage is far smaller: across
all 2,000+ languages in Phoible there are 3,422 distinct phonemes, 2,134
distinct talk spellings, and 628 distinct codes. Under 1% of the space is
ever used.

So a flat code per sound is a poor token vocabulary for a model, on two
counts. Most of the vocabulary never appears in training, and a flat
integer throws away the structure: `p` and `pʰ` get unrelated codes,
leaving a model to rediscover from co-occurrence a relationship the data
already states.

For that use, take the factorization the library already gives you.
`segment` returns each sound as a base `Phone` plus its `Modifier`s, so a
caller can emit base and modifiers as separate tokens (a vocabulary of
roughly 110), or build a feature vector per sound and skip the embedding
table altogether. The integer code is the right key for a database or an
index, not for an embedding matrix.

## Normalization

`normalizeIpa` folds the many ways IPA gets written into the one form the
parser reads. `parseIpa` applies it, so this is only needed directly when
normalizing without parsing.

```ts
import { normalizeIpa } from '@cluesurf/talk'

normalizeIpa('ʆ') // 'ʃʲ'      withdrawn 1989, palatal hook
normalizeIpa('ma³³') // 'ma˧˧'    superscript digits are tone
normalizeIpa('ɡ̊') // 'ɡ̥'      ring above and below are one feature
normalizeIpa('g') // 'ɡ'       ASCII lookalikes
normalizeIpa('t͡ʃ') // 'tʃ'      tie bars carry no content
```

It also DROPS fine phonetic detail this encoding does not carry: breathy,
creaky, retracted, advanced, apical, laminal, raised, lowered, and the
rest. That is lossy on purpose, so a source carrying the mark still
yields its base sound rather than failing. Pass `keepDetail` to leave
them in place and see what a source carries that talk drops.

```ts
normalizeIpa('b̤') // 'b'
normalizeIpa('b̤', { keepDetail: true }) // 'b̤'
```

## License

MIT

## ClueSurf

Made by [ClueSurf](https://clue.surf), meditating on the universe ¤.
Follow the work on [YouTube](https://youtube.com/@cluesurf),
[X](https://x.com/cluesurf),
[Instagram](https://instagram.com/cluesurf),
[Substack](https://cluesurf.substack.com),
[Facebook](https://facebook.com/cluesurf), and
[LinkedIn](https://linkedin.com/company/cluesurf), and browse more of
our open-source work here on [GitHub](https://github.com/cluesurf).
