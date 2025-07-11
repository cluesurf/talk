<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>

<p align='center'>
  <img src='https://github.com/cluesurf/talk/blob/make/view/star.svg?raw=true' height='192'>
</p>

<h3 align='center'>
  @cluesurf/talk
</h3>
<p align='center'>
  A Phonetic Encoding
</p>

<br/>
<br/>
<br/>

## Overview

**Talk** uses the Latin script with diacritics to encode most of Earth's
natural language features, enough so that you can write every language
using the same Latin-oriented system and be close enough to a realistic
pronunciation, including nasalized vowels, tense consonants, clicks, and
tones, amongst other things. A cross-cultural romanization scheme
basically!

There are two forms:

- **ASCII**: For writing in a text editor without fancy symbols.
- **Simplified**: For reading with condensed characters and diacritics.

The goal of the simplified version is to make it as easy as possible to
read text given basic knowledge of today's standard English writing
practices. Of course you need to learn the basics if you really want to
take advantage of it, but without learning anything, you still can get
the gist of it.

## Examples

| ascii           | simplified   |
| :-------------- | :----------- |
| txando^         | txandȯ       |
| surdjyo^        | suṙdjyȯ      |
| HEth~Ah         | ḥẹtɦạh       |
| siqk            | siṅk         |
| txya@+a-a++u    | txyá̖àa̋u      |
| hwpo$kUi^mUno$s | hwpo̤kụïmụno̤s |
| sinho^rEsi      | sinhȯṙẹsi    |
| batO\_'aH       | batọ̄qaḥ      |
| aiyuQaK         | aiyuq̇aḳ      |
| s'oQya&te       | s'oq̇ya̰te     |
| t!arEba         | t̖aṙẹba       |
| txhaK!EnEba     | txhaḳ̖ẹnẹba   |
| txh~im          | txɦim        |
| txy\~h\~im      | txẏɦim       |
| mh!im           | mħim         |

## Why not IPA or XSampa?

IPA and XSampa are useful because they are widespread amongst the
linguistic community, and much has been encoded using (at least) the IPA
encoding.

