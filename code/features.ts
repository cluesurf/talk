export const VECTOR_DIMENSION = 7

// form(pharyngealization, aspriation, ejective, implosive, stop, tense)
export const CONSONANT_FORM = [
  'aspiration',
  'dentalization',
  'glottalization',
  'labialization',
  'nasalization',
  'palatalization',
  'pharyngealization',
  'stop',
  'tense',
  'velarization',
] as const

export type ConsonantForm = (typeof CONSONANT_FORM)[number]

// flow(plosive, fricative)
export const CONSONANT_MOLD = [
  'affricate',
  'approximant',
  'fricative',
  'lateral-approximant',
  'lateral-fricative',
  'nasal',
  'plosive',
  'sibilant',
  'sibilant-fricative',
  'tap',
] as const

export type ConsonantMold = (typeof CONSONANT_MOLD)[number]

// site(bilabial)
export const CONSONANT_SITE = [
  'alveolar',
  'bilabial',
  'click',
  'dental',
  'glottal',
  'labiodental',
  'labiovelar',
  'lateral',
  'palatal',
  'pharyngeal',
  'postalveolar',
  'retroflex',
  'uvular',
  'velar',
] as const

export type ConsonantSite = (typeof CONSONANT_SITE)[number]

export const CONSONANT_FLOW = [
  'standard',
  'ejective',
  'implosive',
  'click',
] as const

export type ConsonantFlow = (typeof CONSONANT_FLOW)[number]

// tone(voiced / unvoiced)
export const CONSONANT_TONE = ['voiced', 'unvoiced'] as const

export type ConsonantTone = (typeof CONSONANT_TONE)[number]

// length (short, long/geminate)
export const CONSONANT_TIME = ['standard', 'long'] as const

export type ConsonantTime = (typeof CONSONANT_TIME)[number]

// Consonant === Beat
export type Consonant = {
  form?: ConsonantForm
  mold?: ConsonantMold
  flow?: ConsonantFlow
  site?: ConsonantSite
  tone?: ConsonantTone
  time?: ConsonantTime
}

export type ConsonantFeatureName = keyof Consonant

export const CONSONANT_FEATURE_WEIGHTS: Record<
  ConsonantFeatureName,
  Record<string, Record<string, number>>
