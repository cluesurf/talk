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
across several tokens. If you build TTS, ASR, G2P, or any multilingual
pipeline that has to reason about how words sound, this gives you one
clean token per phone that converts losslessly to and from IPA, plus
syllabification for free.

It is also a readable, keyboard-typable **romanization**. The notation
is called **tone**, and it uses the Latin script with diacritics to
encode most of Earth's natural language features, enough that you can
write every language in the same Latin-oriented system and land close to
a realistic pronunciation, including nasalized vowels, tense consonants,
clicks, and tones. It reads like the pronunciation guides people already
know, so a non-linguist can get the gist without special training.

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
tone, and the machine (token) encoding, carries the tiered codec, and
splits words into syllables.

All three are verified against ONE fixture,
`deck/rust/test/fixture/parity.json`, which is the TypeScript build's
own output over every enumerated sound. The ports read it directly, so
agreement is checked against a shared answer rather than against
hand-written cases each port could get wrong in the same way.

| Language   | Library                             | Status |
| :--------- | :---------------------------------- | :----- |
| TypeScript | [`@cluesurf/talk`](deck/typescript) | ✅     |
| Rust       | [`cluesurf-talk`](deck/rust)        | ✅     |
| Python     | [`cluesurf-talk`](deck/python)      | ✅     |

## Examples

Real words, with their IPA from the ClueSurf export, the talk spelling,
and the syllable split. They are chosen for how much of the phonetic
space they use: the vowelless words of Bella Coola, the ejectives of
Georgian and Archi, the clicks of Hadza, the tone contours of Burmese
and Vietnamese, the stød of Danish.

