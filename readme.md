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
one integer per sound, base plus all its modifiers, so a whole word
becomes a compact array with one entry per sound rather than per
character.

| tone | machine |
| :--- | :--- |
| txando^ | 20504 24544 7592 14904 9032 16324 |
| siqk | 19864 11800 16920 12376 |
| mh!im | 14592 11800 14584 |
| t!arEba | 20534 7592 17304 1120 7976 7592 |
| s\'oQya\~te | 19864 0 16312 4000 24800 7616 20504 10664 |

## Encoding

A sound is a BASE plus, when it has any, one bracketed run of MODIFIERS.
`kʷʰ` is `k<wh>`: one pair of brackets however many marks the run holds,
and the marks in the order of the modifier table below, so a set of
modifiers has exactly one spelling.

Reading is looser than writing. The parser takes the marks in any order
inside the brackets, the same way it takes `n̪̥` and `n̥̪` for one sound,
and gives back the canonical form.

Two rules keep the notation usable elsewhere. Every spelling is ASCII and
survives a URL unencoded, so a sound can be a path segment. And `(`, `)`,
`[`, `]`, `{` and `}` never appear, which leaves them free for the regular
expressions a search surface needs.

A mark listed `before base` is a different sound from the same mark after
it: `ʰk` is pre-aspirated and `kʰ` post-aspirated, so they never share a
spelling.

### Consonants

