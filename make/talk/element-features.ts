import merge from 'lodash/merge'
import { ConsonantFeatureName, VowelFeatureName } from './features'

export const VOWELS: Record<
  string,
  Partial<Record<VowelFeatureName, string>>
> = {}

const NASALS = ['oral', 'nasal']
const STRESSES = ['standard', 'stress']

NASALS.forEach(nose => {
  STRESSES.forEach(kick => {
    const keys: string[] = []
    if (nose === 'nasal') {
      keys.push(`&`)
    }
    if (kick === 'stress') {
      keys.push('^')
    }
    const key = keys.join('')
    merge(VOWELS, {
      [`i${key}`]: vowel({
        room: 'closed',
        site: 'front',
        flex: 'unrounded',
        nose,
        kick,
      }),
      [`e${key}`]: vowel({
        room: 'middle',
        site: 'front',
        flex: 'unrounded',
        nose,
        kick,
      }),
      [`a${key}`]: vowel({
        room: 'open',
        site: 'front',
        flex: 'unrounded',
        nose,
        kick,
      }),
      [`o${key}`]: vowel({
        room: 'middle-closed',
        site: 'back',
        flex: 'rounded',
        nose,
        kick,
      }),
      [`u${key}`]: vowel({
        room: 'closed',
        site: 'back',
        flex: 'rounded',
        nose,
        kick,
      }),
      [`I${key}`]: vowel({
        room: 'near-closed',
        site: 'front',
        flex: 'unrounded',
        nose,
        kick,
      }),
      [`E${key}`]: vowel({
        room: 'middle-open',
        site: 'front',
        flex: 'unrounded',
        nose,
        kick,
      }),
      [`A${key}`]: vowel({
        room: 'near-open',
        site: 'front',
        flex: 'unrounded',
        nose,
        kick,
      }),
      [`O${key}`]: vowel({
        room: 'near-closed',
        site: 'back',
        flex: 'unrounded',
        nose,
        kick,
      }),
      [`U${key}`]: vowel({
        room: 'middle',
        site: 'center',
        nose,
        kick,
      }),
      [`i$${key}`]: vowel({
        site: 'front',
        room: 'closed',
        flex: 'rounded',
        nose,
        kick,
      }),
      [`e$${key}`]: vowel({
        room: 'middle-closed',
        site: 'front',
        flex: 'rounded',
        nose,
        kick,
      }),
      [`a$${key}`]: vowel({
        room: 'middle-open',
        site: 'front',
        flex: 'rounded',
        nose,
        kick,
      }),
      [`o$${key}`]: vowel({
        room: 'middle-open',
        site: 'back',
        flex: 'rounded',
        nose,
        kick,
      }),
      [`u$${key}`]: vowel({
        room: 'middle-open',
        site: 'center',
        flex: 'unrounded',
        nose,
        kick,
      }),
    })
  })
})

export const VOWEL_KEYS = Object.keys(VOWELS)

// https://en.wikipedia.org/wiki/IPA_consonant_chart_with_audio
export const CONSONANTS: Record<
  string,
  Partial<Record<ConsonantFeatureName, string>>
