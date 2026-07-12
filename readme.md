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

| ascii           | simplified   | machine                  |
| :-------------- | :----------- | :----------------------- |
| txando^         | txandȯ       | 켶콣뱿켔켤붇             |
| surdjyo^        | suṙdjyȯ      | 콉삟콞켤콃콩붇           |
| HEth\~Ah        | ḥẹtɦạh       | 켾뀟퀢눯콀               |
| siqk            | siṅk         | 콉롟켕켼                 |
| txya@+a-a++u    | txyá̖àa̋u      | 켶콣콩뱌뱶뱷삟           |
| hwpo$kUi^mUno$s | hwpo̤kụïmụno̤s | 콀콧켬뺄켼뙏띗켒뙏켔뺄콉 |
| sinho^rEsi      | sinhȯṙẹsi    | 콉롟켔콀붇콞뀟콉롟       |
| batO\_'aH       | batọ̄'aḥ      | 켧뱿켶뎏켚뱿켾           |
| aiyuQaK         | aiyuq̇aḳ      | 뱿롟콩삟켛뱿켻           |
| s'oQya&te       | s'oq̇ya̰te     | 콉켚뺏켛콩뱩켶멯         |
| t!arEba         | t̗aṙẹba       | 켱뱿콞뀟켧뱿             |
| txhaK!EnEba     | txhaḳ̗ẹnẹba   | 켶콣콀뱿켺뀟켔뀟켧뱿     |
| txh\~im         | txɦim        | 켶큪롟켒                 |
| txy\~h\~im      | txẏɦim       | 켶큤켑롟켒               |
| mh!im           | mħim         | 쾒롟켒                   |

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