| language    | word                          | talk                                                                          |
| :---------- | :---------------------------- | :---------------------------------------------------------------------------- |
| Abkhaz      | а-ҿарҳас-ра                   | `aTX<!>ar$hasra`                                                              |
|             | aʈʂʼarħasra                   | `a.TX<!>ar.$ha.sra`                                                           |
| Amharic     | ጭንቅላት                         | `tx<!B>~ink<!>~i<^>l<_>at`                                                    |
|             | t͡ʃʼɨnˈkʼɨlːat                 | `tx<!B>~in.k<!>~i<^>.l<_>at`                                                  |
| Archi       | q'ʷˤáq'ˤart̄utʰ                | `K<qw!>a<t4>K<q!>art<t3>ut<h>`                                                |
|             | qʷˤʼáqˤʼart̄utʰ                | `K<qw!>a<t4>.K<q!>ar.t<t3>ut<h>`                                              |
| Bella Coola | cactawłp                      | `ts<hB>ats<hB>t<h>awSp`                                                       |
|             | t͡sʰat͡sʰtʰawɬp                 | `ts<hB>ats<hB>.t<h>awS.p`                                                     |
| Burmese     | ငွေကြေးဖောင်းပွခြင်း          | `$nwe<t2>tx<yB>e<t4>p<h>a<t4>O$Npwa<k>dj<yB>I<t4>$N`                          |
|             | ŋwèt͡ɕépʰáʊɴpwa̰d͡ʑɪ́ɴ            | `$nwe<t2>.tx<yB>e<t4>.p<h>a<t4>O$N.pwa<k>.dj<yB>I<t4>$N`                      |
| Chechen     | на̄къост                       | `na<_^>K$H<!B>u<s->ost`                                                       |
|             | ˈnaːq͡χʼu̯ost                   | `na<_^>K$H<!B>.u<s->ost`                                                      |
| Czech       | dvanáctníkový                 | `dva<^>na<_>ts<B>tn<y>i<_>kovi<_>`                                            |
|             | ˈdvanaːt͡stɲiːkoviː            | `dva<^>.na<_>ts<B>.tn<y>i<_>.ko.vi<_>`                                        |
| Danish      | olivengren                    | `oli<_^g>vUngrE<_^2g>n`                                                       |
|             | oˈliːˀvənˌɡrɛːˀn              | `o.li.<g^_>vUn.grE<g^2_>n`                                                    |
| French      | auteur-compositeur-interprète | `o\.t~e$G\.k$o<n>\.po\.zi\.t~e\.$GE<n>\.tE$G\.p$GEt`                          |
|             | o.tœʁ.kɔ̃.po.zi.tœ.ʁɛ̃.tɛʁ.pʁɛt | `o.t~e$G.k$o<n>.po.zi.t~e.$GE<n>.tE$Gp.$GEt`                                  |
| Georgian    | წინასწარმეტყველი              | `ts<!B>inasts<!B>ar<f>met<!>$H<w!>eli`                                        |
|             | t͡sʼinast͡sʼaɾmetʼχʷʼeli        | `ts<!B>i.nas.ts<!B>ar<f>.met<!>.$H<w!>e.li`                                   |
| Hadza       | kǁekǁetʃe-                    | `$n<v->l!<!>e$n<v->l!<!>etxe`                                                 |
|             | ŋ̥ǁʼeŋ̥ǁʼetʃe                   | `$n<v->l!<!>e$n<v->.l!<!>e.txe`                                               |
| Hebrew      | ביטוח / בִּטּוּחַ             | `bit<_q>u<_^>a$h`                                                             |
|             | biˈtˤːuːaħ                    | `bi.t<_q>u<_^>a$h`                                                            |
| Irish       | clóscríobhaí                  | `kl<$g>o<_^>xk<y>r<f><y>i<_>wi<_>`                                            |
|             | ˈklˠoːʃcɾʲiːwiː               | `kl<$g>o<_^>xk<y>.r<f><y>i<_>.wi<_>`                                          |
| Japanese    | 中継放送                      | `tx<yB>~i<_>ke<P_><_>ho<P_><_>so<P_><_>`                                      |
|             | t͡ɕɨːke̞ːho̞ːso̞ː                 | `tx<yB>~i<_>.ke<P_><_>.ho<P_><_>.so<P_><_>`                                   |
| Korean      | 제주특별자치도                | `tx<yB>e<P_><_^>dj<yB>ut<h>$Ok<.>p<f+>y$U<o+>l<y>dj<yB>a<P->tx<y><hB>ido<P_>` |
|             | ˈt͡ɕe̞ːd͡ʑutʰɯk̚p͈jʌ̹ʎd͡ʑa̠t͡ɕʰido̞     | `—`                                                                           |
| Maltese     | għaġina                       | `a<_q>dj<B>i<_^>\.na`                                                         |
|             | aˤːˈd͡ʒiː.na                   | `a.<q_>dj<B>i<_^>.na`                                                         |
| Navajo      | chąąsht'ezhiitsoh             | `tx<hB>~a<nt2_>xt<!>E<t2>ji<t2_>ts<hB>o<t2>h`                                 |
|             | t͡ʃʰɑ̃̀ːʃtʼɛ̀ʒìːt͡sʰòh             | `tx<hB>~a<nt2_>.xt<!>E<t2>.ji<t2_>ts<hB>.o<t2>h`                              |
| Polish      | przyoszczędzić                | `pX$I\.$oXtX<B>E<^>n<y>\.dj<yB>itx<yB>`                                       |
|             | pʂɘ.ɔˈʂt͡ʂɛɲ.d͡ʑit͡ɕ             | `pX$I.$o.XtX<B>E<^>n<y>.dj<yB>itx<yB>`                                        |
| Sandawe     | kǁ'ék'a                       | `kl!<!>e<t4>k<!>a`                                                            |
|             | kǁʼékʼa                       | `kl!<!>e<t4>.k<!>a`                                                           |
| Taa         | ǀòho                          | `kt!<B>o<t2>ho<_>`                                                            |
|             | k͡ǀòhoː                        | `—`                                                                           |
| Tlingit     | tl'áatl'                      | `tS<!B>a<t4_>tS<!B>`                                                          |
|             | t͡ɬʼáːt͡ɬʼ                      | `tS<!B>a<t4_>tS<!B>`                                                          |
| Ubykh       | t͡ɬ'əč́'á                       | `tS<!B>Uk<y><t+t4!>a<t4>`                                                     |
|             | t͡ɬʼəč́ʼá                       | `tS<!B>U.k<y><t+t4!>a<t4>`                                                    |
| Vietnamese  | ắc-coóc-đê-ông                | `a<_3>k<p4p5>\-k$okp<p4p5B>\-de<p3p3>\-o$nm<p3p3B>`                           |
|             | ăk˦˥-kɔk͡p˦˥-de˧˧-oŋ͡m˧˧        | `—`                                                                           |
| Welsh       | lletygarwch                   | `Se<_^>ti<_>garw$H`                                                           |
|             | ˈɬeːtiːɡarwχ                  | `Se<_^>.ti<_>.garw.$H`                                                        |
| Xhosa       | -quba                         | `kk!u<_>b<@>a`                                                                |
|             | kǃuːɓa                        | `kk!u<_>.b<@>a`                                                               |
| Yoruba      | rẹnfẹ́nrẹnfẹ́n                  | `r<f>E<nt3>\.fE<nt4>\.r<f>E<nt3>\.fE<nt4>`                                    |
|             | ɾɛ̃̄.fɛ̃́.ɾɛ̃̄.fɛ̃́                   | `r<f>E<nt3>.fE<nt4>.r<f>E<nt3>.fE<nt4>`                                       |
| Zulu        | -qúba                         | `k!u<t4_>b<@>a`                                                               |
|             | ǃúːɓa                         | `k!u<t4_>.b<@>a`                                                              |