> = {
  form: {
    aspiration: {
      aspiration: 1.0,
      coarticulation: 0.6,
      dentalization: 0.5,
      glottalization: 0.7,
      labialization: 0.5,
      nasalization: 0.4,
      palatalization: 0.5,
      pharyngealization: 0.6,
      stop: 0.8,
      tense: 0.7,
      velarization: 0.6,
    },
    coarticulation: {
      aspiration: 0.6,
      coarticulation: 1.0,
      dentalization: 0.7,
      glottalization: 0.6,
      labialization: 0.7,
      nasalization: 0.6,
      palatalization: 0.8,
      pharyngealization: 0.6,
      stop: 0.5,
      tense: 0.6,
      velarization: 0.5,
    },
    dentalization: {
      aspiration: 0.5,
      coarticulation: 0.7,
      dentalization: 1.0,
      glottalization: 0.6,
      labialization: 0.6,
      nasalization: 0.5,
      palatalization: 0.6,
      pharyngealization: 0.6,
      stop: 0.7,
      tense: 0.6,
      velarization: 0.5,
    },
    glottalization: {
      aspiration: 0.7,
      coarticulation: 0.6,
      dentalization: 0.6,
      glottalization: 1.0,
      labialization: 0.5,
      nasalization: 0.4,
      palatalization: 0.6,
      pharyngealization: 0.8,
      stop: 0.8,
      tense: 0.7,
      velarization: 0.6,
    },
    labialization: {
      aspiration: 0.5,
      coarticulation: 0.7,
      dentalization: 0.6,
      glottalization: 0.5,
      labialization: 1.0,
      nasalization: 0.5,
      palatalization: 0.7,
      pharyngealization: 0.5,
      stop: 0.7,
      tense: 0.6,
      velarization: 0.6,
    },
    nasalization: {
      aspiration: 0.4,
      coarticulation: 0.6,
      dentalization: 0.5,
      glottalization: 0.4,
      labialization: 0.5,
      nasalization: 1.0,
      palatalization: 0.6,
      pharyngealization: 0.5,
      stop: 0.6,
      tense: 0.5,
      velarization: 0.5,
    },
    palatalization: {
      aspiration: 0.5,
      coarticulation: 0.8,
      dentalization: 0.6,
      glottalization: 0.6,
      labialization: 0.7,
      nasalization: 0.6,
      palatalization: 1.0,
      pharyngealization: 0.6,
      stop: 0.7,
      tense: 0.6,
      velarization: 0.7,
    },
    pharyngealization: {
      aspiration: 0.6,
      coarticulation: 0.6,
      dentalization: 0.6,
      glottalization: 0.8,
      labialization: 0.5,
      nasalization: 0.5,
      palatalization: 0.6,
      pharyngealization: 1.0,
      stop: 0.8,
      tense: 0.7,
      velarization: 0.6,
    },
    stop: {
      aspiration: 0.8,
      coarticulation: 0.5,
      dentalization: 0.7,
      glottalization: 0.8,
      labialization: 0.7,
      nasalization: 0.6,
      palatalization: 0.7,
      pharyngealization: 0.8,
      stop: 1.0,
      tense: 0.8,
      velarization: 0.7,
    },
    tense: {
      aspiration: 0.7,
      coarticulation: 0.6,
      dentalization: 0.6,
      glottalization: 0.7,
      labialization: 0.6,
      nasalization: 0.5,
      palatalization: 0.6,
      pharyngealization: 0.7,
      stop: 0.8,
      tense: 1.0,
      velarization: 0.7,
    },
    velarization: {
      aspiration: 0.6,
      coarticulation: 0.5,
      dentalization: 0.5,
      glottalization: 0.6,
      labialization: 0.6,
      nasalization: 0.5,
      palatalization: 0.7,
      pharyngealization: 0.6,
      stop: 0.7,
      tense: 0.7,
      velarization: 1.0,
    },
  },
  mold: {
    affricate: {
      affricate: 1.0,
      approximant: 0.6,
      fricative: 0.8,
      'lateral-approximant': 0.7,
      'lateral-fricative': 0.7,
      nasal: 0.5,
      plosive: 0.9,
      sibilant: 0.7,
      'sibilant-fricative': 0.7,
      tap: 0.6,
    },
    approximant: {
      affricate: 0.6,
      approximant: 1.0,
      fricative: 0.5,
      'lateral-approximant': 0.8,
      'lateral-fricative': 0.6,
      nasal: 0.6,
      plosive: 0.4,
      sibilant: 0.5,
      'sibilant-fricative': 0.4,
      tap: 0.7,
    },
    fricative: {
      affricate: 0.8,
      approximant: 0.5,
      fricative: 1.0,
      'lateral-approximant': 0.7,
      'lateral-fricative': 0.9,
      nasal: 0.4,
      plosive: 0.7,
      sibilant: 0.8,
      'sibilant-fricative': 0.9,
      tap: 0.5,
    },
    'lateral-approximant': {
      affricate: 0.7,
      approximant: 0.8,
      fricative: 0.7,
      'lateral-approximant': 1.0,
      'lateral-fricative': 0.9,
      nasal: 0.6,
      plosive: 0.5,
      sibilant: 0.6,
      'sibilant-fricative': 0.6,
      tap: 0.7,
    },
    'lateral-fricative': {
      affricate: 0.7,
      approximant: 0.6,
      fricative: 0.9,
      'lateral-approximant': 0.9,
      'lateral-fricative': 1.0,
      nasal: 0.5,
      plosive: 0.6,
      sibilant: 0.7,
      'sibilant-fricative': 0.8,
      tap: 0.6,
    },
    nasal: {
      affricate: 0.5,
      approximant: 0.6,
      fricative: 0.4,
      'lateral-approximant': 0.6,
      'lateral-fricative': 0.5,
      nasal: 1.0,
      plosive: 0.8,
      sibilant: 0.4,
      'sibilant-fricative': 0.4,
      tap: 0.7,
    },
    plosive: {
      affricate: 0.9,
      approximant: 0.4,
      fricative: 0.7,
      'lateral-approximant': 0.5,
      'lateral-fricative': 0.6,
      nasal: 0.8,
      plosive: 1.0,
      sibilant: 0.6,
      'sibilant-fricative': 0.6,
      tap: 0.6,
    },
    sibilant: {
      affricate: 0.7,
      approximant: 0.5,
      fricative: 0.8,
      'lateral-approximant': 0.6,
      'lateral-fricative': 0.7,
      nasal: 0.4,
      plosive: 0.6,
      sibilant: 1.0,
      'sibilant-fricative': 0.9,
      tap: 0.4,
    },
    'sibilant-fricative': {
      affricate: 0.7,
      approximant: 0.4,
      fricative: 0.9,
      'lateral-approximant': 0.6,
      'lateral-fricative': 0.8,
      nasal: 0.4,
      plosive: 0.6,
      sibilant: 0.9,
      'sibilant-fricative': 1.0,
      tap: 0.5,
    },
    tap: {
      affricate: 0.6,
      approximant: 0.7,
      fricative: 0.5,
      'lateral-approximant': 0.7,
      'lateral-fricative': 0.6,
      nasal: 0.7,
      plosive: 0.6,
      sibilant: 0.4,
      'sibilant-fricative': 0.5,
      tap: 1.0,
    },
  },
  site: {
    alveolar: {
      alveolar: 1.0,
      bilabial: 0.6,
      dental: 0.8,
      glottal: 0.5,
      labiodental: 0.6,
      labiovelar: 0.5,
      lateral: 0.7,
      palatal: 0.7,
      pharyngeal: 0.4,
      postalveolar: 0.8,
      retroflex: 0.7,
      uvular: 0.4,
      velar: 0.6,
    },
    bilabial: {
      alveolar: 0.6,
      bilabial: 1.0,
      dental: 0.6,
      glottal: 0.4,
      labiodental: 0.8,
      labiovelar: 0.7,
      lateral: 0.5,
      palatal: 0.6,
      pharyngeal: 0.4,
      postalveolar: 0.5,
      retroflex: 0.5,
      uvular: 0.5,
      velar: 0.6,
    },
    click: {
      alveolar: 0.4,
      bilabial: 0.5,
      dental: 0.5,
      glottal: 0.6,
      labiodental: 0.5,
      labiovelar: 0.6,
      lateral: 0.6,
      palatal: 0.6,
      pharyngeal: 0.5,
      postalveolar: 0.5,
      retroflex: 0.5,
      uvular: 0.5,
      velar: 0.7,
    },
    dental: {
      alveolar: 0.8,
      bilabial: 0.6,
      dental: 1.0,
      glottal: 0.6,
      labiodental: 0.7,
      labiovelar: 0.6,
      lateral: 0.6,
      palatal: 0.7,
      pharyngeal: 0.5,
      postalveolar: 0.7,
      retroflex: 0.7,
      uvular: 0.5,
      velar: 0.6,
    },
    glottal: {
      alveolar: 0.5,
      bilabial: 0.4,
      dental: 0.6,
      glottal: 1.0,
      labiodental: 0.5,
      labiovelar: 0.6,
      lateral: 0.4,
      palatal: 0.5,
      pharyngeal: 0.8,
      postalveolar: 0.4,
      retroflex: 0.5,
      uvular: 0.7,
      velar: 0.6,
    },
    labiodental: {
      alveolar: 0.6,
      bilabial: 0.8,
      dental: 0.7,
      glottal: 0.5,
      labiodental: 1.0,
      labiovelar: 0.7,
      lateral: 0.5,
      palatal: 0.6,
      pharyngeal: 0.5,
      postalveolar: 0.6,
      retroflex: 0.6,
      uvular: 0.5,
      velar: 0.6,
    },
    labiovelar: {
      alveolar: 0.5,
      bilabial: 0.7,
      dental: 0.6,
      glottal: 0.6,
      labiodental: 0.7,
      labiovelar: 1.0,
      lateral: 0.5,
      palatal: 0.6,
      pharyngeal: 0.5,
      postalveolar: 0.5,
      retroflex: 0.5,
      uvular: 0.6,
      velar: 0.8,
    },
    lateral: {
      alveolar: 0.7,
      bilabial: 0.5,
      dental: 0.6,
      glottal: 0.4,
      labiodental: 0.5,
      labiovelar: 0.5,
      lateral: 1.0,
      palatal: 0.6,
      pharyngeal: 0.4,
      postalveolar: 0.6,
      retroflex: 0.6,
      uvular: 0.4,
      velar: 0.5,
    },
    palatal: {
      alveolar: 0.7,
      bilabial: 0.6,
      dental: 0.7,
      glottal: 0.5,
      labiodental: 0.6,
      labiovelar: 0.6,
      lateral: 0.6,
      palatal: 1.0,
      pharyngeal: 0.5,
      postalveolar: 0.7,
      retroflex: 0.6,
      uvular: 0.5,
      velar: 0.8,
    },
    pharyngeal: {
      alveolar: 0.4,
      bilabial: 0.4,
      dental: 0.5,
      glottal: 0.8,
      labiodental: 0.5,
      labiovelar: 0.5,
      lateral: 0.4,
      palatal: 0.5,
      pharyngeal: 1.0,
      postalveolar: 0.4,
      retroflex: 0.5,
      uvular: 0.8,
      velar: 0.7,
    },
    postalveolar: {
      alveolar: 0.8,
      bilabial: 0.5,
      dental: 0.7,
      glottal: 0.4,
      labiodental: 0.6,
      labiovelar: 0.5,
      lateral: 0.6,
      palatal: 0.7,
      pharyngeal: 0.4,
      postalveolar: 1.0,
      retroflex: 0.7,
      uvular: 0.5,
      velar: 0.6,
    },
    retroflex: {
      alveolar: 0.7,
      bilabial: 0.5,
      dental: 0.7,
      glottal: 0.5,
      labiodental: 0.6,
      labiovelar: 0.5,
      lateral: 0.6,
      palatal: 0.6,
      pharyngeal: 0.5,
      postalveolar: 0.7,
      retroflex: 1.0,
      uvular: 0.6,
      velar: 0.7,
    },
    uvular: {
      alveolar: 0.4,
      bilabial: 0.5,
      dental: 0.5,
      glottal: 0.7,
      labiodental: 0.5,
      labiovelar: 0.6,
      lateral: 0.4,
      palatal: 0.5,
      pharyngeal: 0.8,
      postalveolar: 0.5,
      retroflex: 0.6,
      uvular: 1.0,
      velar: 0.8,
    },
    velar: {
      alveolar: 0.6,
      bilabial: 0.6,
      dental: 0.6,
      glottal: 0.6,
      labiodental: 0.6,
      labiovelar: 0.8,
      lateral: 0.5,
      palatal: 0.8,
      pharyngeal: 0.7,
      postalveolar: 0.6,
      retroflex: 0.7,
      uvular: 0.8,
      velar: 1.0,
    },
  },
  flow: {
    continuous: {
      continuous: 1.0,
      discrete: 0.5,
      ejective: 0.6,
      implosive: 0.7,
      click: 0.5,
    },
    discrete: {
      continuous: 0.5,
      discrete: 1.0,
      ejective: 0.8,
      implosive: 0.7,
      click: 0.6,
    },
    ejective: {
      continuous: 0.6,
      discrete: 0.8,
      ejective: 1.0,
      implosive: 0.8,
      click: 0.7,
    },
    implosive: {
      continuous: 0.7,
      discrete: 0.7,
      ejective: 0.8,
      implosive: 1.0,
      click: 0.6,
    },
    click: {
      continuous: 0.5,
      discrete: 0.6,
      ejective: 0.7,
      implosive: 0.6,
      click: 1.0,
    },
  },
  tone: {
    voiced: {
      voiced: 1.0,
      unvoiced: 0.1,
    },
    unvoiced: {
      voiced: 0.1,
      unvoiced: 1.0,
    },
  },
  time: {
    standard: {
      standard: 1.0,
      long: 0.5,
    },
    long: {
      standard: 0.5,
      long: 1.0,
    },
  },
} as const

