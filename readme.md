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

There are three forms:

- **ASCII**: For writing in a text editor without fancy symbols.
- **Simplified**: For reading with condensed characters and diacritics.
- **Machine**: A single Hangul code point per sound, for compact
  tokenization (useful for AI models and lookups).

The goal of the simplified version is to make it as easy as possible to
read text given basic knowledge of today's standard English writing
practices. Of course you need to learn the basics if you really want to
take advantage of it, but without learning anything, you still can get
the gist of it.

## Examples

The `machine` column is the machine encoding: `talk.machine(...)` packs
each sound into a single Hangul code point (base plus all its
modifiers), so a whole word becomes a compact, one-code-point-per-sound
string.

| ascii           | machine                  |
| :-------------- | :----------------------- |
| txando^         | 켶콣뱿켔켤붇             |
| surdjyo^        | 콉삟콞켤콃콩붇           |
| HEth\~Ah        | 켾뀟퀢눯콀               |
| siqk            | 콉롟켕켼                 |
| txya@+a-a++u    | 켶콣콩뱌뱶뱷삟           |
| hwpo$kUi^mUno$s | 콀콧켬뺄켼뙏띗켒뙏켔뺄콉 |
| sinho^rEsi      | 콉롟켔콀붇콞뀟콉롟       |
| batO\_'aH       | 켧뱿켶뎏켚뱿켾           |
| aiyuQaK         | 뱿롟콩삟켛뱿켻           |
| s'oQya&te       | 콉켚뺏켛콩뱩켶멯         |
| t!arEba         | 켱뱿콞뀟켧뱿             |
| txhaK!EnEba     | 켶콣콀뱿켺뀟켔뀟켧뱿     |
| txh\~im         | 켶큪롟켒                 |
| txy\~h\~im      | 켶큤켑롟켒               |
| mh!im           | 쾒롟켒                   |

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
| consonant | \*      | Click consonant: `p*` (ʘ), `t*` (ǀ), `k*` (ǃ), `l*` (ǁ), `d*` (ǂ), `c*` (𝼊), `K*` (ʞ)                                                 |
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

This is the full set of IPA consonants we map, in ASCII, simplified, and
machine (Hangul) form. Every consonant, however modified, is a single
Hangul code point.

_Note: GitHub markdown doesn't really render the diacritics that nicely,
some are misaligned. We will have a font to remedy this for websites._