## Encoding

A sound is a BASE plus, when it has any, one bracketed run of MODIFIERS.
`kʷʰ` is `k<wh>`: one pair of brackets however many marks the run holds,
and the marks in the order of the modifier table below, so a set of
modifiers has exactly one spelling.

Reading is looser than writing. The parser takes the marks in any order
inside the brackets, the same way it takes `n̪̥` and `n̥̪` for one sound,
and gives back the canonical form.

Two rules keep the notation usable elsewhere. Every spelling is ASCII
and survives a URL unencoded, so a sound can be a path segment. And `(`,
`)`, `[`, `]`, `{` and `}` never appear, which leaves them free for the
regular expressions a search surface needs.

A mark listed `before base` is a different sound from the same mark
after it: `ʰk` is pre-aspirated and `kʰ` post-aspirated, so they never
share a spelling.

### Consonants

The IPA consonant chart, in chart order: by place across and manner
down, the order the chart itself uses. Generated by
`pnpm exec tsx code/make/readme-tables.ts` from `base/phones.json` and
`base/chart/consonant-symbols.csv`, so it cannot drift from the data.

A dash in the X-SAMPA column means the symbol has none. X-SAMPA is an
ASCII scheme from the 1990s and eight of these were added to the IPA
afterwards, so no ASCII spelling was ever assigned.