| IPA | ascii   | simplified | maching |
| :-- | :------ | :--------- | :------ |
| m̥   | mh!     | mħ         | 쾒      |
| m   | m       | m          | 켒      |
| ɱ̊   | m\~h!   | mħ         | 쾓      |
| ɱ   | m\~     | m          | 쾆      |
| n̼   | n       | n          | 켔      |
| n̪̊   | n\~h!   | nħ         | 쾣      |
| n̪   | n\~     | n          | 쾃      |
| n̥   | nh!     | nħ         | 쾢      |
| n   | n       | n          | 켔      |
| n̠̊   | nh!     | nħ         | 쾢      |
| n̠   | n       | n          | 켔      |
| ɳ̊   | Nh!     | ṇħ         | 쾲      |
| ɳ   | N       | ṇ          | 켓      |
| ɲ̊   | ny\~h!  | nẏħ        | 쾥      |
| ɲ   | ny\~    | nẏ         | 쾤      |
| ŋ̊   | qh!     | ṅħ         | 쿃      |
| ŋ   | q       | ṅ          | 켕      |
| ɴ̥   | qh!     | ṅħ         | 쿃      |
| ɴ   | q       | ṅ          | 켕      |
| p   | p       | p          | 켬      |
| b   | b       | b          | 켧      |
| p̪   | p\~     | p          | 쾅      |
| b̪   | b\~     | b          | 쾄      |
| t̼   | t       | t          | 켶      |
| d̼   | d       | d          | 켤      |
| t̪   | t\~     | t          | 켮      |
| d̪   | d\~     | d          | 켝      |
| t   | t       | t          | 켶      |
| d   | d       | d          | 켤      |
| ʈ   | T       | ṭ          | 켰      |
| ɖ   | D       | ḍ          | 켢      |
| c   | ky\~    | kẏ         | 쿧      |
| ɟ   | gy\~    | gẏ         | 쿗      |
| k   | k       | k          | 켼      |
| ɡ   | g       | g          | 켙      |
| q   | K       | ḳ          | 켻      |
| ɢ   | g       | g          | 켙      |
| ʔ   | '       | '          | 켚      |
| s̪   | s\~     | s          | 쾇      |
| z̪   | z\~     | z          | 쾈      |
| s   | s       | s          | 콉      |
| z   | z       | z          | 콑      |
| ʃ   | x       | x          | 콣      |
| ʒ   | j       | j          | 콃      |
| ʂ   | X       | x̣          | 콡      |
| ʐ   | J       | ȷ̈          | 콁      |
| ɕ   | xy\~    | xẏ         | 큤      |
| ʑ   | jy\~    | jẏ         | 큳      |
| ɸ   | F       | f̣          | 콊      |
| β   | V       | ṿ          | 콍      |
| f   | f       | f          | 콌      |
| v   | v       | v          | 콎      |
| θ̼   | c       | c          | 콗      |
| ð̼   | C       | c̣          | 콕      |
| θ   | c       | c          | 콗      |
| ð   | C       | c̣          | 콕      |
| θ̠   | c       | c          | 콗      |
| ð̠   | C       | c̣          | 콕      |
| ɹ̠˔  | u$      | r          | 삔      |
| ɻ˔  | u$      | r          | 삔      |
| ç   | hy\~    | hẏ         | 탣      |
| ʝ   | y       | y          | 콩      |
| x   | H       | ḥ          | 켾      |
| ɣ   | G       | ġ          | 켗      |
| χ   | H       | ḥ          | 켾      |
| ʁ   | G       | ġ          | 켗      |
| ħ   | Hh\~    | ḥɦ         | 탹      |
| ʕ   | Q       | q̇          | 켛      |
| h   | h       | h          | 콀      |
| ɦ   | hh\~    | hɦ         | 탩      |
| β̞   | V       | ṿ          | 콍      |
| ʋ   | V       | ṿ          | 콍      |
| ð̞   | C       | c̣          | 콕      |
| ɹ   | u$      | r          | 삔      |
| ɹ̠   | u$      | r          | 삔      |
| ɻ   | u$      | r          | 삔      |
| j   | y       | y          | 콩      |
| ɰ   | W       | ẇ          | 콤      |
| ⱱ̟   | V       | ṿ          | 콍      |
| ⱱ   | V       | ṿ          | 콍      |
| ɾ̥   | rh!     | ṙħ         | 턠      |
| ɾ   | r       | ṙ          | 콞      |
| ɽ̊   | Rh!     | ṛħ         | 터      |
| ɽ   | R       | ṛ          | 콜      |
| ɢ̆   | g       | g          | 켙      |
| ʙ̥   | bbh!    | bbħ        | 툗      |
| ʙ   | bb      | bb         | 툖      |
| r̥   | rh!     | ṙħ         | 턠      |
| r   | r       | ṙ          | 콞      |
| r̠   | r       | ṙ          | 콞      |
| ɽ̊r̥  | Rh!rh!  | ṛħṙħ       | 퉊      |
| ɽr  | Rr      | ṛṙ         | 툸      |
| ʀ̥   | GGh!    | ġġħ        | 툩      |
| ʀ   | GG      | ġġ         | 툨      |
| ɬ̪   | S\~     | ṣ          | 쾊      |
| ɬ   | S       | ṣ          | 콆      |
| ɮ   | Z       | ẓ          | 콓      |
| ʎ̝   | ly\~    | lẏ         | 턂      |
| l̪   | l\~     | l          | 쾉      |
| l̥   | lh!     | lħ         | 턀      |
| l   | l       | l          | 콛      |
| l̠   | l       | l          | 콛      |
| ɭ̊   | Lh!     | ḷħ         | 턏      |
| ɭ   | L       | ḷ          | 콘      |
| ʎ̥   | ly\~h!  | lẏħ        | 턃      |
| ʎ   | ly\~    | lẏ         | 턂      |
| ɺ̥   | lh!     | lħ         | 턀      |
| ɺ   | l       | l          | 콛      |
| ʍ   | wh!     | wħ         | 텁      |
| w   | w       | w          | 콧      |
| ɥ   | yw\~    | yẉ         | 텔      |
| ɧ   | H       | ḥ          | 켾      |
| ɫ   | lG\~    | lg̃         | 턆      |
| ɓ   | b?      | b̖          | 켥      |
| ɗ   | d?      | d̖          | 켞      |
| ʄ   | g?y\~   | g̀ẏ         | 툈      |
| ɠ   | g?      | g̀          | 켘      |
| ʛ   | g?      | g̀          | 켘      |
| ɓ̥   | b?h!    | b̖ħ         | 퇣      |
| ɗ̥   | t?      | t̖          | 쾋      |
| ʄ̥   | g?y\~h! | g̀ẏħ        | 툉      |
| ɠ̊   | g?h!    | g̀ħ         | 툅      |
| ʛ̥   | g?h!    | g̀ħ         | 툅      |
| pʼ  | p!      | ṕ          | 켨      |
| tʼ  | t!      | t̗          | 켱      |
| ʈʼ  | T!      | ṭ̗          | 켯      |
| cʼ  | ky\~!   | kẏ̗         | 쾎      |
| kʼ  | k!      | k̗          | 켷      |
| qʼ  | K!      | ḳ̗          | 켺      |
| fʼ  | f!      | f̗          | 콋      |
| sʼ  | s!      | ś          | 콅      |
| ʂʼ  | X!      | x̣́          | 콠      |
| ɕʼ  | xy\~!   | xẏ́         | 쾏      |
| xʼ  | H!      | ḥ̗          | 켽      |
| χʼ  | H!      | ḥ̗          | 켽      |
| ɸʼ  | F!      | f̣́          | 쾍      |
| θʼ  | c!      | ć          | 쾌      |
| ʃʼ  | x!      | x́          | 콟      |
| ʄ̊   | g?y\~h! | g̀ẏħ        | 툉      |
| ɬʼ  | S!      | ṣ́          | 콄      |
| ʘ   | p\*     | p̂          | 켩      |
| ǀ   | t\*     | t̬          | 켲      |
| ǃ   | k\*     | k̬          | 켹      |
| 𝼊   | c\*     | c̬          | 쾐      |
| ǂ   | d\*     | d̬          | 켠      |
| ʞ   | K\*     | ḳ̬          | 쾑      |
| ǁ   | l\*     | l̬          | 콙      |

