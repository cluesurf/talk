// The IPA articulatory axes, and where each mark can attach.
//
// talk's own modifiers carry `attaches` rules in `modifiers.json`. IPA's
// diacritics have no such data anywhere, so the rules are written out here
// and follow the same shape, which is what makes the two notations
// countable by one model.
//
// An AXIS is a dimension a sound varies along. A sound takes at most one
// mark per axis, so `̟` advanced and `̠` retracted are alternatives rather
// than a pair that can co-occur. That single constraint is what makes the
// space finite.

import type { Form } from '../string/type'

/** Where a mark may attach. An absent field means no restriction. */
export type Attachment = {
  place?: string[]
  notPlace?: string[]
  manner?: string[]
  notManner?: string[]
  voicing?: string[]
  form?: Form
}

/** A set of marks sharing one attachment rule, within an axis. */
export type MarkGroup = {
  marks: string[]
  rule: Attachment
}

export const CORONAL = [
  'dental',
  'alveolar',
  'postalveolar',
  'retroflex',
] as const

export const OBSTRUENT = [
  'plosive',
  'fricative',
  'sibilant-fricative',
  'non-sibilant-fricative',
  'lateral-fricative',
  'affricate',
] as const

export const SONORANT = [
  'nasal',
  'approximant',
  'fricative-approximant',
  'trill',
  'tap-flap',
  'lateral-approximant',
  'lateral-tap-flap',
] as const

/** Places behind the oral cavity, where most secondary articulation fails. */
export const BACK_PLACES = ['pharyngeal-epiglottal', 'glottal'] as const

/**
 * Axes that describe the SYLLABLE rather than the segment. The `band`
 * system excludes these; `mesh` includes them.
 */
export const SUPRASEGMENTAL = new Set([
  'duration',
  'syllabicity',
  'stress',
  'tone',
])

/**
 * Every IPA diacritic, by axis.
 *
 * Rules mirror talk's `attaches` where the mark exists there, and are
 * stated here where talk has no equivalent because it drops the feature.
 * Each is a claim about articulation, so each is arguable: a reader who
 * disagrees should change the rule rather than the count.
 */
export const IPA_AXES: Record<string, MarkGroup[]> = {
  dentality: [
    { marks: ['\u{032a}'], rule: { place: ['dental', 'alveolar'] } },
    { marks: ['\u{033c}'], rule: { place: ['bilabial', 'alveolar'] } },
  ],
  // Apical and laminal say where the coronal closure is made, so they mean
  // nothing off the coronal region.
  'tongue-shape': [
    { marks: ['\u{033a}', '\u{033b}'], rule: { place: [...CORONAL] } },
  ],
  'tongue-position': [{ marks: ['\u{031f}', '\u{0320}'], rule: {} }],
  height: [{ marks: ['\u{031d}', '\u{031e}'], rule: {} }],
  centrality: [
    { marks: ['\u{0308}', '\u{033d}'], rule: { form: 'vowel' } },
  ],
  'tongue-root': [
    { marks: ['\u{0318}', '\u{0319}'], rule: { form: 'vowel' } },
  ],
  'tongue-body': [
    { marks: ['ʲ'], rule: { notPlace: ['palatal', ...BACK_PLACES] } },
    { marks: ['ˠ', 'ˤ'], rule: { notPlace: ['velar', ...BACK_PLACES] } },
    {
      marks: ['ᶣ'],
      rule: {
        notPlace: [
          'bilabial',
          'palatal',
          'labial-velar',
          'labial-palatal',
          ...BACK_PLACES,
        ],
      },
    },
  ],
  labial: [
    {
      marks: ['ʷ'],
      rule: { notPlace: ['bilabial', 'labiodental', ...BACK_PLACES] },
    },
    // Degree of rounding only means something on a rounded articulation.
    { marks: ['\u{0339}', '\u{031c}'], rule: { form: 'vowel' } },
  ],
  laryngeal: [
    {
      // Aspirated fricatives are attested in 41 phoible entries (Burmese
      // `sʰ`, Tibetan `ɕʰ` `xʰ` `ʂʰ`, Karen), so this is not plosive-only.
      marks: ['ʰ', 'ʱ'],
      rule: {
        manner: [...OBSTRUENT],
        notPlace: ['glottal'],
      },
    },
    {
      marks: ['ʼ'],
      rule: {
        manner: [...OBSTRUENT],
        voicing: ['voiceless'],
        notPlace: ['glottal'],
      },
    },
    { marks: ['ˀ'], rule: { notPlace: ['glottal'] } },
  ],
  phonation: [
    {
      marks: ['\u{0325}'],
      rule: { manner: [...SONORANT], voicing: ['voiced'] },
    },
    { marks: ['\u{032c}'], rule: { voicing: ['voiceless'] } },
    // Breathy and creaky are kinds of voicing, so they need voicing.
    { marks: ['\u{0324}', '\u{0330}'], rule: { voicing: ['voiced'] } },
  ],
  tension: [
    { marks: ['\u{0348}', '\u{0349}'], rule: { form: 'consonant' } },
  ],
  frication: [
    { marks: ['\u{0353}'], rule: { form: 'consonant' } },
    { marks: ['\u{0347}'], rule: { place: [...CORONAL] } },
  ],
  // A release is what follows a stop closure, so it needs a stop. A nasal
  // cannot have a nasal release, nor a lateral a lateral one.
  release: [
    { marks: ['ⁿ'], rule: { manner: ['plosive'], notManner: ['nasal'] } },
    { marks: ['ˡ'], rule: { manner: ['plosive'], place: [...CORONAL] } },
    { marks: ['\u{031a}'], rule: { manner: ['plosive'] } },
  ],
  rhoticity: [{ marks: ['\u{02de}'], rule: { form: 'vowel' } }],
  nasality: [{ marks: ['\u{0303}'], rule: { notManner: ['nasal'] } }],
  duration: [{ marks: ['ː', 'ˑ', '\u{0306}'], rule: {} }],
  syllabicity: [
    {
      marks: ['\u{0329}'],
      rule: { form: 'consonant', manner: [...SONORANT] },
    },
    { marks: ['\u{032f}'], rule: { form: 'vowel' } },
  ],
  stress: [{ marks: ['\u{0301}', '\u{0300}'], rule: {} }],
  tone: [
    { marks: ['˥', '˦', '˧', '˨', '˩'], rule: { form: 'vowel' } },
  ],
}

/** Whether a base with these features can take a mark under this rule. */
export function attaches(
  base: { form: Form; place?: string; manner?: string; voicing?: string },
  rule: Attachment,
): boolean {
  if (rule.form && base.form !== rule.form) return false
  if (rule.place && !rule.place.includes(base.place ?? '')) return false
  if (rule.notPlace?.includes(base.place ?? '')) return false
  if (rule.manner && !rule.manner.includes(base.manner ?? '')) return false
  if (rule.notManner?.includes(base.manner ?? '')) return false
  if (rule.voicing && !rule.voicing.includes(base.voicing ?? '')) return false
  return true
}