| IPA | talk     | X-SAMPA   | place                 | manner                 | voice     |
| --- | -------- | --------- | --------------------- | ---------------------- | --------- | --- |
| m   | `m`      | `m`       | Bilabial              | Nasal                  | voiced    |
| ɱ   | `$m`     | `F`       | Labiodental           | Nasal                  | voiced    |
| n   | `n`      | `n`       | Alveolar              | Nasal                  | voiced    |
| ɳ   | `N`      | `` n` ``  | Retroflex             | Nasal                  | voiced    |
| ɲ   | `n<y>`   | `J`       | (Alveolo-)palatal     | Nasal                  | voiced    |
| ŋ   | `$n`     | `N`       | Velar                 | Nasal                  | voiced    |
| ɴ   | `$N`     | `N\`      | Uvular                | Nasal                  | voiced    |
| p   | `p`      | `p`       | Bilabial              | Plosive                | voiceless |
| b   | `b`      | `b`       | Bilabial              | Plosive                | voiced    |
| t   | `t`      | `t`       | Alveolar              | Plosive                | voiceless |
| d   | `d`      | `d`       | Alveolar              | Plosive                | voiced    |
| ʈ   | `T`      | `` t` ``  | Retroflex             | Plosive                | voiceless |
| ɖ   | `D`      | `` d` ``  | Retroflex             | Plosive                | voiced    |
| c   | `k<y>`   | `c`       | (Alveolo-)palatal     | Plosive                | voiceless |
| ɟ   | `g<y>`   | `J\`      | (Alveolo-)palatal     | Plosive                | voiced    |
| k   | `k`      | `k`       | Velar                 | Plosive                | voiceless |
| ɡ   | `g`      | `g`       | Velar                 | Plosive                | voiced    |
| q   | `K`      | `q`       | Uvular                | Plosive                | voiceless |
| ɢ   | `G`      | `G\`      | Uvular                | Plosive                | voiced    |
| ʡ   | `'<q>`   | `>\`      | Pharyngeal/epiglottal | Plosive                | voiceless |
| ʔ   | `'`      | `?`       | Glottal               | Plosive                | voiceless |
| s   | `s`      | `s`       | Alveolar              | Sibilant fricative     | voiceless |
| z   | `z`      | `z`       | Alveolar              | Sibilant fricative     | voiced    |
| ʃ   | `x`      | `S`       | Postalveolar          | Sibilant fricative     | voiceless |
| ʒ   | `j`      | `Z`       | Postalveolar          | Sibilant fricative     | voiced    |
| ʂ   | `X`      | `` s` ``  | Retroflex             | Sibilant fricative     | voiceless |
| ʐ   | `J`      | `` z` ``  | Retroflex             | Sibilant fricative     | voiced    |
| ɕ   | `x<y>`   | `s\`      | (Alveolo-)palatal     | Sibilant fricative     | voiceless |
| ʑ   | `j<y>`   | `z\`      | (Alveolo-)palatal     | Sibilant fricative     | voiced    |
| ɸ   | `F`      | `p\`      | Bilabial              | Non-sibilant fricative | voiceless |
| β   | `$v`     | `B`       | Bilabial              | Non-sibilant fricative | voiced    |
| f   | `f`      | `f`       | Labiodental           | Non-sibilant fricative | voiceless |
| v   | `v`      | `v`       | Labiodental           | Non-sibilant fricative | voiced    |
| θ   | `$t`     | `T`       | Dental                | Non-sibilant fricative | voiceless |
| ð   | `$d`     | `D`       | Dental                | Non-sibilant fricative | voiced    |
| ʝ   | `Y`      | `j\`      | (Alveolo-)palatal     | Non-sibilant fricative | voiced    |
| x   | `H`      | `x`       | Velar                 | Non-sibilant fricative | voiceless |
| ɣ   | `$g`     | `G`       | Velar                 | Non-sibilant fricative | voiced    |
| χ   | `$H`     | `X`       | Uvular                | Non-sibilant fricative | voiceless |
| ʁ   | `$G`     | `R`       | Uvular                | Non-sibilant fricative | voiced    |
| ħ   | `$h`     | `X\`      | Pharyngeal/epiglottal | Non-sibilant fricative | voiceless |
| ʕ   | `$'`     | `?\`      | Pharyngeal/epiglottal | Non-sibilant fricative | voiced    |
| h   | `h`      | `h`       | Glottal               | Non-sibilant fricative | voiceless |
| ɦ   | `h<v>`   | `h\`      | Glottal               | Non-sibilant fricative | voiced    |
| ʋ   | `V`      | `P`       | Labiodental           | Approximant            | voiced    |
| ɹ   | `$r`     | `r\`      | Alveolar              | Approximant            | voiced    |
| ɻ   | `$R`     | `` r\` `` | Retroflex             | Approximant            | voiced    |
| j   | `y`      | `j`       | (Alveolo-)palatal     | Approximant            | voiced    |
| ɰ   | `W`      | `M\`      | Velar                 | Approximant            | voiced    |
| ⱱ   | `v<f>`   | —         | Labiodental           | Tap/flap               | voiced    |
| ɾ   | `r<f>`   | `4`       | Alveolar              | Tap/flap               | voiced    |
| ɽ   | `R`      | `` r` ``  | Retroflex             | Tap/flap               | voiced    |
| ʙ   | `b<r>`   | `B\`      | Bilabial              | Trill                  | voiced    |
| r   | `r`      | `r`       | Alveolar              | Trill                  | voiced    |
| ʀ   | `$G<r>`  | `R\`      | Uvular                | Trill                  | voiced    |
| ʜ   | `$h<r>`  | `H\`      | Pharyngeal/epiglottal | Trill                  | voiceless |
| ʢ   | `$G<gr>` | `<\`      | Pharyngeal/epiglottal | Trill                  | voiced    |
| ɬ   | `S`      | `K`       | Alveolar              | Lateral fricative      | voiceless |
| ɮ   | `Z`      | `K\`      | Alveolar              | Lateral fricative      | voiced    |
| ꞎ   | `$S`     | —         | Retroflex             | Lateral fricative      | voiceless |
| 𝼅   | `$Z`     | —         | Retroflex             | Lateral fricative      | voiced    |
| 𝼆   | `S<y>`   | —         | (Alveolo-)palatal     | Lateral fricative      | voiceless |
| 𝼄   | `S<$g>`  | —         | Velar                 | Lateral fricative      | voiceless |
| l   | `l`      | `l`       | Alveolar              | Lateral approximant    | voiced    |
| ɭ   | `L`      | `` l` ``  | Retroflex             | Lateral approximant    | voiced    |
| ʎ   | `l<y>`   | `L`       | (Alveolo-)palatal     | Lateral approximant    | voiced    |
| ʟ   | `l<$g>`  | `L\`      | Velar                 | Lateral approximant    | voiced    |
| ɺ   | `$r<r>`  | `l\`      | Alveolar              | Lateral tap/flap       | voiced    |
| 𝼈   | `$R<r>`  | —         | Retroflex             | Lateral tap/flap       | voiced    |
| ɓ   | `b<@>`   | `b_<`     |                       | Voiced                 |           |
| ɗ   | `d<@>`   | `d_<`     |                       | Voiced                 |           |
| ᶑ   | `D<@>`   | —         |                       | Voiced                 |           |
| ʄ   | `g<@y>`  | `J\_<`    |                       | Voiced                 |           |
| ɠ   | `g<@>`   | `g_<`     |                       | Voiced                 |           |
| ʛ   | `G<@>`   | `G\_<`    |                       | Voiced                 |           |
| ʍ   | `w<v->`  | `W`       |                       | Fricative/approximant  |           |
| w   | `w`      | `w`       |                       | Fricative/approximant  |           |
| ɥ   | `y<w>`   | `H`       |                       | Fricative/approximant  |           |
| ɧ   | `$x`     | `x\`      |                       | Fricative/approximant  |           |
| ɫ   | `l<q>`   | `5`       |                       | Fricative/approximant  |           |
| ʘ   | `p!`     | `O\`      |                       |                        |           |
| ǀ   | `t!`     | `\|\`     |                       |                        |           |
| ǃ   | `k!`     | `!\`      |                       |                        |           |
| ǁ   | `l!`     | `\|\\     | \`                    |                        |           |     |
| 𝼊   | `T!`     | —         |                       |                        |           |
| ǂ   | `d!`     | `=\`      |                       |                        |           |

### Vowels

Vowels are built from ten base letters, each with a `$` and a `~`
variant. The letter says roughly where the vowel sits and the marker
picks among its neighbours, so the whole inventory is ten rows rather
than a chart to memorise.

| base | plain | `$` variant | `~` variant |
| ---- | ----- | ----------- | ----------- |
| `i`  | i `i` | y `$i`      | ɨ `~i`      |
| `I`  | ɪ `I` | ɘ `$I`      | ʏ `~I`      |
| `E`  | ɛ `E` | ɜ `$E`      | ɞ `~E`      |
| `e`  | e `e` | ø `$e`      | œ `~e`      |
| `A`  | æ `A` | ɐ `$A`      | ɶ `~A`      |
| `a`  | a `a` | ä `$a`      | ɑ `~a`      |
| `O`  | ʊ `O` | ɯ `$O`      | ɤ `~O`      |
| `o`  | o `o` | ɔ `$o`      | ɵ `~o`      |
| `U`  | ə `U` | ʌ `$U`      | ɒ `~U`      |
| `u`  | u `u` | —           | ʉ `~u`      |

`u` has no `$` variant: the sound that would fill it is `~u` (ʉ).

### Modifiers

A modifier goes inside angle brackets after the base it belongs to, and
all of a sound's modifiers share ONE pair: `kʷʰ` is `k<wh>`, not
`k<w><h>`. The binder shares that pair too, so an aspirated affricate is
`tx<hB>`.

A modifier written BEFORE the base modifies what follows, in its own
brackets, so `ʰk` is `<h>k` and `kʰ` is `k<h>`. Those are different
sounds.

Order is canonical on the way out and free on the way in. `combine`
sorts by slot, so one set of modifiers has exactly one spelling, while
`k<hw>` and `k<wh>` both parse.

#### Tongue and lips

Where the sound is made, and what the lips do.

| IPA | talk   | X-SAMPA | feature               | applies to |
| --- | ------ | ------- | --------------------- | ---------- |
| ̪    | `<d>`  | `_d`    | dental                | consonant  |
| ̻    | `<l>`  | `_m`    | laminal               | consonant  |
| ̼    | `<m>`  | `_N`    | linguolabial          | consonant  |
| ̺    | `<t>`  | `_a`    | apical                | consonant  |
| ̈    | `<c>`  | `_C\`   | centralized           | vowel      |
| ̽    | `<c~>` | `_x`    | mid-centralized       | vowel      |
| ̞    | `<P_>` | `_o`    | lowered               | any        |
| ̠    | `<P->` | `_-`    | retracted             | any        |
| ̝    | `<P^>` | `_r`    | raised                | any        |
| ̟    | `<P+>` | `_+`    | advanced              | any        |
| ˕   | `<S_>` | `_LL`   | lowered-spacing       | any        |
| ˗   | `<S->` | `_--`   | retracted-spacing     | any        |
| ˔   | `<S^>` | `_R`    | raised-spacing        | any        |
| ̙    | `<T->` | `_q`    | retracted-tongue-root | vowel      |
| ̘    | `<T+>` | `_A`    | advanced-tongue-root  | vowel      |
| ˠ   | `<$g>` | `_G`    | velarized             | consonant  |
| ᶣ   | `<$w>` | `_jw`   | labial-palatalized    | consonant  |
| ˤ   | `<q>`  | `_?\`   | pharyngealized        | consonant  |
| ʲ   | `<y>`  | `_j`    | palatalized           | consonant  |
| ̜    | `<o->` | `_c`    | less-rounded          | any        |
| ̹    | `<o+>` | `_O`    | more-rounded          | any        |
| ʷ   | `<w>`  | `_w`    | labialized            | consonant  |

#### Manner

How the air gets out.

| IPA | talk   | X-SAMPA | feature             | applies to |
| --- | ------ | ------- | ------------------- | ---------- |
| ɾ   | `<f>`  | `_X2`   | tap                 | consonant  |
| ʙ   | `<r>`  | `_X`    | trill               | consonant  |
| ᵐ   | `<m~>` | `_mm`   | prenasalized-labial | consonant  |
| ̃    | `<n>`  | `_~`    | nasalized           | vowel      |
| ᵑ   | `<q~>` | `_nn`   | prenasalized-velar  | consonant  |
| ᵊ   | `<e~>` | `_e`    | epenthetic          | vowel      |
| ˢ   | `<s~>` | `_s`    | sibilant-release    | consonant  |
| ʸ   | `<y~>` | `_jj`   | palatal-release     | consonant  |
| ̚    | `<.>`  | `_}`    | unreleased          | consonant  |
| ˡ   | `<l~>` | `_l`    | lateral-release     | consonant  |
| ⁿ   | `<n~>` | `_n`    | nasal-release       | consonant  |
| ˞   | `<$u>` | `` ` `` | rhotic              | any        |
| ͇    | `<x->` | `_s\`   | non-sibilant        | consonant  |
| ͓    | `<x+>` | `_v\`   | frictionalized      | consonant  |

#### Voice

What the larynx does.

| IPA | talk   | X-SAMPA | feature     | applies to |
| --- | ------ | ------- | ----------- | ---------- |
| ʼ   | `<!>`  | `_>`    | ejective    | consonant  |
| ˀ   | `<g>`  | `_?`    | glottalized | consonant  |
| ʰ   | `<h>`  | `_h`    | aspirated   | consonant  |
| ʱ   | `<h~>` | `_h_t`  | murmured    | consonant  |
| ͉    | `<f->` | `_L\`   | lenis       | consonant  |
| ͈    | `<f+>` | `_F\`   | fortis      | consonant  |
| ̤    | `<b>`  | `_t`    | breathy     | any        |
| ̰    | `<k>`  | `_k`    | creaky      | any        |
| ̬    | `<v>`  | `_v`    | voiced      | consonant  |
| ̥    | `<v->` | `_0`    | voiceless   | consonant  |
| ᴱ   | `<z>`  | `_E\`   | sphincteric | any        |

#### Length and syllabicity

How long it is held, and whether it carries a syllable.

| IPA | talk   | X-SAMPA | feature      | applies to |
| --- | ------ | ------- | ------------ | ---------- |
| ̩    | `<s>`  | `=`     | syllabic     | consonant  |
| ̯    | `<s->` | `_^`    | non-syllabic | vowel      |
| ː   | `<_>`  | `:`     | long         | any        |
| ˑ   | `<_2>` | `:\`    | half-long    | any        |
| ̆    | `<_3>` | `_X`    | extra-short  | any        |

#### Tone and stress

Pitch and prominence.

| IPA | talk   | X-SAMPA | feature          | applies to |
| --- | ------ | ------- | ---------------- | ---------- |
| ↓   | `<p0>` | `!`     | downstep         | any        |
| ˩   | `<p1>` | `_B`    | extra-low-tone   | vowel      |
| ˨   | `<p2>` | `_L`    | low-tone         | vowel      |
| ˧   | `<p3>` | `_M`    | mid-tone         | vowel      |
| ˦   | `<p4>` | `_H`    | high-tone        | vowel      |
| ˥   | `<p5>` | `_T`    | extra-high-tone  | vowel      |
| ̂    | `<t->` | `_F_d`  | falling-tone     | vowel      |
| ̌    | `<t+>` | `_R_d`  | rising-tone      | vowel      |
| ̏    | `<t1>` | `_B_d`  | extra-low-tone   | vowel      |
| ̀    | `<t2>` | `_L_d`  | low-tone         | vowel      |
| ̄    | `<t3>` | `_M_d`  | mid-tone         | vowel      |
| ́    | `<t4>` | `_H_d`  | high-tone        | vowel      |
| ̋    | `<t5>` | `_T_d`  | extra-high-tone  | vowel      |
| ˈ   | `<^>`  | `"`     | stress           | any        |
| ˌ   | `<^2>` | `%`     | secondary-stress | any        |

