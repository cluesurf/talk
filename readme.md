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

| Language   | Library                             | Syllables | Tiers | Status |
| :--------- | :---------------------------------- | :-------- | :---- | :----- |
| TypeScript | [`@cluesurf/talk`](deck/typescript) | ✅        | ✅    | ✅     |
| Rust       | [`cluesurf-talk`](deck/rust)        | ✅        | ✅    | ✅     |
| Python     | [`cluesurf-talk`](deck/python)      | ✅        | ✅    | ✅     |

## Examples

Real words, with their IPA from the ClueSurf export, the talk spelling,
and the syllable split. They are chosen for how much of the phonetic
space they use: the vowelless words of Bella Coola, the ejectives of
Georgian and Archi, the clicks of Hadza, the tone contours of Burmese
and Vietnamese, the stød of Danish.

| language    | word                          | IPA                           | talk                                                                          | syllables                                                | gloss                                    |
| :---------- | :---------------------------- | :---------------------------- | :---------------------------------------------------------------------------- | :------------------------------------------------------- | :--------------------------------------- |
| Abkhaz      | а-ҿарҳас-ра                   | aʈʂʼarħasra                   | `aTX<!>ar$hasra`                                                              | `a.TX<!>ar.$ha.sra`                                      | yawn                                     |
| Amharic     | ጭንቅላት                         | t͡ʃʼɨnˈkʼɨlːat                 | `tx<!B>~ink<!>~i<^>l<_>at`                                                    | `tx<!B>~in.k<!>~i<^>.l<_>at`                             | skull                                    |
| Archi       | q'ʷˤáq'ˤart̄utʰ                | qʷˤʼáqˤʼart̄utʰ                | `K<qw!>a<t4>K<q!>art<t3>ut<h>`                                                | `K<qw!>a<t4>.K<q!>ar.t<t3>ut<h>`                         | narrow                                   |
| Bella Coola | cactawłp                      | t͡sʰat͡sʰtʰawɬp                 | `ts<hB>ats<hB>t<h>awSp`                                                       | `ts<hB>ats<hB>.t<h>awS.p`                                | western redcedar (Thuja plicata)         |
| Burmese     | ငွေကြေးဖောင်းပွခြင်း          | ŋwèt͡ɕépʰáʊɴpwa̰d͡ʑɪ́ɴ            | `$nwe<t2>tx<yB>e<t4>p<h>a<t4>O$Npwa<k>dj<yB>I<t4>$N`                          | `$nwe<t2>.tx<yB>e<t4>.p<h>a<t4>O$N.pwa<k>.dj<yB>I<t4>$N` | inflation                                |
| Chechen     | на̄къост                       | ˈnaːq͡χʼu̯ost                   | `na<_^>K$H<!B>u<s->ost`                                                       | `na<_^>K$H<!B>.u<s->ost`                                 | comrade, friend, mate, companion         |
| Czech       | dvanáctníkový                 | ˈdvanaːt͡stɲiːkoviː            | `dva<^>na<_>ts<B>tn<y>i<_>kovi<_>`                                            | `dva<^>.na<_>ts<B>.tn<y>i<_>.ko.vi<_>`                   | duodenum; duodenal                       |
| Danish      | olivengren                    | oˈliːˀvənˌɡrɛːˀn              | `oli<_^g>vUngrE<_^2g>n`                                                       | `o.li.<g^_>vUn.grE<g^2_>n`                               | olive branch                             |
| French      | auteur-compositeur-interprète | o.tœʁ.kɔ̃.po.zi.tœ.ʁɛ̃.tɛʁ.pʁɛt | `o\.t~e$G\.k$o<n>\.po\.zi\.t~e\.$GE<n>\.tE$G\.p$GEt`                          | `o.t~e$G.k$o<n>.po.zi.t~e.$GE<n>.tE$Gp.$GEt`             | singer-songwriter                        |
| Georgian    | წინასწარმეტყველი              | t͡sʼinast͡sʼaɾmetʼχʷʼeli        | `ts<!B>inasts<!B>ar<f>met<!>$H<w!>eli`                                        | `ts<!B>i.nas.ts<!B>ar<f>.met<!>.$H<w!>e.li`              | prophet                                  |
| Hadza       | kǁekǁetʃe-                    | ŋ̥ǁʼeŋ̥ǁʼetʃe                   | `$n<v->l!<!>e$n<v->l!<!>etxe`                                                 | `$n<v->l!<!>e$n<v->.l!<!>e.txe`                          | woman's loincloth                        |
| Hebrew      | ביטוח / בִּטּוּחַ             | biˈtˤːuːaħ                    | `bit<_q>u<_^>a$h`                                                             | `bi.t<_q>u<_^>a$h`                                       | insurance                                |
| Irish       | clóscríobhaí                  | ˈklˠoːʃcɾʲiːwiː               | `kl<$g>o<_^>xk<y>r<f><y>i<_>wi<_>`                                            | `kl<$g>o<_^>xk<y>.r<f><y>i<_>.wi<_>`                     | typist                                   |
| Japanese    | 中継放送                      | t͡ɕɨːke̞ːho̞ːso̞ː                 | `tx<yB>~i<_>ke<P_><_>ho<P_><_>so<P_><_>`                                      | `tx<yB>~i<_>.ke<P_><_>.ho<P_><_>.so<P_><_>`              | relay broadcast (abbr. 中継)             |
| Korean      | 제주특별자치도                | ˈt͡ɕe̞ːd͡ʑutʰɯk̚p͈jʌ̹ʎd͡ʑa̠t͡ɕʰido̞     | `tx<yB>e<P_><_^>dj<yB>ut<h>$Ok<.>p<f+>y$U<o+>l<y>dj<yB>a<P->tx<y><hB>ido<P_>` | `—`                                                      | Jeju Special Self-Governing Province     |
| Maltese     | għaġina                       | aˤːˈd͡ʒiː.na                   | `a<_q>dj<B>i<_^>\.na`                                                         | `a.<q_>dj<B>i<_^>.na`                                    | dough                                    |
| Navajo      | chąąsht'ezhiitsoh             | t͡ʃʰɑ̃̀ːʃtʼɛ̀ʒìːt͡sʰòh             | `tx<hB>~a<nt2_>xt<!>E<t2>ji<t2_>ts<hB>o<t2>h`                                 | `tx<hB>~a<nt2_>.xt<!>E<t2>.ji<t2_>ts<hB>.o<t2>h`         | carrot                                   |
| Polish      | przyoszczędzić                | pʂɘ.ɔˈʂt͡ʂɛɲ.d͡ʑit͡ɕ             | `pX$I\.$oXtX<B>E<^>n<y>\.dj<yB>itx<yB>`                                       | `pX$I.$o.XtX<B>E<^>n<y>.dj<yB>itx<yB>`                   | spare, to save up (to save by frugality) |
| Sandawe     | kǁ'ék'a                       | kǁʼékʼa                       | `kl!<!>e<t4>k<!>a`                                                            | `kl!<!>e<t4>.k<!>a`                                      | blood                                    |
| Taa         | ǀòho                          | k͡ǀòhoː                        | `kt!<B>o<t2>ho<_>`                                                            | `—`                                                      | sore                                     |
| Tlingit     | tl'áatl'                      | t͡ɬʼáːt͡ɬʼ                      | `tS<!B>a<t4_>tS<!B>`                                                          | `tS<!B>a<t4_>tS<!B>`                                     | warbler, possibly yellow warbler         |
| Ubykh       | t͡ɬ'əč́'á                       | t͡ɬʼəč́ʼá                       | `tS<!B>Uk<y><t+t4!>a<t4>`                                                     | `tS<!B>U.k<y><t+t4!>a<t4>`                               | hizmetçi                                 |
| Vietnamese  | ắc-coóc-đê-ông                | ăk˦˥-kɔk͡p˦˥-de˧˧-oŋ͡m˧˧        | `a<_3>k<p4p5>\-k$okp<p4p5B>\-de<p3p3>\-o$nm<p3p3B>`                           | `—`                                                      | an accordion                             |
| Welsh       | lletygarwch                   | ˈɬeːtiːɡarwχ                  | `Se<_^>ti<_>garw$H`                                                           | `Se<_^>.ti<_>.garw.$H`                                   | hospitality, welcome                     |
| Xhosa       | -quba                         | kǃuːɓa                        | `kk!u<_>b<@>a`                                                                | `kk!u<_>.b<@>a`                                          | strike                                   |
| Yoruba      | rẹnfẹ́nrẹnfẹ́n                  | ɾɛ̃̄.fɛ̃́.ɾɛ̃̄.fɛ̃́                   | `r<f>E<nt3>\.fE<nt4>\.r<f>E<nt3>\.fE<nt4>`                                    | `r<f>E<nt3>.fE<nt4>.r<f>E<nt3>.fE<nt4>`                  | completely                               |
| Zulu        | -qúba                         | ǃúːɓa                         | `k!u<t4_>b<@>a`                                                               | `k!u<t4_>.b<@>a`                                         | pass by and kick up dust                 |

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

