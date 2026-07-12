# base data

The source of truth for the talk encoding. Everything the runtime does
is derived from these three files.

- **phones.json**: every base sound. One record per IPA symbol:
  `{ ipa, talk, simple, kind, ... }`. Consonants carry
  `place`/`manner`/`voicing`, vowels carry
  `height`/`backness`/`roundedness`.
- **modifiers.json**: the affixes (secondary articulations, tone,
  length, nasal, stress), with the `attaches` rules that decide which
  base each may combine with, plus `slot`/`order` for the canonical
  spelling.
- **machine.json**: the frozen, append-only map from a canonical talk
  sound to its Hangul code point. Generated once by
  [`../make/machine.ts`](../make/machine.ts). A code point
  is never renumbered once assigned, so machine tokens stay stable
  across releases.

## Coverage

Every IPA chart symbol in phones.json maps to a talk spelling. There are
no unmapped sounds.

## Not yet handled (todo)

The modifier system covers suffix affixes (aspiration, labialization,
tone, and so on) plus one prefix (stress). It does not yet model
**pre-features**, where a brief gesture precedes the main segment:

- [Prenasalized consonants](https://en.wikipedia.org/wiki/Prenasalized_consonant)
  (ⁿd, ᵐb). Note that the `ⁿ` in the data is nasal _release_ (post), not
  prenasalization (pre).
- [Pre-stopped consonants](https://en.wikipedia.org/wiki/Pre-stopped_consonant)
  (ᵈn, ᵇm).
- [Preaspiration](https://en.wikipedia.org/wiki/Preaspiration) (ʰp, ʰt),
  as opposed to the aspiration (post) already handled.
- [Pre-voicing](https://en.wikipedia.org/wiki/Pre-voicing) (voicing that
  begins before the closure of a voiced stop).
- Preglottalization (ˀp, ˀm), the pre-side of a
  [glottalized consonant](https://en.wikipedia.org/wiki/Glottalized_consonant).
- Any other pre-feature from the
  [index of phonetics articles](https://en.wikipedia.org/wiki/Index_of_phonetics_articles)
  that binds a gesture before the segment.

Handling these means adding pre-attaching modifiers (like the stress
prefix) that bind to the following base, each with its own slot and
order so the canonical spelling and the machine assignment stay stable.
Because the engine already supports one prefix modifier, this is a data
change plus a small generalization, not a rewrite.

## Provisional merges

22 rare chart sounds have no dedicated talk letter, so they merge to the
nearest existing talk sound (talk is about 95% accurate, so many IPA
symbols already share one talk letter). These entries are flagged
`"provisional": true` in phones.json. The merges are best-effort and
open to revision.

| IPA | merged talk | reason                                                         |
| :-- | :---------- | :------------------------------------------------------------- |
| ʡ   | Q           | voiceless epiglottal plosive to pharyngeal                     |
| ʡ̮   | Q           | epiglottal flap to pharyngeal                                  |
| ʜ   | Hh~         | voiceless epiglottal trill to voiceless pharyngeal fricative ħ |
| ʢ   | Q           | voiced epiglottal trill to pharyngeal ʕ                        |
| ˷   | h           | glottal approximant to glottal                                 |
| ɹ̠̊˔  | x           | voiceless postalveolar fricative to ʃ                          |
| ɻ̊˔  | X           | voiceless retroflex fricative to ʂ                             |
| ꞎ   | Z           | retroflex lateral fricative to ɮ                               |
| 𝼅   | Z           | retroflex lateral fricative to ɮ                               |
| 𝼆   | Z           | palatal lateral fricative to ɮ                                 |
| 𝼄   | Z           | velar lateral fricative to ɮ                                   |
| ʟ̝   | Z           | velar lateral fricative to ɮ                                   |
| ʟ̥   | lh!         | voiceless velar lateral approximant to voiceless l             |
| ʟ   | l           | velar lateral approximant to l                                 |
| ʟ̠   | l           | uvular lateral approximant to l                                |
| ʟ̆   | l           | velar lateral flap to l                                        |
| 𝼈̥   | Lh!         | voiceless retroflex lateral flap to voiceless ɭ                |
| 𝼈   | L           | retroflex lateral flap to ɭ                                    |
| 𝼈̊   | Lh!         | voiceless retroflex lateral flap to voiceless ɭ                |
| ʎ̮   | ly~         | palatal lateral flap to ʎ                                      |
| ᶑ   | d?          | retroflex implosive to alveolar implosive ɗ                    |
| ᶑ̥   | t?          | voiceless retroflex implosive to voiceless implosive           |