> = {
  m: consonant({ site: 'bilabial', mold: 'nasal' }),
  N: consonant({ site: 'retroflex', mold: 'nasal' }),
  n: consonant({ site: 'alveolar', mold: 'nasal' }),
  q: consonant({ site: 'velar', mold: 'nasal' }),
  G: consonant({ site: 'velar', mold: 'fricative' }),
  'g?': consonant({
    mold: 'plosive',
    site: 'velar',
    flow: 'implosive',
  }),
  'gG~': consonant({
    mold: 'plosive',
    site: 'velar',
    form: 'velarization',
  }),
  'gh~': consonant({
    mold: 'plosive',
    site: 'velar',
    form: 'aspiration',
  }),
  'gy~': consonant({
    mold: 'plosive',
    site: 'velar',
    form: 'palatalization',
  }),
  'gw~': consonant({
    mold: 'plosive',
    site: 'velar',
    form: 'labialization',
  }),
  g: consonant({ mold: 'plosive', site: 'velar' }),
  "'": consonant({ mold: 'plosive', site: 'glottal' }),
  Q: consonant({ site: 'pharyngeal', mold: 'fricative' }),
  'd?': consonant({
    site: 'dental',
    mold: 'plosive',
    flow: 'implosive',
  }),
  'd!': consonant({
    site: 'dental',
    mold: 'plosive',
    flow: 'ejective',
  }),
  'd*': consonant({ flow: 'click' }),
  'dG~': consonant({ site: 'dental', form: 'velarization' }),
  'dh~': consonant({
    site: 'dental',
    mold: 'plosive',
    form: 'aspiration',
  }),
  'dy~': consonant({
    site: 'dental',
    mold: 'plosive',
    form: 'palatalization',
  }),
  'dw~': consonant({
    site: 'dental',
    mold: 'plosive',
    form: 'labialization',
  }),
  'd.': consonant({ site: 'dental', mold: 'plosive', form: 'stop' }),
  D: consonant({ site: 'retroflex', mold: 'plosive' }),
  'dQ~': consonant({
    site: 'dental',
    mold: 'plosive',
    form: 'pharyngealization',
  }),
  d: consonant({ site: 'dental', mold: 'plosive' }),
  'b?': consonant({
    site: 'bilabial',
    tone: 'voiced',
    mold: 'plosive',
    flow: 'implosive',
  }),
  'bh~': consonant({
    site: 'bilabial',
    mold: 'plosive',
    tone: 'voiced',
    form: 'aspiration',
  }),
  'by~': consonant({
    site: 'bilabial',
    mold: 'plosive',
    tone: 'voiced',
    form: 'palatalization',
  }),
  'bw~': consonant({
    site: 'bilabial',
    mold: 'plosive',
    tone: 'voiced',
    form: 'labialization',
  }),
  'b!': consonant({
    site: 'bilabial',
    tone: 'voiced',
    mold: 'plosive',
    flow: 'ejective',
  }),
  b: consonant({ site: 'bilabial', tone: 'voiced', mold: 'plosive' }),
  'p!': consonant({
    site: 'bilabial',
    mold: 'plosive',
    flow: 'ejective',
  }),
  'p*': consonant({ site: 'bilabial', flow: 'click' }),
  'ph~': consonant({
    site: 'bilabial',
    mold: 'plosive',
    form: 'aspiration',
  }),
  'py~': consonant({
    site: 'bilabial',
    mold: 'plosive',
    form: 'palatalization',
  }),
  'pw~': consonant({
    site: 'bilabial',
    mold: 'plosive',
    form: 'labialization',
  }),
  'p.': consonant({
    site: 'bilabial',
    mold: 'plosive',
    form: 'stop',
  }),
  'p@': consonant({
    site: 'bilabial',
    mold: 'plosive',
    form: 'tense',
  }),
  p: consonant({ site: 'bilabial', mold: 'plosive' }),
  'T!': consonant({
    mold: 'plosive',
    site: 'retroflex',
    flow: 'ejective',
  }),
  'Tw~': consonant({
    mold: 'plosive',
    site: 'retroflex',
    form: 'labialization',
  }),
  T: consonant({ mold: 'plosive', site: 'retroflex' }),
  't!': consonant({
    site: 'alveolar',
    mold: 'plosive',
    flow: 'ejective',
  }),
  't*': consonant({ flow: 'click' }),
  'tQ~': consonant({
    site: 'alveolar',
    mold: 'plosive',
    form: 'pharyngealization',
  }),
  'th~': consonant({
    site: 'alveolar',
    mold: 'plosive',
    form: 'aspiration',
  }),
  'ty~': consonant({
    site: 'alveolar',
    mold: 'plosive',
    form: 'palatalization',
  }),
  'tw~': consonant({
    site: 'alveolar',
    mold: 'plosive',
    form: 'labialization',
  }),
  't@': consonant({
    site: 'alveolar',
    mold: 'plosive',
    form: 'tense',
  }),
  't.': consonant({
    site: 'alveolar',
    mold: 'plosive',
    form: 'stop',
  }),
  t: consonant({ site: 'alveolar', mold: 'plosive' }),
  'k!': consonant({
    site: 'velar',
    mold: 'plosive',
    flow: 'ejective',
  }),
  'kh~': consonant({
    site: 'velar',
    mold: 'plosive',
    form: 'aspiration',
  }),
  'ky~': consonant({
    site: 'velar',
    mold: 'plosive',
    form: 'palatalization',
  }),
  'kw~': consonant({
    site: 'velar',
    mold: 'plosive',
    form: 'labialization',
  }),
  'k.': consonant({ site: 'velar', mold: 'plosive', form: 'stop' }),
  'k*': consonant({ flow: 'click' }),
  'K!': consonant({
    site: 'uvular',
    mold: 'plosive',
    flow: 'ejective',
  }),
  'Kh~': consonant({
    site: 'uvular',
    mold: 'plosive',
    form: 'aspiration',
  }),
  'Ky~': consonant({
    site: 'uvular',
    mold: 'plosive',
    form: 'palatalization',
  }),
  K: consonant({ site: 'uvular', mold: 'plosive' }),
  k: consonant({ site: 'velar', mold: 'plosive' }),
  'H!': consonant({
    site: 'uvular',
    mold: 'fricative',
    flow: 'ejective',
  }),
  H: consonant({ site: 'uvular', mold: 'fricative' }),
  h: consonant({ site: 'glottal', mold: 'fricative' }),
  J: consonant({
    mold: 'sibilant-fricative',
    site: 'retroflex',
  }),
  'j!': consonant({
    site: 'postalveolar',
    mold: 'sibilant-fricative',
  }),
  'jy~': consonant({
    site: 'postalveolar',
    mold: 'sibilant-fricative',
    form: 'palatalization',
  }),
  'jw~': consonant({
    site: 'postalveolar',
    mold: 'sibilant-fricative',
    form: 'labialization',
  }),
  j: consonant({
    site: 'postalveolar',
    mold: 'sibilant-fricative',
  }),
  'S!': consonant({
    mold: 'lateral-fricative',
    site: 'alveolar',
    flow: 'ejective',
  }),
  's!': consonant({
    mold: 'sibilant-fricative',
    site: 'alveolar',
    flow: 'ejective',
  }),
  S: consonant({ mold: 'lateral-fricative', site: 'alveolar' }),
  'sQ~': consonant({
    mold: 'sibilant-fricative',
    site: 'alveolar',
    form: 'pharyngealization',
  }),
  's@': consonant({
    site: 'alveolar',
    mold: 'sibilant-fricative',
    form: 'tense',
  }),
  'sy~': consonant({
    site: 'alveolar',
    mold: 'sibilant-fricative',
    form: 'palatalization',
  }),
  'sw~': consonant({
    site: 'alveolar',
    mold: 'sibilant-fricative',
    form: 'labialization',
  }),
  s: consonant({
    site: 'alveolar',
    mold: 'sibilant-fricative',
  }),
  F: consonant({ site: 'bilabial', mold: 'fricative' }),
  'f!': consonant({
    site: 'labiodental',
    mold: 'fricative',
    flow: 'ejective',
  }),
  'fy~': consonant({
    site: 'labiodental',
    mold: 'fricative',
    form: 'palatalization',
  }),
  'fw~': consonant({
    site: 'labiodental',
    mold: 'fricative',
    form: 'labialization',
  }),
  f: consonant({ site: 'labiodental', mold: 'fricative' }),
  V: consonant({
    site: 'bilabial',
    tone: 'voiced',
    mold: 'fricative',
  }),
  'vy~': consonant({
    site: 'labiodental',
    tone: 'voiced',
    mold: 'fricative',
    form: 'palatalization',
  }),
  'vw~': consonant({
    site: 'labiodental',
    tone: 'voiced',
    mold: 'fricative',
    form: 'labialization',
  }),
  v: consonant({
    site: 'labiodental',
    tone: 'voiced',
    mold: 'fricative',
  }),
  'z!': consonant({
    mold: 'sibilant-fricative',
    flow: 'ejective',
  }),
  'zQ~': consonant({
    mold: 'sibilant-fricative',
    form: 'pharyngealization',
  }),
  z: consonant({ mold: 'sibilant-fricative' }),
  'Z!': consonant({
    mold: 'lateral-fricative',
    site: 'alveolar',
    flow: 'ejective',
  }),
  Z: consonant({ site: 'alveolar', mold: 'lateral-fricative' }),
  'CQ~': consonant({
    mold: 'affricate',
    site: 'dental',
    form: 'pharyngealization',
  }),
  C: consonant({ mold: 'affricate', site: 'dental' }),
  'cQ~': consonant({
    mold: 'affricate',
    site: 'dental',
    form: 'pharyngealization',
  }),
  c: consonant({ mold: 'affricate', site: 'dental' }),
  'Lh~': consonant({
    mold: 'lateral-approximant',
    site: 'retroflex',
    form: 'aspiration',
  }),
  'Ly~': consonant({
    mold: 'lateral-approximant',
    site: 'retroflex',
    form: 'palatalization',
  }),
  L: consonant({ mold: 'lateral-approximant', site: 'retroflex' }),
  'l*': consonant({ flow: 'click' }),
  'lQ~': consonant({
    mold: 'lateral-approximant',
    form: 'pharyngealization',
  }),
  'lh~': consonant({
    mold: 'lateral-approximant',
    form: 'aspiriation',
  }),
  'ly~': consonant({
    mold: 'lateral-approximant',
    form: 'palatalization',
  }),
  l: consonant({ mold: 'lateral-approximant' }),
  R: consonant({ mold: 'tap', site: 'retroflex' }),
  'rQ~': consonant({
    mold: 'tap',
    site: 'alveolar',
    form: 'pharyngealization',
  }),
  r: consonant({ mold: 'tap', site: 'alveolar' }),
  'xy~': consonant({
    site: 'postalveolar',
    mold: 'sibilant-fricative',
    form: 'palatalization',
  }),
  'xw~': consonant({
    site: 'postalveolar',
    mold: 'sibilant-fricative',
    form: 'labialization',
  }),
  'x!': consonant({
    site: 'postalveolar',
    mold: 'sibilant-fricative',
    flow: 'ejective',
  }),
  'Xy~': consonant({
    mold: 'sibilant-fricative',
    site: 'retroflex',
    form: 'palatalization',
  }),
  'Xw~': consonant({
    mold: 'sibilant-fricative',
    site: 'retroflex',
    form: 'labialization',
  }),
  'X!': consonant({
    mold: 'sibilant-fricative',
    site: 'retroflex',
    flow: 'ejective',
  }),
  X: consonant({
    mold: 'sibilant-fricative',
    site: 'retroflex',
  }),
  'x@': consonant({
    site: 'postalveolar',
    mold: 'sibilant-fricative',
    form: 'tense',
  }),
  x: consonant({
    site: 'postalveolar',
    mold: 'sibilant-fricative',
  }),
  W: consonant({
    mold: 'approximant',
  }),
  'w!': consonant({
    mold: 'approximant',
    flow: 'ejective',
  }),
  w: consonant({
    mold: 'approximant',
  }),
  y: consonant({
    site: 'palatal',
    mold: 'approximant',
  }),
}

export const CONSONANT_KEYS = Object.keys(CONSONANTS)

export const CONSONANT_PLACEHOLDER = consonant()

export const VOWEL_PLACEHOLDER = vowel()

export const UNITS = { ...CONSONANTS, ...VOWELS }

function consonant(
  mappings: Partial<Record<ConsonantFeatureName, string>> = {},
) {
  return mappings
}

function vowel(
  mappings: Partial<Record<VowelFeatureName, string>> = {},
) {
  return mappings
}
