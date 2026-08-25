// Fold the many ways IPA gets written down into the one this library reads.

/**
 * Characters that mean the same thing as a character the parser knows,
 * and are replaced one for one.
 *
 * Three kinds of thing end up here.
 *
 * WITHDRAWN SYMBOLS. `ʆ` and `ʓ` carried the palatal hook, which the IPA
 * withdrew in 1989 in favour of a following superscript j. The mapping is
 * exact, so nothing is lost by applying it.
 *
 * SANCTIONED ABBREVIATIONS. `ɚ` and `ɝ` are the IPA's own shorthand for a
 * rhotic schwa, defined as the plain vowel plus the rhoticity hook.
 *
 * LOOKALIKES. A transcription typed on a normal keyboard reaches for
 * ASCII `g`, `:` and `'` where the IPA wants `ɡ`, `ː` and `ʼ`. These are
 * different codepoints that render near-identically, so a reader cannot
 * see the difference and a parser cannot miss it.
 */

const REPLACE: Record<string, string> = {
  // Withdrawn 1989, palatal hook.
  ʆ: 'ʃʲ',
  ʓ: 'ʒʲ',
  // IPA-sanctioned abbreviations for rhotic vowels.
  ɚ: 'ə˞',
  ɝ: 'ɜ˞',
  // ASCII lookalikes.
  g: 'ɡ', // U+0067 -> U+0261 script g
  ':': 'ː', // colon -> length mark
  "'": 'ʼ', // apostrophe -> ejective
  '?': 'ʔ', // question mark -> glottal stop
  ',': '̩', // comma -> syllabic (some sources write it inline)
  // Sinological letters for the alveolo-palatal series, written as the
  // palatal plus the advancing mark. `ȵ` is nearer `ɲ̟` than `ɲ`, and the
  // advancement now has a modifier to land on, so it is kept.
  ȵ: 'ɲ̟',
  ȶ: 'c̟',
  ȡ: 'ɟ̟',
  ȴ: 'ʎ̟',
}

/**
 * ARCHIPHONEMES, the replacements that assert something the source did
 * not.
 *
 * `R` is an underspecified rhotic, `N` a placeless nasal, `ᴅ` an
 * underspecified stop. Each stands for a SET of realizations the source
 * declined to choose between, so picking one member states what the
 * description refused to.
 *
 * They are mapped by default, because a caller matching against a catalog
 * needs a segment rather than a failure and the plainest member of each
 * set is the least wrong choice available. Pass `keepDetail` to leave them
 * alone and have the parser report them, which is what a caller that must
 * not inherit the assumption wants.
 */

const APPROXIMATE: Record<string, string> = {
  R: 'r',
  N: 'n',
  ᴅ: 'd',
}

/**
 * Superscript digits, which several sources use for tone instead of Chao
 * letters. `ma³³` and `ma˧˧` are the same word.
 *
 * The scale is the IPA's five levels, so `1` is extra-low and `5` extra
 * high. Sources using a 1-to-9 scale exist and are NOT handled: mapping
 * those needs to know the scale first, which the string does not say.
 */

const TONE_DIGIT: Record<string, string> = {
  '1': '˩',
  '2': '˨',
  '3': '˧',
  '4': '˦',
  '5': '˥',
}

const SUPERSCRIPT_DIGIT: Record<string, string> = {
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
}

/**
 * The ring above is the same feature as the ring below, voiceless. IPA
 * uses the one above when a descender leaves no room underneath, so `ɡ̊`
 * and `ŋ̥` carry the same mark by different codepoints.
 *
 * Applied after decomposition, since both are combining marks.
 */

const RING_ABOVE = '̊'
const RING_BELOW = '̥'

/**
 * Characters that are not phonetic content and are dropped: the ties
 * binding an affricate or a doubly-articulated stop, and the marks some
 * sources use for syllable and morpheme edges.
 */

const DROP = new Set(['͡', '͜', '.', '‿'])

/**
 * Fine phonetic detail used to be stripped here so the segment underneath
 * still resolved. It no longer is.
 *
 * Every mark that was dropped now has an entry in `modifiers.json`, so
 * `b̤` reads as `b` plus breathy rather than as `b`, and a caller sees the
 * feature instead of losing it. Breathy voice is contrastive across South
 * Asia and creaky voice across Mesoamerica, so the old default quietly
 * merged phonemes that contrast.
 *
 * The spacing raised and lowered marks `˔` and `˕` are the exception, and
 * are deliberately left alone rather than folded into their combining
 * equivalents: four phones spell themselves with them (`ɹ̠˔`, `ɻ˔`), and
 * the tries key on a phone's own spelling.
 */

/**
 * The canonical order for the marks that follow a base, by articulatory
 * axis, innermost first.
 *
 * Combining marks that share a Unicode combining class keep their input
 * order under NFD, so `n̪̥` and `n̥̪` stay two different strings for one
 * sound. Worse, the parser matches greedily: one reads as the phone `n̪`
 * plus voiceless, the other as the phone `n̥` plus dental, giving `n$h!`
 * and `nh!$` for the same segment.
 *
 * Sorting the run fixes both. The order mirrors talk's modifier `order`
 * field so an IPA string and its talk spelling agree on sequence.
 *
 * A mark absent from this list sorts last, by codepoint, so the result is
 * still deterministic for input this table does not anticipate.
 */