The IPA consonant chart, in chart order: by place across and manner down,
the order the chart itself uses. Generated by
`pnpm exec tsx code/make/readme-tables.ts` from `base/phones.json` and
`base/chart/consonant-symbols.csv`, so it cannot drift from the data.

A dash in the X-SAMPA column means the symbol has none. X-SAMPA is an ASCII
scheme from the 1990s and eight of these were added to the IPA afterwards,
so no ASCII spelling was ever assigned.

| IPA | talk | X-SAMPA | name | place | manner | voice |
| --- | ---- | ------- | ---- | ----- | ------ | ----- |
| m | <code>m</code> | <code>m</code> | Voiced bilabial nasal | Bilabial | Nasal | voiced |
| ɱ | <code>$m</code> | <code>F</code> | Voiced labiodental nasal | Labiodental | Nasal | voiced |
| n | <code>n</code> | <code>n</code> | Voiced alveolar nasal | Alveolar | Nasal | voiced |
| ɳ | <code>N</code> | <code>n`</code> | Voiced retroflex nasal | Retroflex | Nasal | voiced |
| ɲ | <code>n&lt;y&gt;</code> | <code>J</code> | Voiced palatal nasal | (Alveolo-)palatal | Nasal | voiced |
| ŋ | <code>$n</code> | <code>N</code> | Voiced velar nasal | Velar | Nasal | voiced |
| ɴ | <code>$N</code> | <code>N\</code> | Voiced uvular nasal | Uvular | Nasal | voiced |
| p | <code>p</code> | <code>p</code> | Voiceless bilabial plosive | Bilabial | Plosive | voiceless |
| b | <code>b</code> | <code>b</code> | Voiced bilabial plosive | Bilabial | Plosive | voiced |
| t | <code>t</code> | <code>t</code> | Voiceless alveolar plosive | Alveolar | Plosive | voiceless |
| d | <code>d</code> | <code>d</code> | Voiced alveolar plosive | Alveolar | Plosive | voiced |
| ʈ | <code>T</code> | <code>t`</code> | Voiceless retroflex plosive | Retroflex | Plosive | voiceless |
| ɖ | <code>D</code> | <code>d`</code> | Voiced retroflex plosive | Retroflex | Plosive | voiced |
| c | <code>k&lt;y&gt;</code> | <code>c</code> | Voiceless palatal plosive | (Alveolo-)palatal | Plosive | voiceless |
| ɟ | <code>g&lt;y&gt;</code> | <code>J\</code> | Voiced palatal plosive | (Alveolo-)palatal | Plosive | voiced |
| k | <code>k</code> | <code>k</code> | Voiceless velar plosive | Velar | Plosive | voiceless |
| ɡ | <code>g</code> | <code>g</code> | Voiced velar plosive | Velar | Plosive | voiced |
| q | <code>K</code> | <code>q</code> | Voiceless uvular plosive | Uvular | Plosive | voiceless |
| ɢ | <code>G</code> | <code>G\</code> | Voiced uvular plosive | Uvular | Plosive | voiced |
| ʡ | <code>'&lt;q&gt;</code> | <code>&gt;\</code> | Epiglottal plosive | Pharyngeal/epiglottal | Plosive | voiceless |
| ʔ | <code>'</code> | <code>?</code> | Glottal stop | Glottal | Plosive | voiceless |
| s | <code>s</code> | <code>s</code> | Voiceless alveolar fricative | Alveolar | Sibilant fricative | voiceless |
| z | <code>z</code> | <code>z</code> | Voiced alveolar fricative | Alveolar | Sibilant fricative | voiced |
| ʃ | <code>x</code> | <code>S</code> | Voiceless postalveolar fricative | Postalveolar | Sibilant fricative | voiceless |
| ʒ | <code>j</code> | <code>Z</code> | Voiced postalveolar fricative | Postalveolar | Sibilant fricative | voiced |
| ʂ | <code>X</code> | <code>s`</code> | Voiceless retroflex fricative | Retroflex | Sibilant fricative | voiceless |
| ʐ | <code>J</code> | <code>z`</code> | Voiced retroflex fricative | Retroflex | Sibilant fricative | voiced |
| ɕ | <code>x&lt;y&gt;</code> | <code>s\</code> | Voiceless alveolo-palatal fricative | (Alveolo-)palatal | Sibilant fricative | voiceless |
| ʑ | <code>j&lt;y&gt;</code> | <code>z\</code> | Voiced alveolo-palatal fricative | (Alveolo-)palatal | Sibilant fricative | voiced |
| ɸ | <code>F</code> | <code>p\</code> | Voiceless bilabial fricative | Bilabial | Non-sibilant fricative | voiceless |
| β | <code>$v</code> | <code>B</code> | Voiced bilabial fricative | Bilabial | Non-sibilant fricative | voiced |
| f | <code>f</code> | <code>f</code> | Voiceless labiodental fricative | Labiodental | Non-sibilant fricative | voiceless |
| v | <code>v</code> | <code>v</code> | Voiced labiodental fricative | Labiodental | Non-sibilant fricative | voiced |
| θ | <code>$t</code> | <code>T</code> | Voiceless dental fricative | Dental | Non-sibilant fricative | voiceless |
| ð | <code>$d</code> | <code>D</code> | Voiced dental fricative | Dental | Non-sibilant fricative | voiced |
| ʝ | <code>Y</code> | <code>j\</code> | Voiced palatal fricative | (Alveolo-)palatal | Non-sibilant fricative | voiced |
| x | <code>H</code> | <code>x</code> | Voiceless velar fricative | Velar | Non-sibilant fricative | voiceless |
| ɣ | <code>$g</code> | <code>G</code> | Voiced velar fricative | Velar | Non-sibilant fricative | voiced |
| χ | <code>$H</code> | <code>X</code> | Voiceless uvular fricative | Uvular | Non-sibilant fricative | voiceless |
| ʁ | <code>$G</code> | <code>R</code> | Voiced uvular fricative | Uvular | Non-sibilant fricative | voiced |
| ħ | <code>$h</code> | <code>X\</code> | Voiceless pharyngeal fricative | Pharyngeal/epiglottal | Non-sibilant fricative | voiceless |
| ʕ | <code>$'</code> | <code>?\</code> | Voiced pharyngeal fricative | Pharyngeal/epiglottal | Non-sibilant fricative | voiced |
| h | <code>h</code> | <code>h</code> | Voiceless glottal fricative | Glottal | Non-sibilant fricative | voiceless |
| ɦ | <code>h&lt;v&gt;</code> | <code>h\</code> | Voiced glottal fricative | Glottal | Non-sibilant fricative | voiced |
| ʋ | <code>V</code> | <code>P</code> | Voiced labiodental approximant | Labiodental | Approximant | voiced |
| ɹ | <code>$r</code> | <code>r\</code> | Voiced alveolar approximant | Alveolar | Approximant | voiced |
| ɻ | <code>$R</code> | <code>r\`</code> | Voiced retroflex approximant | Retroflex | Approximant | voiced |
| j | <code>y</code> | <code>j</code> | Voiced palatal approximant | (Alveolo-)palatal | Approximant | voiced |
| ɰ | <code>W</code> | <code>M\</code> | Voiced velar approximant | Velar | Approximant | voiced |
| ⱱ | <code>v&lt;f&gt;</code> | — | Voiced labiodental flap | Labiodental | Tap/flap | voiced |
| ɾ | <code>r&lt;f&gt;</code> | <code>4</code> | Voiced alveolar tap or flap | Alveolar | Tap/flap | voiced |
| ɽ | <code>R</code> | <code>r`</code> | Voiced retroflex flap | Retroflex | Tap/flap | voiced |
| ʙ | <code>b&lt;r&gt;</code> | <code>B\</code> | Voiced bilabial trill | Bilabial | Trill | voiced |
| r | <code>r</code> | <code>r</code> | Voiced alveolar trill | Alveolar | Trill | voiced |
| ʀ | <code>$G&lt;r&gt;</code> | <code>R\</code> | Voiced uvular trill | Uvular | Trill | voiced |
| ʜ | <code>$h&lt;r&gt;</code> | <code>H\</code> | Voiceless epiglottal trill | Pharyngeal/epiglottal | Trill | voiceless |
| ʢ | <code>$G&lt;gr&gt;</code> | <code>&lt;\</code> | Voiced epiglottal trill | Pharyngeal/epiglottal | Trill | voiced |
| ɬ | <code>S</code> | <code>K</code> | Voiceless alveolar lateral fricative | Alveolar | Lateral fricative | voiceless |
| ɮ | <code>Z</code> | <code>K\</code> | Voiced alveolar lateral fricative | Alveolar | Lateral fricative | voiced |
| ꞎ | <code>$S</code> | — | Voiceless retroflex lateral fricative | Retroflex | Lateral fricative | voiceless |
| 𝼅 | <code>$Z</code> | — | Voiced retroflex lateral fricative | Retroflex | Lateral fricative | voiced |
| 𝼆 | <code>S&lt;y&gt;</code> | — | Voiceless palatal lateral fricative | (Alveolo-)palatal | Lateral fricative | voiceless |
| 𝼄 | <code>S&lt;$g&gt;</code> | — | Voiceless velar lateral fricative | Velar | Lateral fricative | voiceless |
| l | <code>l</code> | <code>l</code> | Voiced alveolar lateral approximant | Alveolar | Lateral approximant | voiced |
| ɭ | <code>L</code> | <code>l`</code> | Voiced retroflex lateral approximant | Retroflex | Lateral approximant | voiced |
| ʎ | <code>l&lt;y&gt;</code> | <code>L</code> | Voiced palatal lateral approximant | (Alveolo-)palatal | Lateral approximant | voiced |
| ʟ | <code>l&lt;$g&gt;</code> | <code>L\</code> | Voiced velar lateral approximant | Velar | Lateral approximant | voiced |
| ɺ | <code>$r&lt;r&gt;</code> | <code>l\</code> | Voiced alveolar lateral flap | Alveolar | Lateral tap/flap | voiced |
| 𝼈 | <code>$R&lt;r&gt;</code> | — | Voiced retroflex lateral flap | Retroflex | Lateral tap/flap | voiced |
| ɓ | <code>b&lt;@&gt;</code> | <code>b_&lt;</code> | Voiced bilabial implosive |  | Voiced |  |
| ɗ | <code>d&lt;@&gt;</code> | <code>d_&lt;</code> | Voiced alveolar implosive |  | Voiced |  |
| ᶑ | <code>D&lt;@&gt;</code> | — | Voiced retroflex implosive |  | Voiced |  |
| ʄ | <code>g&lt;@y&gt;</code> | <code>J\_&lt;</code> | Voiced palatal implosive |  | Voiced |  |
| ɠ | <code>g&lt;@&gt;</code> | <code>g_&lt;</code> | Voiced velar implosive |  | Voiced |  |
| ʛ | <code>G&lt;@&gt;</code> | <code>G\_&lt;</code> | Voiced uvular implosive |  | Voiced |  |
| ʍ | <code>w&lt;v-&gt;</code> | <code>W</code> | Voiceless labial–velar fricative |  | Fricative/approximant |  |
| w | <code>w</code> | <code>w</code> | Voiced labial–velar approximant |  | Fricative/approximant |  |
| ɥ | <code>y&lt;w&gt;</code> | <code>H</code> | Voiced labial–palatal approximant |  | Fricative/approximant |  |
| ɧ | <code>$x</code> | <code>x\</code> | Sj-sound |  | Fricative/approximant |  |
| ɫ | <code>l&lt;q&gt;</code> | <code>5</code> | Velarized alveolar lateral approximant |  | Fricative/approximant |  |
| ʘ | <code>p!</code> | <code>O\</code> | Tenuis bilabial click |  |  |  |
| ǀ | <code>t!</code> | <code>&#124;\</code> | Tenuis dental click |  |  |  |
| ǃ | <code>k!</code> | <code>!\</code> | Tenuis alveolar click |  |  |  |
| ǁ | <code>l!</code> | <code>&#124;\&#124;\</code> | Tenuis alveolar lateral click |  |  |  |
| 𝼊 | <code>T!</code> | — | Tenuis retroflex click |  |  |  |
| ǂ | <code>d!</code> | <code>=\</code> | Tenuis palatal click |  |  |  |

### Vowels

Vowels are built from ten base letters, each with a `$` and a `~` variant.
The letter says roughly where the vowel sits and the marker picks among its
neighbours, so the whole inventory is ten rows rather than a chart to
memorise.

| base | plain | `$` variant | `~` variant |
| ---- | ----- | ----------- | ----------- |
| `i` | i `i` | y `$i` | ɨ `~i` |
| `I` | ɪ `I` | ɘ `$I` | ʏ `~I` |
| `E` | ɛ `E` | ɜ `$E` | ɞ `~E` |
| `e` | e `e` | ø `$e` | œ `~e` |
| `A` | æ `A` | ɐ `$A` | ɶ `~A` |
| `a` | a `a` | ä `$a` | ɑ `~a` |
| `O` | ʊ `O` | ɯ `$O` | ɤ `~O` |
| `o` | o `o` | ɔ `$o` | ɵ `~o` |
| `U` | ə `U` | ʌ `$U` | ɒ `~U` |
| `u` | u `u` | — | ʉ `~u` |

`u` has no `$` variant: the sound that would fill it is `~u` (ʉ).

### Modifiers

A modifier goes inside angle brackets after the base it belongs to, and all
of a sound's modifiers share ONE pair: `kʷʰ` is `k<wh>`, not `k<w><h>`. The
binder shares that pair too, so an aspirated affricate is `tx<hB>`.

A modifier written BEFORE the base modifies what follows, in its own
brackets, so `ʰk` is `<h>k` and `kʰ` is `k<h>`. Those are different sounds.

Order is canonical on the way out and free on the way in. `combine` sorts by
slot, so one set of modifiers has exactly one spelling, while `k<hw>` and
`k<wh>` both parse.

#### Tongue and lips

Where the sound is made, and what the lips do.

| IPA | talk | X-SAMPA | feature | applies to |
| --- | ---- | ------- | ------- | ---------- |
| ̪ | <code>&lt;d&gt;</code> | <code>_d</code> | dental | consonant |
| ̻ | <code>&lt;l&gt;</code> | <code>_m</code> | laminal | consonant |
| ̼ | <code>&lt;m&gt;</code> | <code>_N</code> | linguolabial | consonant |
| ̺ | <code>&lt;t&gt;</code> | <code>_a</code> | apical | consonant |
| ̈ | <code>&lt;c&gt;</code> | <code>_C\</code> | centralized | vowel |
| ̽ | <code>&lt;c~&gt;</code> | <code>_x</code> | mid-centralized | vowel |
| ̞ | <code>&lt;P_&gt;</code> | <code>_o</code> | lowered | any |
| ̠ | <code>&lt;P-&gt;</code> | <code>_-</code> | retracted | any |
| ̝ | <code>&lt;P^&gt;</code> | <code>_r</code> | raised | any |
| ̟ | <code>&lt;P+&gt;</code> | <code>_+</code> | advanced | any |
| ˕ | <code>&lt;S_&gt;</code> | <code>_LL</code> | lowered-spacing | any |
| ˗ | <code>&lt;S-&gt;</code> | <code>_--</code> | retracted-spacing | any |
| ˔ | <code>&lt;S^&gt;</code> | <code>_R</code> | raised-spacing | any |
| ̙ | <code>&lt;T-&gt;</code> | <code>_q</code> | retracted-tongue-root | vowel |
| ̘ | <code>&lt;T+&gt;</code> | <code>_A</code> | advanced-tongue-root | vowel |
| ˠ | <code>&lt;$g&gt;</code> | <code>_G</code> | velarized | consonant |
| ᶣ | <code>&lt;$w&gt;</code> | <code>_jw</code> | labial-palatalized | consonant |
| ˤ | <code>&lt;q&gt;</code> | <code>_?\</code> | pharyngealized | consonant |
| ʲ | <code>&lt;y&gt;</code> | <code>_j</code> | palatalized | consonant |
| ̜ | <code>&lt;o-&gt;</code> | <code>_c</code> | less-rounded | any |
| ̹ | <code>&lt;o+&gt;</code> | <code>_O</code> | more-rounded | any |
| ʷ | <code>&lt;w&gt;</code> | <code>_w</code> | labialized | consonant |

#### Manner

How the air gets out.

| IPA | talk | X-SAMPA | feature | applies to |
| --- | ---- | ------- | ------- | ---------- |
| ɾ | <code>&lt;f&gt;</code> | <code>_X2</code> | tap | consonant |
| ʙ | <code>&lt;r&gt;</code> | <code>_X</code> | trill | consonant |
| ᵐ | <code>&lt;m~&gt;</code> | <code>_mm</code> | prenasalized-labial | consonant |
| ̃ | <code>&lt;n&gt;</code> | <code>_~</code> | nasalized | vowel |
| ᵑ | <code>&lt;q~&gt;</code> | <code>_nn</code> | prenasalized-velar | consonant |
| ᵊ | <code>&lt;e~&gt;</code> | <code>_e</code> | epenthetic | vowel |
| ˢ | <code>&lt;s~&gt;</code> | <code>_s</code> | sibilant-release | consonant |
| ʸ | <code>&lt;y~&gt;</code> | <code>_jj</code> | palatal-release | consonant |
| ̚ | <code>&lt;.&gt;</code> | <code>_}</code> | unreleased | consonant |
| ˡ | <code>&lt;l~&gt;</code> | <code>_l</code> | lateral-release | consonant |
| ⁿ | <code>&lt;n~&gt;</code> | <code>_n</code> | nasal-release | consonant |
| ˞ | <code>&lt;$u&gt;</code> | <code>`</code> | rhotic | any |
| ͇ | <code>&lt;x-&gt;</code> | <code>_s\</code> | non-sibilant | consonant |
| ͓ | <code>&lt;x+&gt;</code> | <code>_v\</code> | frictionalized | consonant |