| IPA | ascii   | maching |
| :-- | :------ | :------ |
| m̥   | mh!     | 쾒      |
| m   | m       | 켒      |
| ɱ̊   | m\~h!   | 쾓      |
| ɱ   | m\~     | 쾆      |
| n̼   | n       | 켔      |
| n̪̊   | n\~h!   | 쾣      |
| n̪   | n\~     | 쾃      |
| n̥   | nh!     | 쾢      |
| n   | n       | 켔      |
| n̠̊   | nh!     | 쾢      |
| n̠   | n       | 켔      |
| ɳ̊   | Nh!     | 쾲      |
| ɳ   | N       | 켓      |
| ɲ̊   | ny\~h!  | 쾥      |
| ɲ   | ny\~    | 쾤      |
| ŋ̊   | qh!     | 쿃      |
| ŋ   | q       | 켕      |
| ɴ̥   | qh!     | 쿃      |
| ɴ   | q       | 켕      |
| p   | p       | 켬      |
| b   | b       | 켧      |
| p̪   | p\~     | 쾅      |
| b̪   | b\~     | 쾄      |
| t̼   | t       | 켶      |
| d̼   | d       | 켤      |
| t̪   | t\~     | 켮      |
| d̪   | d\~     | 켝      |
| t   | t       | 켶      |
| d   | d       | 켤      |
| ʈ   | T       | 켰      |
| ɖ   | D       | 켢      |
| c   | ky\~    | 쿧      |
| ɟ   | gy\~    | 쿗      |
| k   | k       | 켼      |
| ɡ   | g       | 켙      |
| q   | K       | 켻      |
| ɢ   | g       | 켙      |
| ʔ   | '       | 켚      |
| s̪   | s\~     | 쾇      |
| z̪   | z\~     | 쾈      |
| s   | s       | 콉      |
| z   | z       | 콑      |
| ʃ   | x       | 콣      |
| ʒ   | j       | 콃      |
| ʂ   | X       | 콡      |
| ʐ   | J       | 콁      |
| ɕ   | xy\~    | 큤      |
| ʑ   | jy\~    | 큳      |
| ɸ   | F       | 콊      |
| β   | V       | 콍      |
| f   | f       | 콌      |
| v   | v       | 콎      |
| θ̼   | c       | 콗      |
| ð̼   | C       | 콕      |
| θ   | c       | 콗      |
| ð   | C       | 콕      |
| θ̠   | c       | 콗      |
| ð̠   | C       | 콕      |
| ɹ̠˔  | u$      | 삔      |
| ɻ˔  | u$      | 삔      |
| ç   | hy\~    | 탣      |
| ʝ   | y       | 콩      |
| x   | H       | 켾      |
| ɣ   | G       | 켗      |
| χ   | H       | 켾      |
| ʁ   | G       | 켗      |
| ħ   | Hh\~    | 탹      |
| ʕ   | Q       | 켛      |
| h   | h       | 콀      |
| ɦ   | hh\~    | 탩      |
| β̞   | V       | 콍      |
| ʋ   | V       | 콍      |
| ð̞   | C       | 콕      |
| ɹ   | u$      | 삔      |
| ɹ̠   | u$      | 삔      |
| ɻ   | u$      | 삔      |
| j   | y       | 콩      |
| ɰ   | W       | 콤      |
| ⱱ̟   | V       | 콍      |
| ⱱ   | V       | 콍      |
| ɾ̥   | rh!     | 턠      |
| ɾ   | r       | 콞      |
| ɽ̊   | Rh!     | 터      |
| ɽ   | R       | 콜      |
| ɢ̆   | g       | 켙      |
| ʙ̥   | bbh!    | 툗      |
| ʙ   | bb      | 툖      |
| r̥   | rh!     | 턠      |
| r   | r       | 콞      |
| r̠   | r       | 콞      |
| ɽ̊r̥  | Rh!rh!  | 퉊      |
| ɽr  | Rr      | 툸      |
| ʀ̥   | GGh!    | 툩      |
| ʀ   | GG      | 툨      |
| ɬ̪   | S\~     | 쾊      |
| ɬ   | S       | 콆      |
| ɮ   | Z       | 콓      |
| ʎ̝   | ly\~    | 턂      |
| l̪   | l\~     | 쾉      |
| l̥   | lh!     | 턀      |
| l   | l       | 콛      |
| l̠   | l       | 콛      |
| ɭ̊   | Lh!     | 턏      |
| ɭ   | L       | 콘      |
| ʎ̥   | ly\~h!  | 턃      |
| ʎ   | ly\~    | 턂      |
| ɺ̥   | lh!     | 턀      |
| ɺ   | l       | 콛      |
| ʍ   | wh!     | 텁      |
| w   | w       | 콧      |
| ɥ   | yw\~    | 텔      |
| ɧ   | H       | 켾      |
| ɫ   | lG\~    | 턆      |
| ɓ   | b?      | 켥      |
| ɗ   | d?      | 켞      |
| ʄ   | g?y\~   | 툈      |
| ɠ   | g?      | 켘      |
| ʛ   | g?      | 켘      |
| ɓ̥   | b?h!    | 퇣      |
| ɗ̥   | t?      | 쾋      |
| ʄ̥   | g?y\~h! | 툉      |
| ɠ̊   | g?h!    | 툅      |
| ʛ̥   | g?h!    | 툅      |
| pʼ  | p!      | 켨      |
| tʼ  | t!      | 켱      |
| ʈʼ  | T!      | 켯      |
| cʼ  | ky\~!   | 쾎      |
| kʼ  | k!      | 켷      |
| qʼ  | K!      | 켺      |
| fʼ  | f!      | 콋      |
| sʼ  | s!      | 콅      |
| ʂʼ  | X!      | 콠      |
| ɕʼ  | xy\~!   | 쾏      |
| xʼ  | H!      | 켽      |
| χʼ  | H!      | 켽      |
| ɸʼ  | F!      | 쾍      |
| θʼ  | c!      | 쾌      |
| ʃʼ  | x!      | 콟      |
| ʄ̊   | g?y\~h! | 툉      |
| ɬʼ  | S!      | 콄      |
| ʘ   | p\*     | 켩      |
| ǀ   | t\*     | 켲      |
| ǃ   | k\*     | 켹      |
| 𝼊   | c\*     | 쾐      |
| ǂ   | d\*     | 켠      |
| ʞ   | K\*     | 쾑      |
| ǁ   | l\*     | 콙      |