However, IPA is not that easy to understand or write for the average
English speaker, and XSampa is too foreign for the same group of people
(even though it's easy to write on a keyboard).

Our goal with Talk is to make an easy to write and easy to understand
3rd encoding which requires less expert knowledge. And a readable
romanization form ("simplified" form) which an average English
reader/speaker can get close to intuiting without more than a small
handful of key notes, not requiring tons of special knowledge.

Also, Talk is not meant to replace the level-of-detail ("exactness") of
IPA, it's goal is to only get like ~95% accuracy. This is because we
believe real-world pronunciations a highly varied within even a single
word of a language, and so being as exact as IPA is kind of misleading.
If Talk is not exact enough for a specific rendering, you can use IPA,
but otherwise Talk will be much easier to understand and use on both
sides.

_We are aware of [competing standards](https://xkcd.com/927/) haha. But
for the websites we are planning on making, thinking of showing the
general public IPA has (in our experiments / customer testing) so far
revealed that it is either ignored or misunderstood, so we are making
something that we think will be used and not misunderstood._

Almost every language learning resource on the web has their own version
of writing the pronunciations of words, often like this:

```
pruh-nuhn-see-EY-shuhn
```

They use that because it's easier for people without linguistics
knowledge to understand. So we sort of normalized things against a
simplified system like this.

## Encoding

Here are the modifiers on consonants, vowels, and symbols (like
punctuation), and how they look in ASCII and simplified form.

### Modifiers

There are a few affixes on consonants and vowels. There are 5 tone
affixes (extra low, low, neutral, high, and extra high), which can be
combined in standard ways.

| category  | symbol  | meaning                                                                                                                               |
| :-------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------ |
| consonant | h~      | Aspiration (when added after a consonant)                                                                                             |
| consonant | w~      | Labialization (when added after a consonant)                                                                                          |
| consonant | y~      | Palatalization (when added after a consonant)                                                                                         |
| consonant | G~      | Velarization (when added after a consonant)                                                                                           |
| consonant | Q~      | Pharyngealization (when added after a consonant)                                                                                      |
| consonant | !       | Makes consonant ejective                                                                                                              |
| consonant | ?       | Makes consonant implosive                                                                                                             |
| consonant | @       | Makes consonant tense (korean)                                                                                                        |
| consonant | .       | Makes consonant a stop consonant (korean, so when you end on `t.`, it is making the mouth shape of `t` but not really pronouncing it) |
| consonant | \*      | Finds the closes "click consonant" mapping (there are 5, d, p, k, l, t)                                                               |
| consonant | capital | Consonant variant                                                                                                                     |
| vowel     | ^       | Stressed vowel                                                                                                                        |
| vowel     | \_      | Long vowel                                                                                                                            |
| vowel     | !       | Short vowel                                                                                                                           |
| vowel     | &       | Nasal vowel                                                                                                                           |
| vowel     | @       | Non-syllablic vowel                                                                                                                   |
| vowel     | capital | Vowel variant                                                                                                                         |
| vowel     | $       | Vowel variant                                                                                                                         |
| vowel     | +       | High tone (mandarin high)                                                                                                             |
| vowel     | ++      | Extra high tone                                                                                                                       |
| vowel     | -       | Low tone (mandarin low)                                                                                                               |
| vowel     | --      | Extra low tone                                                                                                                        |
| vowel     | /       | Rising tone (vietnamese sắc, mandarin rising)                                                                                         |
| vowel     | //      | Rising tone 2 (vietnamese ngã)                                                                                                        |
| vowel     | \\      | Falling tone (vietnamese huyền, mandarin falling)                                                                                     |
| vowel     | \\\\    | Falling tone 2 (vietnamese nặng)                                                                                                      |
| vowel     | /\\     | Rising falling tone                                                                                                                   |
| vowel     | \\/     | Falling rising tone (vietnamese hỏi)                                                                                                  |
| symbol    | =       | When preceding, can write a literal symbol, like `=.` is a period, `=+` is a plus, etc..                                              |

### Consonants

_Note: GitHub markdown doesn't really render the diacritics that nicely,
some are misaligned. We will have a font to remedy this for websites._

| IPA | ascii | simplified |
| :-- | :---- | :--------- |
| ʰ   | h~    | ɦ          |
| m   | m     | m          |
| ɳ   | N     | ṇ          |
| n   | n     | n          |
| ŋ   | q     | ṅ          |
|     | G~    | g̃          |
| ʁ   | G     | ġ          |
| ɠ   | g?    | g̀          |
| g   | g     | g          |
| ʔ   | '     | '          |
| ʕ   | Q     | q̇          |
| ɗ   | d?    | d̖          |
| dʼ  | d!    | d̗          |
| ǂ   | d\*   | d̬          |
| d̚   | d.    | ḏ          |
| ɖ   | D     | ḍ          |
| dˤ  | dQ~   | d̰          |
| d   | d     | d          |
| ɓ   | b?    | b̖          |
| bʼ  | b!    | b̗          |
| b   | b     | b          |
| pʼ  | p!    | ṕ          |
| ʘ   | p\*   | p̂          |
| p̚   | p.    | t̄          |
| p͈   | p@    | x̌          |
| p   | p     | p          |
| ʈʼ  | T!    | ṭ̗          |
| ʈ   | T     | ṭ          |
| tʼ  | t!    | t̗          |
| ǀ   | t\*   | t̬          |
| tˤ  | tQ~   | t̰          |
| t͈   | t@    | ṱ          |
| t̚   | t.    | ṯ          |
| t   | t     | t          |
| kʼ  | k!    | k̗          |
| k̚   | k.    | ḵ          |
| ǃ   | k\*   | k̬          |
| qʼ  | K!    | ḳ̗          |
| q   | K     | ḳ          |
| k   | k     | k          |
| χʼ  | H!    | ḥ̗          |
| χ   | H     | ḥ          |
|     | h!    | ħ          |
| h   | h     | h          |
| ʐ   | J     | ȷ̈          |
| ʒʼ  | j!    | j́          |
| ʒ   | j     | j          |
| ɬʼ  | S!    | ṣ́          |
| sʼ  | s!    | ś          |
| ɬ   | S     | ṣ          |
| sˤ  | sQ~   | s̰          |
| s͈   | s@    | s̭          |
| s   | s     | s          |
| ɸ   | F     | f̣          |
| fʼ  | f!    | f̗          |
| f   | f     | f          |
| ʋ   | V     | ṿ          |
| v   | v     | v          |
| zʼ  | z!    | ź          |
| zˤ  | zQ~   | z̰          |
| z   | z     | z          |
| ɮʼ  | Z!    | ẓ́          |
| ɮ   | Z     | ẓ          |
| ðˤ  | CQ~   | c̣̃          |
| ð   | C     | c̣          |
| θˤ  | cQ~   | c̃          |
| θ   | c     | c          |
| ɭ   | L     | ḷ          |
| ǁ   | l\*   | l̬          |
| lˤ  | lQ~   | l̰          |
| l   | l     | l          |
| ɽ   | R     | ṛ          |
| r   | r     | ṙ          |
| ʃʼ  | x!    | x́          |
| ʂʼ  | X!    | x̣́          |
| ʂ   | X     | x̣          |
| ʃ͈   | x@    | x̭          |
| ʃ   | x     | x          |
| ɰ   | W     | ẇ          |
| wʼ  | w!    | ẃ          |
| ʷ   | w~    | ẉ          |
| w   | w     | w          |
| ʲ   | y~    | ẏ          |
| j   | y     | y          |

### Vowels

These are all the combos for the letter `a`, same applies to all vowels.

| IPA  | ascii | simplified |
| :--- | :---- | :--------- |
| æ    | A     | ạ          |
| œ    | a$    | a̤          |
| ˈa   | a^    | ȧ          |
| aː   | a\_   | ā          |
| aʼ   | a!    | a̱          |
| a̰    | a&    | a̰          |
| a͈    | a@    | a̖          |
| a˦   | a+    | á          |
| a˥   | a++   | a̋          |
| a˨   | a-    | à          |
| a˩   | a--   | ȁ          |
| a˧˥  | a/    | ą́          |
| a˩˥  | a//   | ą̋          |
| a˥˧  | a\    | ą̀          |
| a˥˩  | a\\   | ą̏          |
| a˩˥˩ | a/\   | â          |
| a˥˩˥ | a\\/  | ǎ          |

_Note: Exact tone sequences can be represented with sequences like
`a+a++a--`, where one vowel is spread across multiple tones. But common
tones, across languages, can take advantage of the shortened
syntax/encoding._

## Installation

```bash
npm install @cluesurf/talk
```

## Usage

```ts
import make from '@cluesurf/talk'

make('aiyuQaK') // => 'aiyuq̇aḳ'
```

_See the `test.ts` file for most up-to-date stuff._

## Libraries

- [`@cluesurf/text`](https://github.com/cluesurf/text.js): Builds off
  Talk spec to convert different scripts/orthographies into TalkText.
- [`@cluesurf/tone`](https://github.com/cluesurf/tone): Takes the Talk
  formatted ASCII text and [renders it](https://tone.surf) using
  ToneText.

## ReadTalk

Here we have included a system inspired by the
[Double Metaphone algorithm](https://github.com/words/double-metaphone/blob/main/index.js),
which is an algorithm which creates a simplified pronunciation "hash" of
some input text, usually English or other Indo-European languages.

Since Talk is itself a simplified ASCII pronunciation system for any of
the world's languages (like X-SAMPA or IPA, but easier to write), it was
straightforward to make a system where we _progressively simplify the
pronunciation from accurate to only simplified consonants and no
vowels_. There are 5 categories of things which get tinkered with when
"refining" the pronunciation from its most accurate form, to the most
basic form:

- **vowel**: none, one, basic, all. No vowels, the `a` vowel, the 5
  basic vowels `i e a o u`, or any possible vowel allowed by Talk.
- **consonant**: all, simplified. All possible consonants allowed by
  Talk, or a simplified subset, where it basically merges bp, td, xj,
  fv, sz, and kg, and gets rid of any consonant variants like click
  consonants or stop/tense consonants (Korean).
- **tone**: yes, no. Whether or not we include tone markers (useful in
  Chinese).
- **duration**: yes, no. Whether or not we include duration markers
  (useful in Sanskrit).
- **aspiration**: yes, no. Whether or not we include aspiration markers
  (useful in Indian languages).

By combining all these characteristics, we end up with something like
this (for the word `by~oph~am`, which has palatalization, aspiration,
and a few vowels and non-simplified consonants):

```js
import read from '@cluesurf/talk/make/read'

const list = read('by~oph~am')
[
  {
    text: 'by~oph~am',
    mass: 405,
    load: {
      consonant: 'all',
      vowel: 'all',
      tone: 'yes',
      aspiration: 'yes',
      duration: 'yes',
    },
  },
  {
    text: 'by~ph~m',
    mass: 324,
    load: {
      consonant: 'all',
      vowel: 'basic',
      tone: 'yes',
      aspiration: 'yes',
      duration: 'yes',
    },
  },
  {
    text: 'by~opam',
    mass: 270,
    load: {
      consonant: 'all',
      vowel: 'all',
      tone: 'yes',
      aspiration: 'no',
      duration: 'yes',
    },
  },
  {
    text: 'pyopham',
    mass: 270,
    load: {
      consonant: 'simplified',
      vowel: 'all',
      tone: 'yes',
      aspiration: 'yes',
      duration: 'yes',
    },
  },
  {
    text: 'by~pm',
    mass: 216,
    load: {
      consonant: 'all',
      vowel: 'basic',
      tone: 'yes',
      aspiration: 'no',
      duration: 'yes',
    },
  },
  {
    text: 'pyphm',
    mass: 216,
    load: {
      consonant: 'simplified',
      vowel: 'basic',
      tone: 'yes',
      aspiration: 'yes',
      duration: 'yes',
    },
  },
]
```

The `mass` is basically a "weight" for now, to say how many features it
included, i.e. how close to the actual pronunciation it was. The smaller
the mass, the less it is like the original pronunciation.

You then use the `text` as a key in a lookup table to find words
matching that refined text pronunciation. You likely will find the same
term in several spots, but you can just filter those at at query time.

That's about it! Now have to play with this in production to see how
useful it is in practice for building pseudo-fuzzy dictionary search.

## Syllables and Pronunciation

Using the library, you can also count the number of syllables in a word,
and convert IPA text into ASCII Call Text.

```ts
import talk from '@cluesurf/talk/make/talk'
import syllables from '@cluesurf/talk/make/talk/syllables'

talk('kxɯʎʎikʰa̠da̠') // => 'kHOly~ly~ikh~a@da@'
syllables('kHOly~ly~ikh~a@da@') // => { size: 4 }
```

## IPA and XSampa

```ts
import talkToIPA from '@cluesurf/talk/make/talk/ipa'
import talkToXSampa from '@cluesurf/talk/make/talk/xsampa'
import ipaToTalk from '@cluesurf/talk/make/ipa/talk'
```

## ToneText

You can also transform Talk into
[ToneText](https://github.com/cluesurf/tone) by writing it in ASCII, and
running it through the tone text code, which is freely available and
open source there.

```ts
import tone from '@cluesurf/tone'

// make it for the font.
tone.make('a+a+si-kiri-imu-') // => 'a3a3si4kiri4imu4'
```

## License

MIT

## ClueSurf

This is being developed by the folks at [ClueSurf](https://clue.surf), a
California-based project for helping humanity master information and
computation. Find us on [Twitter](https://twitter.com/cluesurf),
[LinkedIn](https://www.linkedin.com/company/cluesurf), and
[Facebook](https://www.facebook.com/cluesurf). Check out our other
[GitHub projects](https://github.com/cluesurf) as well!