#### Voice

What the larynx does.

| IPA | talk | X-SAMPA | feature | applies to |
| --- | ---- | ------- | ------- | ---------- |
| ʼ | <code>&lt;!&gt;</code> | <code>_&gt;</code> | ejective | consonant |
| ˀ | <code>&lt;g&gt;</code> | <code>_?</code> | glottalized | consonant |
| ʰ | <code>&lt;h&gt;</code> | <code>_h</code> | aspirated | consonant |
| ʱ | <code>&lt;h~&gt;</code> | <code>_h_t</code> | murmured | consonant |
| ͉ | <code>&lt;f-&gt;</code> | <code>_L\</code> | lenis | consonant |
| ͈ | <code>&lt;f+&gt;</code> | <code>_F\</code> | fortis | consonant |
| ̤ | <code>&lt;b&gt;</code> | <code>_t</code> | breathy | any |
| ̰ | <code>&lt;k&gt;</code> | <code>_k</code> | creaky | any |
| ̬ | <code>&lt;v&gt;</code> | <code>_v</code> | voiced | consonant |
| ̥ | <code>&lt;v-&gt;</code> | <code>_0</code> | voiceless | consonant |
| ᴱ | <code>&lt;z&gt;</code> | <code>_E\</code> | sphincteric | any |