### Vowels

This is the full set of IPA vowels we map. Every vowel, with any tone,
length, stress, or nasalization, is a single Hangul code point.

| IPA | ascii | machine |
| :-- | :---- | :------ |
| i   | i     | 롟      |
| y   | i$    | 롔      |
| ɨ   | i$    | 롔      |
| ʉ   | u     | 삟      |
| ɯ   | O     | 됿      |
| u   | u     | 삟      |
| ɪ   | I     | 긏      |
| ʏ   | i$    | 롔      |
| ʊ   | O     | 됿      |
| e   | e     | 멯      |
| ø   | a$    | 뱴      |
| ɘ   | I     | 긏      |
| ɵ   | O     | 됿      |
| ɤ   | O     | 됿      |
| o   | o     | 뺏      |
| e̞   | e     | 멯      |
| ø̞   | a$    | 뱴      |
| ə   | U     | 뙏      |
| ɤ̞   | O     | 됿      |
| o̞   | o     | 뺏      |
| ɛ   | E     | 뀟      |
| œ   | e$    | 멤      |
| ɜ   | O     | 됿      |
| ɞ   | U     | 뙏      |
| ʌ   | U     | 뙏      |
| ɔ   | o$    | 뺄      |
| æ   | A     | 눯      |
| ɐ   | a     | 뱿      |
| a   | a     | 뱿      |
| ɶ   | e$    | 멤      |
| ä   | a     | 뱿      |
| ɑ   | a     | 뱿      |
| ɒ   | a     | 뱿      |

Every vowel takes the same modifier set (stress, length, nasal, tone,
etc.). Here are all the combos for the letter `a`, and the same pattern
applies to all vowels.

| IPA  | ascii |
| :--- | :---- |
| æ    | A     |
| œ    | a$    |
| ˈa   | a^    |
| aː   | a\_   |
| aʼ   | a!    |
| a̰    | a&    |
| a͈    | a@    |
| a˦   | a+    |
| a˥   | a++   |
| a˨   | a-    |
| a˩   | a--   |
| a˧˥  | a/    |
| a˩˥  | a//   |
| a˥˧  | a\\   |
| a˥˩  | a\\\\ |
| a˩˥˩ | a/\   |
| a˥˩˥ | a\\/  |

_Note: Exact tone sequences can be represented with sequences like
`a+a++a--`, where one vowel is spread across multiple tones. But common
tones, across languages, can take advantage of the shortened
syntax/encoding._

## IPA Diacritics

The IPA defines a set of **diacritics** that modify a base symbol,
grouped by `type` below. The `state` column says whether Talk maps the
diacritic to a phonetic feature, or ignores it, and `talk` is the
resulting Talk affix when it is mapped.