## Syllables

Talk splits a word into syllables, each a run of onset, nucleus and coda
clusters. IPA and X-SAMPA hand you symbols and stop there, so this comes
built in, which is what the text-to-speech, speech-recognition and
language-learning cases all need.

| IPA           | talk                    | syllables                       |
| :------------ | :---------------------- | :------------------------------ |
| siŋk          | `si$nk`                 | `si$nk`                         |
| ˈkɔ̃.pɔ.zi.tœʁ | `k$o<n^>.p$o.zi.t~e$G`  | `k$o<n^> \| p$o \| zi \| t~e$G` |
| t͡sʰat͡sʰtʰawɬp | `ts<hB>ats<hB>t<h>awSp` | `ts<hB>ats<hB> \| t<h>awS \| p` |
| ʈʂʼarħasra    | `TX<!>ar$hasra`         | `TX<!>ar \| $ha \| sra`         |

### Why this is hard

Syllabification is not a matter of counting vowels. The same consonant
run breaks differently depending on what surrounds it, languages
disagree about which onsets are legal, and plenty of words have no vowel
at all.

Talk does it in three steps. It reads the word as SOUNDS rather than
characters, so `$n` is one velar nasal and not a `$` beside an `n`. It
matches those sounds against per-position cluster whitelists in
`base/clusters/` — which runs may open a syllable, which may close one,
which may stand alone — taking the longest match. Then it assembles the
clusters, with a colon in a cluster spelling marking where a break is
allowed rather than forced.