| ipa | talk | place | manner | voicing |
| --- | --- | --- | --- | --- |
| ɹ | `$r` | alveolar | approximant | voiced |
| ǃ | `k!` | alveolar | click | voiceless |
| l | `l` | alveolar | lateral-approximant | voiced |
| ɫ | `l<q>` | alveolar | lateral-approximant | voiced |
| l̥ | `l<v->` | alveolar | lateral-approximant | voiceless |
| ǁ | `l!` | alveolar | lateral-click | voiceless |
| ɮ | `Z` | alveolar | lateral-fricative | voiced |
| ɬ | `S` | alveolar | lateral-fricative | voiceless |
| ɬʼ | `S<!>` | alveolar | lateral-fricative | voiceless |
| ɺ | `$r<r>` | alveolar | lateral-tap-flap | voiced |
| ɺ̥ | `$r<rv->` | alveolar | lateral-tap-flap | voiceless |
| n | `n` | alveolar | nasal | voiced |
| n̥ | `n<v->` | alveolar | nasal | voiceless |
| ð̠ | `$d<P->` | alveolar | non-sibilant-fricative | voiced |
| θ̠ | `$t<P->` | alveolar | non-sibilant-fricative | voiceless |
| d | `d` | alveolar | plosive | voiced |
| ɗ | `d<@>` | alveolar | plosive | voiced |
| t | `t` | alveolar | plosive | voiceless |
| ɗ̥ | `d<@v->` | alveolar | plosive | voiceless |
| tʼ | `t<!>` | alveolar | plosive | voiceless |
| z | `z` | alveolar | sibilant-fricative | voiced |
| s | `s` | alveolar | sibilant-fricative | voiceless |
| sʼ | `s<!>` | alveolar | sibilant-fricative | voiceless |
| ɾ | `r<f>` | alveolar | tap-flap | voiced |
| ɾ̥ | `r<fv->` | alveolar | tap-flap | voiceless |
| r | `r` | alveolar | trill | voiced |
| r̥ | `r<v->` | alveolar | trill | voiceless |
| β̞ | `$v<P_>` | bilabial | approximant | voiced |
| ʘ | `p!` | bilabial | click | voiceless |
| m | `m` | bilabial | nasal | voiced |
| m̥ | `m<v->` | bilabial | nasal | voiceless |
| β | `$v` | bilabial | non-sibilant-fricative | voiced |
| ɸ | `F` | bilabial | non-sibilant-fricative | voiceless |
| ɸʼ | `F<!>` | bilabial | non-sibilant-fricative | voiceless |
| b | `b` | bilabial | plosive | voiced |
| ɓ | `b<@>` | bilabial | plosive | voiced |
| p | `p` | bilabial | plosive | voiceless |
| ɓ̥ | `b<@v->` | bilabial | plosive | voiceless |
| pʼ | `p<!>` | bilabial | plosive | voiceless |
| ⱱ̟ | `v<fP+>` | bilabial | tap-flap | voiced |
| ʙ | `b<r>` | bilabial | trill | voiced |
| ʙ̥ | `b<rv->` | bilabial | trill | voiceless |
| ð̞ | `$d<P_>` | dental | approximant | voiced |
| ǀ | `t!` | dental | click | voiceless |
| l̪ | `l<d>` | dental | lateral-approximant | voiced |
| ɬ̪ | `S<d>` | dental | lateral-fricative | voiceless |
| n̪ | `n<d>` | dental | nasal | voiced |
| n̪̥ | `n<dv->` | dental | nasal | voiceless |
| ð | `$d` | dental | non-sibilant-fricative | voiced |
| θ | `$t` | dental | non-sibilant-fricative | voiceless |
| θʼ | `$t<!>` | dental | non-sibilant-fricative | voiceless |
| d̪ | `d<d>` | dental | plosive | voiced |
| t̪ | `t<d>` | dental | plosive | voiceless |
| z̪ | `z<d>` | dental | sibilant-fricative | voiced |
| s̪ | `s<d>` | dental | sibilant-fricative | voiceless |
| ˷ | `h<k>` | glottal | approximant | voiced |
| ɦ | `h<v>` | glottal | non-sibilant-fricative | voiced |
| h | `h` | glottal | non-sibilant-fricative | voiceless |
| ʔ | `'` | glottal | plosive | voiced |
| ɥ | `y<w>` | labial-palatal | fricative-approximant | voiced |
| w | `w` | labial-velar | fricative-approximant | voiced |
| ʍ | `w<v->` | labial-velar | fricative-approximant | voiceless |
| ʋ | `V` | labiodental | approximant | voiced |
| ɱ | `$m` | labiodental | nasal | voiced |
| ɱ̥ | `$m<v->` | labiodental | nasal | voiceless |
| v | `v` | labiodental | non-sibilant-fricative | voiced |
| f | `f` | labiodental | non-sibilant-fricative | voiceless |
| fʼ | `f<!>` | labiodental | non-sibilant-fricative | voiceless |
| b̪ | `b<d>` | labiodental | plosive | voiced |
| p̪ | `p<d>` | labiodental | plosive | voiceless |
| ⱱ | `v<f>` | labiodental | tap-flap | voiced |
| n̼ | `n<m>` | linguolabial | nasal | voiced |
| ð̼ | `$d<m>` | linguolabial | non-sibilant-fricative | voiced |
| θ̼ | `$t<m>` | linguolabial | non-sibilant-fricative | voiceless |
| d̼ | `d<m>` | linguolabial | plosive | voiced |
| t̼ | `t<m>` | linguolabial | plosive | voiceless |
| j | `y` | palatal | approximant | voiced |
| ǂ | `d!` | palatal | click | voiceless |
| ʎ | `l<y>` | palatal | lateral-approximant | voiced |
| ʎ̥ | `l<yv->` | palatal | lateral-approximant | voiceless |
| 𝼆 | `S<y>` | palatal | lateral-fricative | voiced |
| ʎ̝ | `l<yP^>` | palatal | lateral-fricative | voiced |
| ʎ̮ | `l<fy>` | palatal | lateral-tap-flap | voiced |
| ɲ | `n<y>` | palatal | nasal | voiced |
| ɲ̥ | `n<yv->` | palatal | nasal | voiceless |
| ʝ | `Y` | palatal | non-sibilant-fricative | voiced |
| ç | `h<y>` | palatal | non-sibilant-fricative | voiceless |
| ɟ | `g<y>` | palatal | plosive | voiced |
| ʄ | `g<@y>` | palatal | plosive | voiced |
| c | `k<y>` | palatal | plosive | voiceless |
| ʄ̥ | `g<@yv->` | palatal | plosive | voiceless |
| cʼ | `k<y!>` | palatal | plosive | voiceless |
| ʑ | `j<y>` | palatal | sibilant-fricative | voiced |
| ɕ | `x<y>` | palatal | sibilant-fricative | voiceless |
| ɕʼ | `x<y!>` | palatal | sibilant-fricative | voiceless |
| ʕ | `$'` | pharyngeal-epiglottal | non-sibilant-fricative | voiced |
| ħ | `$h` | pharyngeal-epiglottal | non-sibilant-fricative | voiceless |
| ʡ | `'<q>` | pharyngeal-epiglottal | plosive | voiceless |
| ʡ̮ | `'<qf>` | pharyngeal-epiglottal | tap-flap | voiceless |
| ʢ | `$G<gr>` | pharyngeal-epiglottal | trill | voiced |
| ʜ | `$h<r>` | pharyngeal-epiglottal | trill | voiceless |
| ɹ̠ | `$r<P->` | postalveolar | approximant | voiced |
| l̠ | `l<P->` | postalveolar | lateral-approximant | voiced |
| n̠ | `n<P->` | postalveolar | nasal | voiced |
| n̠̥ | `n<P-v->` | postalveolar | nasal | voiceless |
| ɹ̠˔ | `$r<P-S^>` | postalveolar | non-sibilant-fricative | voiced |
| ɹ̠̥˔ | `$r<P-S^v->` | postalveolar | non-sibilant-fricative | voiceless |
| ʒ | `j` | postalveolar | sibilant-fricative | voiced |
| ʃ | `x` | postalveolar | sibilant-fricative | voiceless |
| ʃʼ | `x<!>` | postalveolar | sibilant-fricative | voiceless |
| r̠ | `r<P->` | postalveolar | trill | voiced |
| ɧ | `$x` | postalveolar-velar | non-sibilant-fricative | voiceless |
| ɻ | `$R` | retroflex | approximant | voiced |
| 𝼊 | `T!` | retroflex | click | voiceless |
| ɭ | `L` | retroflex | lateral-approximant | voiced |
| ɭ̥ | `L<v->` | retroflex | lateral-approximant | voiceless |
| ꞎ | `$S` | retroflex | lateral-fricative | voiced |
| 𝼅 | `$Z` | retroflex | lateral-fricative | voiced |
| 𝼈 | `$R<r>` | retroflex | lateral-tap-flap | voiced |
| 𝼈̥ | `$R<rv->` | retroflex | lateral-tap-flap | voiceless |
| ɳ | `N` | retroflex | nasal | voiced |
| ɳ̥ | `N<v->` | retroflex | nasal | voiceless |
| ɻ˔ | `$R<S^>` | retroflex | non-sibilant-fricative | voiced |
| ɻ̥˔ | `$R<S^v->` | retroflex | non-sibilant-fricative | voiceless |
| ɖ | `D` | retroflex | plosive | voiced |
| ᶑ | `D<@>` | retroflex | plosive | voiced |
| ʈ | `T` | retroflex | plosive | voiceless |
| ᶑ̥ | `D<@v->` | retroflex | plosive | voiceless |
| ʈʼ | `T<!>` | retroflex | plosive | voiceless |
| ʐ | `J` | retroflex | sibilant-fricative | voiced |
| ʂ | `X` | retroflex | sibilant-fricative | voiceless |
| ʂʼ | `X<!>` | retroflex | sibilant-fricative | voiceless |
| ɽ | `R<f>` | retroflex | tap-flap | voiced |
| ɽ̥ | `R<fv->` | retroflex | tap-flap | voiceless |
| ɽr | `R<r>` | retroflex | trill | voiced |
| ɽ̥r̥ | `R<rv->` | retroflex | trill | voiceless |
| ʟ̠ | `l<$gP->` | uvular | lateral-approximant | voiced |
| ɴ | `$N` | uvular | nasal | voiced |
| ɴ̥ | `$N<v->` | uvular | nasal | voiceless |
| ʁ | `$G` | uvular | non-sibilant-fricative | voiced |
| χ | `$H` | uvular | non-sibilant-fricative | voiceless |
| χʼ | `$H<!>` | uvular | non-sibilant-fricative | voiceless |
| ɢ | `G` | uvular | plosive | voiced |
| ʛ | `G<@>` | uvular | plosive | voiced |
| q | `K` | uvular | plosive | voiceless |
| ʛ̥ | `G<@v->` | uvular | plosive | voiceless |
| qʼ | `K<!>` | uvular | plosive | voiceless |
| ɢ̆ | `G<_3>` | uvular | tap-flap | voiced |
| ʀ | `$G<r>` | uvular | trill | voiced |
| ʀ̥ | `$G<rv->` | uvular | trill | voiceless |
| ɰ | `W` | velar | approximant | voiced |
| ʞ | `K!` | velar | click |  |
| ʟ | `l<$g>` | velar | lateral-approximant | voiced |
| ʟ̥ | `l<$gv->` | velar | lateral-approximant | voiceless |
| 𝼄 | `S<$g>` | velar | lateral-fricative | voiced |
| ʟ̝ | `l<$gP^>` | velar | lateral-fricative | voiced |
| ʟ̆ | `l<$g_3>` | velar | lateral-tap-flap | voiced |
| ŋ | `$n` | velar | nasal | voiced |
| ŋ̥ | `$n<v->` | velar | nasal | voiceless |
| ɣ | `$g` | velar | non-sibilant-fricative | voiced |
| x | `H` | velar | non-sibilant-fricative | voiceless |
| xʼ | `H<!>` | velar | non-sibilant-fricative | voiceless |
| ɡ | `g` | velar | plosive | voiced |
| ɠ | `g<@>` | velar | plosive | voiced |
| k | `k` | velar | plosive | voiceless |
| ɠ̥ | `g<@v->` | velar | plosive | voiceless |
| kʼ | `k<!>` | velar | plosive | voiceless |