export const VOWEL_ROOM = [
  'closed',
  'near-closed',
  'middle-closed',
  'middle',
  'middle-open',
  'near-open',
  'open',
] as const

export type VowelRoom = (typeof VOWEL_ROOM)[number]

// (rounded (tense)/unrounded (lax))
export const VOWEL_FLEX = ['rounded', 'unrounded'] as const

export type VowelFlex = (typeof VOWEL_FLEX)[number]

// (front, mid, back)
export const VOWEL_SITE = ['front', 'center', 'back'] as const

export type VowelSite = (typeof VOWEL_SITE)[number]

// stress
export const VOWEL_KICK = ['standard', 'stress'] as const

export type VowelKick = (typeof VOWEL_KICK)[number]

// nasal/oral
export const VOWEL_NOSE = ['oral', 'nasal'] as const

export type VowelNose = (typeof VOWEL_NOSE)[number]

// length
export const VOWEL_TIME = ['standard', 'long', 'short'] as const

export type VowelTime = (typeof VOWEL_TIME)[number]

// Vowel === Tune
export type Vowel = {
  room?: VowelRoom
  flex?: VowelFlex
  site?: VowelSite
  kick?: VowelKick
  nose?: VowelNose
  time?: VowelTime
}

export type VowelFeatureName = keyof Vowel
export const VOWEL_FEATURE_WEIGHTS: Record<
  VowelFeatureName,
  Record<string, Record<string, number>>
