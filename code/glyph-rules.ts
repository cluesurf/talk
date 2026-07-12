// Phonetic feature-compatibility rules. These decide which modifier
// diacritics can attach to which base consonant, so
// `make/glyph-builder.ts` generates only realistic sounds. Without them a pure cross-product
// invents nonsense: a dental glottal stop (`'~`), an ejective glide
// (`w~!h!`), a velarized palatal (`yG~`), an aspirated glottal stop
// (`'h~`), and so on.
//
// A base's category comes from its `place`, `manner`, and `voicing` in
// `code/base/consonants.csv` (all kebab-case).

// Manner groups.
export const OBSTRUENT_MANNERS = [
  'plosive',
  'fricative',
  'sibilant-fricative',
  'non-sibilant-fricative',
  'lateral-fricative',
]

export const SONORANT_MANNERS = [
  'nasal',
  'approximant',
  'fricative-approximant',
  'trill',
  'tap-flap',
  'lateral-approximant',
  'lateral-tap-flap',
]

// Coronal places (what dental can retract to).
export const CORONAL_PLACES = ['dental', 'alveolar']

// Places with no free oral cavity, so they take no oral secondary
// articulation (a labialized or velarized glottal stop is not a thing).
export const NON_ORAL_PLACES = ['pharyngeal-epiglottal', 'glottal']

export type Modifier = {
  ipa: string
  talk: string
  label: string
}

// Dental: coronals only (so `z̪` yes, a dental glottal stop never).
export const DENTAL: Modifier & { places: string[] } = {
  ipa: '̪',
  talk: '~',
  label: 'dental',
  places: CORONAL_PLACES,
}

// Tongue-body secondary articulation: at most one, since the tongue body
// can hold only one posture. Each excludes its own place (redundant) and
// any place whose posture conflicts. Palatal (front body) conflicts with
// velarization and pharyngealization (back body), so all three exclude
// `palatal`.
export const TONGUE_BODY: (Modifier & {
  notPlaces: string[]
  places?: string[]
})[] = [
  {
    ipa: 'ʲ',
    talk: 'y~',
    label: 'palatalized',
    notPlaces: ['palatal', ...NON_ORAL_PLACES],
  },
  // Velarization and pharyngealization are well-attested on coronals
  // (the velarized `ɫ`, the Arabic emphatics `tˤ dˤ sˤ`), so restrict
  // them there rather than inventing a pharyngealized retroflex, etc.
  {
    ipa: 'ˠ',
    talk: 'G~',
    label: 'velarized',
    notPlaces: [...NON_ORAL_PLACES],
    places: CORONAL_PLACES,
  },
  {
    ipa: 'ˤ',
    talk: 'Q~',
    label: 'pharyngealized',
    notPlaces: [...NON_ORAL_PLACES],
    places: CORONAL_PLACES,
  },
]

// Labialization: a lip gesture, independent of the tongue body, so it can
// stack on a tongue-body secondary (`y~w~`, a labialized palatalized
// consonant, is real).
export const LABIAL: Modifier & { notPlaces: string[] } = {
  ipa: 'ʷ',
  talk: 'w~',
  label: 'labialized',
  notPlaces: ['bilabial', 'labiodental', ...NON_ORAL_PLACES],
}

// Laryngeal setting: at most one, obstruents only, never glottal (an
// aspirated or ejective glottal stop is not a distinct sound). Ejectives
// are voiceless by definition.
export const LARYNGEAL: (Modifier & {
  manners: string[]
  voicings?: string[]
  notPlaces?: string[]
})[] = [
  {
    ipa: 'ʰ',
    talk: 'h~',
    label: 'aspirated',
    manners: ['plosive'],
    notPlaces: ['glottal'],
  },
  {
    ipa: 'ʼ',
    talk: '!',
    label: 'ejective',
    manners: OBSTRUENT_MANNERS,
    voicings: ['voiceless'],
    notPlaces: ['glottal'],
  },
]

// Voiceless: only voiced sonorants (voiceless nasals, liquids, glides).
// Obstruents get their voiceless counterpart as a distinct base letter,
// so this never combines with a laryngeal setting.
export const VOICELESS: Modifier & {
  manners: string[]
  voicings: string[]
} = {
  ipa: '̥',
  talk: 'h!',
  label: 'voiceless',
  manners: SONORANT_MANNERS,
  voicings: ['voiced'],
}