### Vowels

| ipa | talk | height | backness | roundedness |
| --- | --- | --- | --- | --- |
| ɯ | `$O` | close | back | unrounded |
| u | `u` | close | back | rounded |
| ɨ | `~i` | close | central | unrounded |
| ʉ | `~u` | close | central | rounded |
| i | `i` | close | front | unrounded |
| y | `$i` | close | front | rounded |
| ɤ | `~O` | close-mid | back | unrounded |
| o | `o` | close-mid | back | rounded |
| ɘ | `$I` | close-mid | central | unrounded |
| ɵ | `~o` | close-mid | central | rounded |
| e | `e` | close-mid | front | unrounded |
| ø | `$e` | close-mid | front | rounded |
| ɤ̞ | `~O<P_>` | mid | back | unrounded |
| o̞ | `o<P_>` | mid | back | rounded |
| ə | `U` | mid | central | unrounded |
| e̞ | `e<P_>` | mid | front | unrounded |
| ø̞ | `$e<P_>` | mid | front | rounded |
| ʊ | `O` | near-close | back | rounded |
| ɪ | `I` | near-close | front | unrounded |
| ʏ | `~I` | near-close | front | rounded |
| ɐ | `$A` | near-open | central | unrounded |
| æ | `A` | near-open | front | unrounded |
| ɑ | `~a` | open | back | unrounded |
| ɒ | `~U` | open | back | rounded |
| ä | `$a` | open | central | unrounded |
| a | `a` | open | front | unrounded |
| ɶ | `~A` | open | front | rounded |
| ʌ | `$U` | open-mid | back | unrounded |
| ɔ | `$o` | open-mid | back | rounded |
| ɜ | `$E` | open-mid | central | unrounded |
| ɞ | `~E` | open-mid | central | rounded |
| ɛ | `E` | open-mid | front | unrounded |
| œ | `~e` | open-mid | front | rounded |