const MARK_ORDER = [
  // Part of a base's own spelling rather than a mark on it, so it sorts
  // innermost and stays next to the letter it belongs to. `ç` is one
  // phone, and sorting any other mark inside it splits it into `c` plus a
  // cedilla the tries have never heard of.
  '\u{0327}', // cedilla
  // Place detail, closest to the articulation itself.
  '\u{032a}', // dental
  '\u{033c}', // linguolabial
  '\u{033a}', // apical
  '\u{033b}', // laminal
  '\u{031f}', // advanced
  '\u{0320}', // retracted
  '\u{031d}', // raised
  '\u{031e}', // lowered
  '\u{0308}', // centralized
  '\u{033d}', // mid-centralized
  '\u{0318}', // advanced tongue root
  '\u{0319}', // retracted tongue root
  // Secondary articulation.
  'ʲ',
  'ˠ',
  'ˤ',
  'ᶣ',
  'ʷ',
  '\u{0339}', // more rounded
  '\u{031c}', // less rounded
  // Laryngeal.
  'ʰ',
  'ʱ',
  'ʼ',
  'ˀ',
  // Phonation.
  '\u{0325}', // voiceless
  '\u{032c}', // voiced
  '\u{0324}', // breathy
  '\u{0330}', // creaky
  'ᴱ', // sphincteric
  // Manner detail and release.
  '\u{0348}', // fortis
  '\u{0349}', // lenis
  '\u{0353}', // frictionalized
  '\u{0347}', // non-sibilant
  'ⁿ',
  'ˡ',
  '\u{031a}', // no audible release
  '\u{02de}', // rhotic
  // Nasality, then the suprasegmentals last.
  '\u{0303}',
  '\u{0329}', // syllabic
  '\u{032f}', // non-syllabic
  'ː',
  'ˑ',
  '\u{0306}', // extra-short
  '˥',
  '˦',
  '˧',
  '˨',
  '˩',
  '↓', // downstep, which lowers the register of everything after it
]

const MARK_RANK = new Map(MARK_ORDER.map((mark, index) => [mark, index]))

const rankOf = (character: string): number =>
  MARK_RANK.get(character) ??
  MARK_ORDER.length + character.codePointAt(0)!

/** Whether a character attaches to a preceding base rather than standing alone. */
const isAffix = (character: string): boolean =>
  /\p{Mn}|\p{Lm}|\p{Sk}/u.test(character)

const isBase = (character: string): boolean => /\p{L}/u.test(character)

/**
 * Put the affixes following each base into canonical order.
 *
 * Only a run that FOLLOWS a base is sorted. A leading modifier is a
 * different sound rather than a reordering: `ʰk` is pre-aspirated, `kʰ`
 * post-aspirated, and moving one to the other would change what was said.
 */
function orderMarks(text: string): string {
  const out: string[] = []
  let run: string[] = []
  let afterBase = false

  const flush = () => {
    if (!run.length) return
    if (afterBase) run.sort((a, b) => rankOf(a) - rankOf(b))
    out.push(...run)
    run = []
  }

  for (const character of text) {
    if (isAffix(character) && (afterBase || run.length)) {
      run.push(character)
      continue
    }

    flush()
    out.push(character)
    afterBase = isBase(character)
  }

  flush()

  return out.join('')
}

export type NormalizeIpaOptions = {
  /**
   * Read superscript and bare digits as tone. Off by default, because a
   * bare digit is ambiguous: `a1` is a tone in one source and an index in
   * another. Superscript digits are unambiguous and always converted.
   */
  bareDigitTone?: boolean
  /**
   * Leave the archiphonemes `R`, `N` and `ᴅ` alone rather than resolving
   * each to the plainest member of the set it stands for. Off by default.
   * Turn it on when inheriting that assumption would be wrong, and the
   * parser reports them instead.
   */
  keepDetail?: boolean
}

/**
 * Normalize an IPA string into the form the parser reads.
 *
 * Idempotent: normalizing an already-normalized string returns it
 * unchanged, so it is safe to apply more than once.
 *
 * Returns NFD, because every combining mark in the tries is stored
 * decomposed and a precomposed `ã` would otherwise miss.
 */
export function normalizeIpa(
  text: string,
  options: NormalizeIpaOptions = {},
): string {
  const out: string[] = []

  // Two passes, because a replacement can itself contain something the
  // second pass acts on: `ȵ` expands to `ɲ̟`, and the advancing mark then
  // has to decompose and sort with the rest of its run. Doing both in one
  // walk would leave a replacement's own marks in input order while a
  // literal occurrence got sorted.
  let source = ''

  for (const character of text) {
    const digit = SUPERSCRIPT_DIGIT[character]

    if (digit) {
      source += TONE_DIGIT[digit]
      continue
    }

    const approximate = options.keepDetail
      ? undefined
      : APPROXIMATE[character]

    source += REPLACE[character] ?? approximate ?? character
  }

  for (const character of source.normalize('NFD')) {
    if (DROP.has(character)) {
      continue
    }

    if (character === RING_ABOVE) {
      out.push(RING_BELOW)
      continue
    }

    if (options.bareDigitTone && TONE_DIGIT[character]) {
      out.push(TONE_DIGIT[character])
      continue
    }

    out.push(character)
  }

  return orderMarks(out.join(''))
}