| symbol | type                   | meaning               | state   | talk |
| :----- | :--------------------- | :-------------------- | :------ | :--- |
| ◌ʰ     | secondary articulation | aspirated             | mapped  | h\~  |
| ◌ʷ     | secondary articulation | labialized            | mapped  | w\~  |
| ◌ʲ     | secondary articulation | palatalized           | mapped  | y\~  |
| ◌ˠ     | secondary articulation | velarized             | mapped  | G\~  |
| ◌ˤ     | secondary articulation | pharyngealized        | mapped  | Q\~  |
| ◌ⁿ     | secondary articulation | nasal release         | mapped  | n    |
| ◌̥      | phonation              | voiceless             | mapped  | h!   |
| ◌̬      | phonation              | voiced                | mapped  |      |
| ◌̤      | phonation              | breathy voice         | ignored |      |
| ◌̰      | phonation              | creaky voice          | ignored |      |
| ◌̹      | phonation              | more rounded          | ignored |      |
| ◌̜      | phonation              | less rounded          | ignored |      |
| ◌̟      | relative articulation  | advanced              | ignored |      |
| ◌̠      | relative articulation  | retracted             | ignored |      |
| ◌̈      | relative articulation  | centralized           | ignored |      |
| ◌̽      | relative articulation  | mid-centralized       | ignored |      |
| ◌̝      | relative articulation  | raised                | ignored |      |
| ◌̞      | relative articulation  | lowered               | ignored |      |
| ◌̘      | tongue root            | advanced tongue root  | ignored |      |
| ◌̙      | tongue root            | retracted tongue root | ignored |      |
| ◌̪      | articulation           | dental                | mapped  | \~   |
| ◌̺      | articulation           | apical                | ignored |      |
| ◌̻      | articulation           | laminal               | ignored |      |
| ◌̃      | nasality               | nasalized             | mapped  | &    |
| ◌̩      | syllabicity            | syllabic              | ignored |      |
| ◌̯      | syllabicity            | non-syllabic          | ignored |      |
| ◌ː     | length                 | long                  | mapped  | \_   |
| ◌ˑ     | length                 | half-long             | ignored |      |
| ◌̆      | length                 | extra-short           | ignored |      |
| ◌̚      | release                | no audible release    | mapped  | .    |
| ◌ʼ     | airstream              | ejective              | mapped  | !    |
| ◌ˈ     | stress                 | primary stress        | mapped  | ^    |
| ◌ˌ     | stress                 | secondary stress      | ignored |      |
| ◌˥     | tone                   | extra high            | mapped  | ++   |
| ◌˦     | tone                   | high                  | mapped  | +    |
| ◌˧     | tone                   | mid                   | mapped  |      |
| ◌˨     | tone                   | low                   | mapped  | -    |
| ◌˩     | tone                   | extra low             | mapped  | --   |
| ◌‖     | prosody                | major phrase break    | ignored |      |
| ◌↗     | prosody                | global rise           | ignored |      |
| ◌↘     | prosody                | global fall           | ignored |      |

The full list is also in [`test/diacritics.csv`](test/diacritics.csv).

**On the ignored ones.** IPA itself is not perfectly exact. Real speech
has far more subtle variation than any discrete character set can
capture, and the ignored diacritics above (relative articulation,
breathy/creaky voice, tongue-root position, half-long, and so on) mark
distinctions so fine-grained that they are hard to even hear reliably,
hard to transcribe consistently, and hard to reproduce the same way
across recordings. For a discrete model of sound aimed at AI and coding,
they are mostly unnecessary, so Talk lets them fall through rather than
inventing symbols for detail it cannot use.

## Installation

```bash
npm install @cluesurf/talk
```

## Usage

```ts
import make from '@cluesurf/talk'

make('aiyuQaK') // => 'aiyuq̇aḳ'
```

_See the `test/` folder for the up-to-date test suite._

## Syllables and Pronunciation

You can convert IPA to Talk, tokenize Talk into sounds, split a word
into syllables, and pack it into the Hangul machine encoding.

```ts
import talk, {
  makeIpaToTalk,
  makeTalkToIpa,
  tokenize,
} from '@cluesurf/talk'
import chunk from '@cluesurf/talk/make/syllables'

// IPA -> Talk (many IPA symbols normalize to one Talk letter)
makeIpaToTalk('kxɯʎʎikʰa̠da̠') // => 'kHOly~ly~ikh~ada'

// Talk -> IPA (Talk is the canonical form, so this round-trips)
makeTalkToIpa('kHO') // => 'kχʊ'

// Tokenize Talk into structured sounds
tokenize('t!a++nDh~') // => [{ form: 'consonant', text: 't', ejective: true }, ...]

// Split into syllables
chunk('fOla^sOfi') // => { syllables: [...], clusters: [...] }

// Pack into one Hangul code point per sound
talk.machine('mh!im') // => '쾒롟켒'
```

## IPA and XSampa

```ts
import {
  makeTalkToIpa,
  makeIpaToTalk,
  makeTalkToXSampa,
  makeXSampaToTalk,
  makeIpaToXSampa,
  makeXSampaToIpa,
} from '@cluesurf/talk'
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

Made by [ClueSurf](https://clue.surf), meditating on the universe ¤.
Follow the work on [YouTube](https://youtube.com/@cluesurf),
[X](https://x.com/cluesurf),
[Instagram](https://instagram.com/cluesurf),
[Substack](https://cluesurf.substack.com),
[Facebook](https://facebook.com/cluesurf), and
[LinkedIn](https://linkedin.com/company/cluesurf), and browse more of
our open-source work here on [GitHub](https://github.com/cluesurf).