### Modifiers

| ipa | talk | feature | slot | position |
| --- | --- | --- | --- | --- |
| ɾ | `<f>` | tap | manner | after base |
| ʙ | `<r>` | trill | manner | after base |
| ̺ | `<t>` | apical | tongue-blade | after base |
| ̪ | `<d>` | dental | articulation | after base |
| ̻ | `<l>` | laminal | tongue-blade | after base |
| ̼ | `<m>` | linguolabial | articulation | after base |
| ̟ | `<P+>` | advanced | tongue-shape | after base |
| ̘ | `<T+>` | advanced-tongue-root | tongue-root | after base |
| ̈ | `<c>` | centralized | tongue-shape | after base |
| ̞ | `<P_>` | lowered | tongue-shape | after base |
| ˕ | `<S_>` | lowered-spacing | tongue-shape | after base |
| ̽ | `<c~>` | mid-centralized | tongue-shape | after base |
| ̝ | `<P^>` | raised | tongue-shape | after base |
| ˔ | `<S^>` | raised-spacing | tongue-shape | after base |
| ̠ | `<P->` | retracted | tongue-shape | after base |
| ˗ | `<S->` | retracted-spacing | tongue-shape | after base |
| ̙ | `<T->` | retracted-tongue-root | tongue-root | after base |
| ̃ | `<n>` | nasalized | nasal | after base |
| ᵐ | `<m~>` | prenasalized-labial | nasal | after base |
| ᵑ | `<q~>` | prenasalized-velar | nasal | after base |
| ᵊ | `<e~>` | epenthetic | release | after base |
| ̯ | `<s->` | non-syllabic | syllabicity | after base |
| ʸ | `<y~>` | palatal-release | release | after base |
| ˢ | `<s~>` | sibilant-release | release | after base |
| ̩ | `<s>` | syllabic | syllabicity | after base |
| ↓ | `<p0>` | downstep | tone | after base |
| ˥ | `<p5>` | extra-high-tone | tone | after base |
| ̋ | `<t5>` | extra-high-tone | tone | after base |
| ˩ | `<p1>` | extra-low-tone | tone | after base |
| ̏ | `<t1>` | extra-low-tone | tone | after base |
| ̂ | `<t->` | falling-tone | tone | after base |
| ˦ | `<p4>` | high-tone | tone | after base |
| ́ | `<t4>` | high-tone | tone | after base |
| ˨ | `<p2>` | low-tone | tone | after base |
| ̀ | `<t2>` | low-tone | tone | after base |
| ˧ | `<p3>` | mid-tone | tone | after base |
| ̄ | `<t3>` | mid-tone | tone | after base |
| ̌ | `<t+>` | rising-tone | tone | after base |
| ̆ | `<_3>` | extra-short | duration | after base |
| ˑ | `<_2>` | half-long | duration | after base |
| ː | `<_>` | long | duration | after base |
| ᶣ | `<$w>` | labial-palatalized | tongue-body | after base |
| ʲ | `<y>` | palatalized | tongue-body | after base |
| ˤ | `<q>` | pharyngealized | tongue-body | after base |
| ˠ | `<$g>` | velarized | tongue-body | after base |
| ˌ | `<^2>` | secondary-stress | stress | before base |
| ˈ | `<^>` | stress | stress | before base |
| ʷ | `<w>` | labialized | labial | after base |
| ̜ | `<o->` | less-rounded | rounding | after base |
| ̹ | `<o+>` | more-rounded | rounding | after base |
| ʰ | `<h>` | aspirated | laryngeal | after base |
| ʼ | `<!>` | ejective | laryngeal | after base |
| ˀ | `<g>` | glottalized | laryngeal | after base |
| ʱ | `<h~>` | murmured | laryngeal | after base |
| ˡ | `<l~>` | lateral-release | release | after base |
| ⁿ | `<n~>` | nasal-release | release | after base |
| ̚ | `<.>` | unreleased | release | after base |
| ˞ | `<$u>` | rhotic | rhoticity | after base |
| ͈ | `<f+>` | fortis | tension | after base |
| ͓ | `<x+>` | frictionalized | frication | after base |
| ͉ | `<f->` | lenis | tension | after base |
| ͇ | `<x->` | non-sibilant | frication | after base |
| ̤ | `<b>` | breathy | phonation | after base |
| ̰ | `<k>` | creaky | phonation | after base |
| ᴱ | `<z>` | sphincteric | phonation | after base |
| ̬ | `<v>` | voiced | phonation | after base |
| ̥ | `<v->` | voiceless | phonation | after base |