Two rules are deliberate and easy to mistake for bugs. A word boundary
is NOT a syllable boundary: spoken French runs a coda onto the next
word, so `ʃu də bʁy.sɛl` gives `xu.dUb.$G$i.sEl`, the `b` of Bruxelles
closing the syllable that starts in `de`. That is enchaînement. And a
tie is never cut, so an affricate stays whole even where a break would
otherwise fall.

It is checked against every valid-IPA pronunciation in the ClueSurf
export: 2,916,542 of 2,916,548 split without losing a sound, the six
exceptions being strings like `˦˧` that hold no phones at all, where no
syllables is the right answer. All three libraries are held to the same
fixture, so they agree case for case.

### Still to do

Losslessness is not correctness. That 2.9 million figure says no sound
was dropped; it says nothing about whether every boundary landed in the
right place, and the two are easy to confuse.

- **Vowelless words.** Nuxalk and Bella Coola build whole words out of
  consonants, `spʰs` and `qʷʰtʰ` among them. They survive the split, but
  the cluster tables were not written with them in mind and the breaks
  inside them are not yet trusted.
- **A correctness pass over the corpus.** Roughly 42,000 pronunciations
  produce a syllable with no vowel in it. Most match patterns that are
  right — a vowelless word, a word-final coda, a word-initial onset —
  but the medial cases have no precedent either way and want a
  linguist's eye rather than a test.