### Vowels

This is the full set of IPA vowels we map. Every vowel, with any tone,
length, stress, or nasalization, is a single Hangul code point.

| IPA | ascii | simplified | machine |
| :-- | :---- | :--------- | :------ |
| i   | i     | i          | 롟      |
| y   | i$    | i̤          | 롔      |
| ɨ   | i$    | i̤          | 롔      |
| ʉ   | u     | u          | 삟      |
| ɯ   | O     | ọ          | 됿      |
| u   | u     | u          | 삟      |
| ɪ   | I     | ị          | 긏      |
| ʏ   | i$    | i̤          | 롔      |
| ʊ   | O     | ọ          | 됿      |
| e   | e     | e          | 멯      |
| ø   | a$    | a̤          | 뱴      |
| ɘ   | I     | ị          | 긏      |
| ɵ   | O     | ọ          | 됿      |
| ɤ   | O     | ọ          | 됿      |
| o   | o     | o          | 뺏      |
| e̞   | e     | e          | 멯      |
| ø̞   | a$    | a̤          | 뱴      |
| ə   | U     | ụ          | 뙏      |
| ɤ̞   | O     | ọ          | 됿      |
| o̞   | o     | o          | 뺏      |
| ɛ   | E     | ẹ          | 뀟      |
| œ   | e$    | e̤          | 멤      |
| ɜ   | O     | ọ          | 됿      |
| ɞ   | U     | ụ          | 뙏      |
| ʌ   | U     | ụ          | 뙏      |
| ɔ   | o$    | o̤          | 뺄      |
| æ   | A     | ạ          | 눯      |
| ɐ   | a     | a          | 뱿      |
| a   | a     | a          | 뱿      |
| ɶ   | e$    | e̤          | 멤      |
| ä   | a     | a          | 뱿      |
| ɑ   | a     | a          | 뱿      |
| ɒ   | a     | a          | 뱿      |

Every vowel takes the same modifier set (stress, length, nasal, tone,
etc.). Here are all the combos for the letter `a`, and the same pattern
applies to all vowels.

| IPA  | ascii | simplified |
| :--- | :---- | :--------- |
| æ    | A     | ạ          |
| œ    | a$    | a̤          |
| ˈa   | a^    | ȧ          |
| aː   | a\_   | ā          |
| aʼ   | a!    | a̱          |
| a̰    | a&    | a̰          |
| a͈    | a@    | a̖          |
| a˦   | a+    | á          |
| a˥   | a++   | a̋          |
| a˨   | a-    | à          |
| a˩   | a--   | ȁ          |
| a˧˥  | a/    | ą́          |
| a˩˥  | a//   | ą̋          |
| a˥˧  | a\\   | ą̀          |
| a˥˩  | a\\\\ | ą̏          |
| a˩˥˩ | a/\   | â          |
| a˥˩˥ | a\\/  | ǎ          |

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

## Libraries

- [`@cluesurf/text`](https://github.com/cluesurf/text.js): Builds off
  Talk spec to convert different scripts/orthographies into TalkText.
- [`@cluesurf/tone`](https://github.com/cluesurf/tone): Takes the Talk
  formatted ASCII text and [renders it](https://tone.surf) using
  ToneText.

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