## Syllables

Talk also splits a word into syllables, each a sequence of onset,
nucleus, and coda clusters. IPA and X-SAMPA give you symbols and stop
there, so this comes built in, which the TTS, speech-recognition, and
language-learning use cases all need.

Some rarer sounds are not yet handled by the syllable system. The
current gaps are listed in
[`base/syllable/unsupported.csv`](base/syllable/unsupported.csv)
(dentals, retroflex plosives, implosives, ejectives, and clicks).

## Encodings

There are two NOTATIONS and three TIERS, so six encodings in all. Which
one you want follows from two questions: does it need to give the sound
back exactly, and how much detail does it need to carry.

### The two notations

**`ipa`** is lossless. It reads and writes the source strings, so what
goes in comes back out. Use it when something downstream will be compared
to, displayed as, or exported as the original: a dictionary field, a
conlang's stored inventory, a join against Phoible or Wiktionary.

**`tone`** is talk's own ASCII notation, the one this readme spends most
of its length on. It is deliberately COARSER than IPA: `O` covers six IPA
vowels, `i$` covers `ɨ`, `y` and `ʏ`, `H$` and `x` share a base. That
coarseness is the point, because it makes the space small enough to be a
model's vocabulary, but it means `tone` does not round-trip every
distinction IPA can write.