- **Onset maximization.** `at͡sa` currently gives `ats<B> | a` where
  `a | ts<B>a` is the expected reading. The affricate is intact, the
  boundary is arguable.

## Encodings

There are two NOTATIONS and three TIERS, so six encodings in all. Which
one you want follows from two questions: does it need to give the sound
back exactly, and how much detail does it need to carry.

### The two notations

**`ipa`** is lossless. It reads and writes the source strings, so what
goes in comes back out. Use it when something downstream will be
compared to, displayed as, or exported as the original: a dictionary
field, a conlang's stored inventory, a join against Phoible or
Wiktionary.

**`tone`** is talk's own ASCII notation, the one this readme spends most
of its length on. It is deliberately COARSER than IPA: `O` covers six
IPA vowels, `i$` covers `ɨ`, `y` and `ʏ`, `H$` and `x` share a base.
That coarseness is the point, because it makes the space small enough to
be a model's vocabulary, but it means `tone` does not round-trip every
distinction IPA can write.

The LIBRARY is called talk; the NOTATION it defines is called tone.

### The three tiers

| tier   | holds                                            | `tone` |       `ipa` | bytes |
| :----- | :----------------------------------------------- | -----: | ----------: | :---- |
| `seed` | one atomic unit: a base, or a single mark        |    110 |         168 | 1     |
| `band` | a base plus its segmental marks                  |  2,161 |   7,432,128 | 2 / 3 |
| `mesh` | a base plus everything, suprasegmentals included | 25,426 | 166,167,936 | 2 / 4 |