> = {
  room: {
    closed: {
      closed: 1.0,
      'near-closed': 0.9,
      'middle-closed': 0.7,
      middle: 0.5,
      'middle-open': 0.4,
      'near-open': 0.3,
      open: 0.2,
    },
    'near-closed': {
      closed: 0.9,
      'near-closed': 1.0,
      'middle-closed': 0.8,
      middle: 0.6,
      'middle-open': 0.5,
      'near-open': 0.4,
      open: 0.3,
    },
    'middle-closed': {
      closed: 0.7,
      'near-closed': 0.8,
      'middle-closed': 1.0,
      middle: 0.7,
      'middle-open': 0.6,
      'near-open': 0.5,
      open: 0.4,
    },
    middle: {
      closed: 0.5,
      'near-closed': 0.6,
      'middle-closed': 0.7,
      middle: 1.0,
      'middle-open': 0.8,
      'near-open': 0.6,
      open: 0.5,
    },
    'middle-open': {
      closed: 0.4,
      'near-closed': 0.5,
      'middle-closed': 0.6,
      middle: 0.8,
      'middle-open': 1.0,
      'near-open': 0.9,
      open: 0.7,
    },
    'near-open': {
      closed: 0.3,
      'near-closed': 0.4,
      'middle-closed': 0.5,
      middle: 0.6,
      'middle-open': 0.9,
      'near-open': 1.0,
      open: 0.8,
    },
    open: {
      closed: 0.2,
      'near-closed': 0.3,
      'middle-closed': 0.4,
      middle: 0.5,
      'middle-open': 0.7,
      'near-open': 0.8,
      open: 1.0,
    },
  },
  flex: {
    rounded: { rounded: 1.0, unrounded: 0.5 },
    unrounded: { rounded: 0.5, unrounded: 1.0 },
  },
  site: {
    front: { front: 1.0, center: 0.5, back: 0.1 },
    center: { front: 0.5, center: 1.0, back: 0.5 },
    back: { front: 0.1, center: 0.5, back: 1.0 },
  },
  kick: {
    standard: { standard: 1.0, stress: 0.8 },
    stress: { standard: 0.8, stress: 1.0 },
  },
  nose: {
    oral: { oral: 1.0, nasal: 0.1 },
    nasal: { oral: 0.1, nasal: 1.0 },
  },
  time: {
    standard: { standard: 1.0, long: 0.5, short: 0.5 },
    long: { standard: 0.5, long: 1.0, short: 0.2 },
    short: { standard: 0.7, long: 0.2, short: 1.0 },
  },
} as const