The LIBRARY is called talk; the NOTATION it defines is called tone.

### The three tiers

| tier | holds | `tone` | `ipa` | bytes |
| :--- | :--- | ---: | ---: | :--- |
| `seed` | one atomic unit: a base, or a single mark | 110 | 168 | 1 |
| `band` | a base plus its segmental marks | 2,161 | 7,432,128 | 2 / 3 |
| `mesh` | a base plus everything, suprasegmentals included | 25,426 | 166,167,936 | 2 / 4 |

`seed` splits a sound into its parts, so `pʰ` becomes two units. Small
enough to read, and the right shape for a factored model vocabulary.

`band` keeps aspiration, dentality, voicelessness and secondary
articulation, and drops duration, stress, tone and syllabicity. Note that
vowel length is phonemic in Finnish, Japanese and Arabic, so this tier is
narrower than it sounds.

`mesh` keeps everything the notation encodes. This is the default.

### Using them

```ts
import {
  machine,
  machineText,
  machineBytes,
  byteWidth,
} from '@cluesurf/talk'

// The flat code: one integer per sound, tone at full detail.
machine({ text: 'takw~a', type: 'tone', system: 'mesh' })
// [20504, 7592, 12424, 7592]
machineText({ text: 'takw~a', type: 'tone', system: 'mesh' })
// fixed-width characters, for a text index

// A tier, chosen.
machine({ text: 'tʰa', type: 'ipa', system: 'seed' }) // [18, 104, 0]
machine({ text: 'tʰa', type: 'ipa', system: 'mesh' }) // [49710672, 0]
machine({ text: 'th~a', type: 'tone', system: 'band' }) // [1778, 683]

byteWidth({ type: 'ipa', system: 'mesh' }) // 4
machineBytes({ text: 'th~a', type: 'tone', system: 'mesh' }) // 4 bytes
```

Every code is COMPUTED, not looked up. A table for `ipa mesh` would be
over a gigabyte, so each code is a mixed-radix index instead: the base
picks an offset and each axis contributes a digit whose radix is how many
marks that axis offers that base. The only tables are the bases, the axes
and a per-base offset, a few thousand integers, so this runs in a browser
as happily as on a server and the package ships no code registry at all.

### Choosing a tier

The number that decides it is not vocabulary size but how often a tier
MERGES two sounds some language contrasts. Measured across Phoible's
3,020 doculects:

| tier | attested | merged pairs | inventories losing a contrast |
| :--- | ---: | ---: | ---: |
| `seed` | 953 | 4,003 | 81% |
| `band` | 1,722 | 1,490 | 56% |
| `mesh` | 2,161 | 694 | 29% |
| `ipa mesh` | 3,422 | 0 | 0% |

Read the last column first: it is the share of documented languages for
which the encoding destroys a distinction the language depends on. Even
`tone mesh` costs 29%, because talk's base inventory is deliberately
coarse and no tier setting recovers that. If a merged contrast would be a
bug, use `ipa`.

A note on scale: `tone mesh` holds 25,426 producible sounds and only
2,161 are attested anywhere. The other 91% are pronounceable and simply
nobody's, which is the space a constructed language draws from.

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