#### Length and syllabicity

How long it is held, and whether it carries a syllable.

| IPA | talk | X-SAMPA | feature | applies to |
| --- | ---- | ------- | ------- | ---------- |
| ̩ | <code>&lt;s&gt;</code> | <code>=</code> | syllabic | consonant |
| ̯ | <code>&lt;s-&gt;</code> | <code>_^</code> | non-syllabic | vowel |
| ː | <code>&lt;_&gt;</code> | <code>:</code> | long | any |
| ˑ | <code>&lt;_2&gt;</code> | <code>:\</code> | half-long | any |
| ̆ | <code>&lt;_3&gt;</code> | <code>_X</code> | extra-short | any |

#### Tone and stress

Pitch and prominence.

| IPA | talk | X-SAMPA | feature | applies to |
| --- | ---- | ------- | ------- | ---------- |
| ↓ | <code>&lt;p0&gt;</code> | <code>!</code> | downstep | any |
| ˩ | <code>&lt;p1&gt;</code> | <code>_B</code> | extra-low-tone | vowel |
| ˨ | <code>&lt;p2&gt;</code> | <code>_L</code> | low-tone | vowel |
| ˧ | <code>&lt;p3&gt;</code> | <code>_M</code> | mid-tone | vowel |
| ˦ | <code>&lt;p4&gt;</code> | <code>_H</code> | high-tone | vowel |
| ˥ | <code>&lt;p5&gt;</code> | <code>_T</code> | extra-high-tone | vowel |
| ̂ | <code>&lt;t-&gt;</code> | <code>_F_d</code> | falling-tone | vowel |
| ̌ | <code>&lt;t+&gt;</code> | <code>_R_d</code> | rising-tone | vowel |
| ̏ | <code>&lt;t1&gt;</code> | <code>_B_d</code> | extra-low-tone | vowel |
| ̀ | <code>&lt;t2&gt;</code> | <code>_L_d</code> | low-tone | vowel |
| ̄ | <code>&lt;t3&gt;</code> | <code>_M_d</code> | mid-tone | vowel |
| ́ | <code>&lt;t4&gt;</code> | <code>_H_d</code> | high-tone | vowel |
| ̋ | <code>&lt;t5&gt;</code> | <code>_T_d</code> | extra-high-tone | vowel |
| ˈ | <code>&lt;^&gt;</code> | <code>"</code> | stress | any |
| ˌ | <code>&lt;^2&gt;</code> | <code>%</code> | secondary-stress | any |


## Syllables

Talk also splits a word into syllables, each a sequence of onset,
nucleus, and coda clusters. IPA and X-SAMPA give you symbols and stop
there, so this comes built in, which the TTS, speech-recognition, and
language-learning use cases all need.

The splitter reads a word as sounds, matches them against the cluster
whitelists in `base/clusters/`, and assembles the clusters into
syllables. It is checked against every valid-IPA pronunciation in the
ClueSurf export: 2,916,542 of 2,916,548 split without loss, the six
exceptions being strings like `˦˧` that hold no phones at all, where no
syllables is the right answer.

A word boundary is NOT a syllable boundary. Spoken French runs a coda
onto the next word, so `ʃu də bʁy.sɛl` splits as `xu.dUb.$G$i.sEl`, with
the `b` of Bruxelles closing the syllable that begins in `de`. That is
enchaînement, and it is deliberate.

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