`seed` splits a sound into its parts, so `pʰ` becomes two units. Small
enough to read, and the right shape for a factored model vocabulary.

`band` keeps aspiration, dentality, voicelessness and secondary
articulation, and drops duration, stress, tone and syllabicity. Note
that vowel length is phonemic in Finnish, Japanese and Arabic, so this
tier is narrower than it sounds.

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
machine({ text: 'tʰa', type: 'ipa', system: 'mesh' })
machine({ text: 't<h>a', type: 'tone', system: 'band' })

byteWidth({ type: 'ipa', system: 'mesh' }) // 4
machineBytes({ text: 't<h>a', type: 'tone', system: 'mesh' }) // 4 bytes
```

Every code is COMPUTED, not looked up. A table for `ipa mesh` would be
over a gigabyte, so each code is a mixed-radix index instead: the base
picks an offset and each axis contributes a digit whose radix is how
many marks that axis offers that base. The only tables are the bases,
the axes and a per-base offset, a few thousand integers, so this runs in
a browser as happily as on a server and the package ships no code
registry at all.

### Choosing a tier

The number that decides it is not vocabulary size but how often a tier
MERGES two sounds some language contrasts. Measured across Phoible's
3,020 doculects:

| tier       | attested | merged pairs | inventories losing a contrast |
| :--------- | -------: | -----------: | ----------------------------: |
| `seed`     |      953 |        4,003 |                           81% |
| `band`     |    1,722 |        1,490 |                           56% |
| `mesh`     |    2,161 |          694 |                           29% |
| `ipa mesh` |    3,422 |            0 |                            0% |

Read the last column first: it is the share of documented languages for
which the encoding destroys a distinction the language depends on. Even
`tone mesh` costs 29%, because talk's base inventory is deliberately
coarse and no tier setting recovers that. If a merged contrast would be
a bug, use `ipa`.

A note on scale: `tone mesh` holds 25,426 producible sounds and only
2,161 are attested anywhere. The other 91% are pronounceable and simply
nobody's, which is the space a constructed language draws from.

## Normalization

`normalizeIpa` folds the many ways IPA gets written into the one form
the parser reads. `parseIpa` applies it, so this is only needed directly
when normalizing without parsing.

```ts
import { normalizeIpa } from '@cluesurf/talk'

normalizeIpa('ʆ') // 'ʃʲ'      withdrawn 1989, palatal hook
normalizeIpa('ma³³') // 'ma˧˧'    superscript digits are tone
normalizeIpa('ɡ̊') // 'ɡ̥'      ring above and below are one feature
normalizeIpa('g') // 'ɡ'       ASCII lookalikes
normalizeIpa('t͡ʃ') // 'tʃ'      tie bars carry no content
```

It also DROPS fine phonetic detail this encoding does not carry:
breathy, creaky, retracted, advanced, apical, laminal, raised, lowered,
and the rest. That is lossy on purpose, so a source carrying the mark
still yields its base sound rather than failing. Pass `keepDetail` to
leave them in place and see what a source carries that talk drops.

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
