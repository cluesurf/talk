// Fold the many ways IPA gets written down into the one this library reads.
//
// The tables here are the whole of it. A caller reading IPA from many
// sources needs the same folding a caller reading one source needs, plus
// the things only a messy source does, and splitting those across two
// implementations is how they drift: a second copy of this file went on
// merging `ʱ` into `ʰ` for months after this one stopped.
//
// Where a comment gives a count, it was measured across 3,896,910 IPA
// strings drawn from several hundred sources rather than reasoned about.

/**
 * Characters that mean the same thing as a character the parser knows,
 * and are replaced one for one.
 *
 * Four kinds of thing end up here.
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
 *
 * FOREIGN-BLOCK LOOKALIKES. The same mistake made with a Greek or
 * Cyrillic keyboard, or by a word processor that curls a quote.
 *
 * Every entry is LOSSLESS: two codepoints for one sound, and picking one
 * gives nothing up. Nothing that would assert something the source did
 * not say belongs here, or anywhere in this file.
 *
 * That rules out the archiphonemes. `R` is an underspecified rhotic, `N`
 * a placeless nasal, `ᴅ` an underspecified stop, and each stands for a
 * SET of realizations the source declined to choose between. This used to
 * map them to `r`, `n` and `d`, which stated what the description
 * refused to. They now pass through and the parser reports them.
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

  // GREEK LETTERS THAT ARE NOT IPA.
  //
  // Three Greek letters ARE official IPA and are deliberately absent from
  // this table: β U+03B2 the voiced bilabial fricative, θ U+03B8 the
  // voiceless dental, and χ U+03C7 the voiceless uvular. Together they
  // account for 166,790 uses across 171 languages, so folding them would
  // be rewriting correct transcription.
  //
  // These are not IPA. Each has a Latin-block IPA letter that looks
  // almost the same, and a source reaching for the Greek keyboard key
  // produces a codepoint no IPA reader indexes.
  γ: 'ɣ', // U+03B3 -> U+0263 voiced velar fricative, 26 uses
  δ: 'ð', // U+03B4 -> U+00F0 voiced dental fricative, 77 uses
  ϕ: 'ɸ', // U+03D5 -> U+0278 voiceless bilabial fricative
  ε: 'ɛ', // U+03B5 -> U+025B open-mid front unrounded
  ι: 'ɪ', // U+03B9 -> U+026A near-close near-front unrounded
  υ: 'ʊ', // U+03C5 -> U+028A near-close near-back rounded
  α: 'ɑ', // U+03B1 -> U+0251 open back unrounded
  // φ U+03C6 is the ambiguous one and IS folded: it renders as a Greek
  // phi and every observed use is the bilabial fricative, which IPA
  // writes ɸ.
  //
  // λ U+03BB is deliberately NOT folded. In the Americanist tradition it
  // is the lateral affricate, IPA `tɬ`, and in other sources it is the
  // palatal lateral ʎ, so a mapping would have to pick one and be wrong
  // for the other half of the corpus.
  φ: 'ɸ',

  // CYRILLIC LOOKALIKES.
  //
  // `ӕ` is CYRILLIC SMALL LIGATURE A IE, which renders identically to the
  // Latin `æ` IPA wants. 83 uses, all in one language, all of them vowels
  // in a Latin-script transcription.
  ӕ: 'æ', // U+04D5 -> U+00E6
  Ӕ: 'Æ',

  // TYPOGRAPHIC QUOTES.
  //
  // The straight apostrophe is folded to the ejective mark above. A
  // source that ran through a word processor has the curly one instead,
  // and it renders the same. 570 uses.
  '’': 'ʼ', // U+2019 -> U+02BC
  '‘': 'ʼ', // U+2018
  '`': 'ʼ', // U+0060
  '´': 'ʼ', // U+00B4
  // The primary stress mark, typed as ASCII.
  '"': 'ˈ', // U+0022 -> U+02C8
}

/**
 * Characters carrying nothing recoverable, removed before anything else.
 *
 * PRIVATE USE AREA. A font assigns these whatever glyph it likes and no
 * two agree, so a source using one meant a symbol its own font drew and
 * nothing downstream can know which. 98 such characters were observed,
 * as U+F19D, U+F179, U+F1BB, U+F1BC and U+F1C8, in five languages.
 */

const PRIVATE_USE =
  /[\uE000-\uF8FF]|[\u{F0000}-\u{FFFFD}]|[\u{100000}-\u{10FFFD}]/gu

/**
 * Delimiters WRAPPING the whole string, which say what kind of
 * transcription it is rather than form part of it.
 *
 * `/lɛwɨz/` is a phonemic transcription written with the slashes that say
 * so, in a field that already means IPA. 6,903 uses across four
 * languages. Square brackets are the phonetic equivalent and go for the
 * same reason.
 *
 * Stripped only when they wrap. A slash INSIDE a string is doing
 * something else, separating two readings most often, and cutting it
 * would join them into one word that is neither.
 */

const WRAPPING_DELIMITER = /^\s*([/[])(.+)([/\]])\s*$/u

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
 * still resolved. It no longer is, and there is no option to bring that
 * back.
 *
 * Every mark that was dropped now has an entry in `modifiers.json`, so
 * `b̤` reads as `b` plus breathy rather than as `b`, and a caller sees the
 * feature instead of losing it. Breathy voice is contrastive across South
 * Asia and creaky voice across Mesoamerica, so the old default quietly
 * merged phonemes that contrast.
 *
 * A caller wanting `b̤` to MATCH `b` wants the tone encoding, which is
 * coarse by design and gives both the same code. Normalizing is not the
 * place to throw a distinction away.
 *
 * The spacing raised and lowered marks `˔` and `˕` are left alone rather
 * than folded into their combining equivalents: four phones spell
 * themselves with them (`ɹ̠˔`, `ɻ˔`), and the tries key on a phone's own
 * spelling.
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

/**
 * The tone marks, which all share ONE rank.
 *
 * A CONTOUR IS A SEQUENCE, NOT A SET. `˩˩˦` is a rise and `˦˩˩` is a fall,
 * and the two are spelled with the same three letters in a different order.
 * Ranking the five Chao letters individually meant every run of them was
 * sorted into descending pitch, so every rising tone became a falling one
 * and the original was not recoverable.
 *
 * MEASURED, in a corpus normalized by this function: 599,336 of
 * Vietnamese's 599,339 tone-letter runs came out in descending order, and
 * all 23,292 of Thai's. The three that escaped had a space in front of
 * them, so no base preceded and the run was never sorted. Vietnamese `mả`
 * is a dipping-rise and was stored `maː˦˨˩`; `mã` is a creaky rise and was
 * stored `maˀː˥˦`. Neither language has a tone that only falls.
 *
 * DELETING THEM FROM `MARK_ORDER` DOES NOT FIX IT. `rankOf` would fall
 * through to the codepoint, and U+02E5 through U+02E9 run high pitch to
 * low, so the sort produces the same descending order by another route.
 *
 * An equal rank is the fix, because `Array.prototype.sort` is stable: a run
 * of tone marks keeps the order it arrived in, while still sorting as a
 * group against every other kind of mark.
 *
 * THE COMBINING TONE ACCENTS ARE HERE FOR THE SAME REASON. Acute, grave,
 * circumflex, caron, macron and the doubled pair are how a great many
 * sources write tone, two of them stacked make a contour, and none appears
 * in `MARK_ORDER`, so they were being ordered by codepoint against each
 * other. That is the same defect with a different alphabet.
 */

const TONE = new Set([
  '˥',
  '˦',
  '˧',
  '˨',
  '˩',
  '↓', // downstep, which lowers what follows and so is positional too
  '\u{0300}', // grave, low
  '\u{0301}', // acute, high
  '\u{0302}', // circumflex, falling
  '\u{0304}', // macron, mid
  '\u{030b}', // double acute, extra high
  '\u{030c}', // caron, rising
  '\u{030f}', // double grave, extra low
  '\u{0311}', // inverted breve, peaking
])

/**
 * Where the tone group sorts: exactly where the Chao letters already did,
 * which is last among the suprasegmentals.
 */

const TONE_RANK = MARK_RANK.get('˥')!

const rankOf = (character: string): number =>
  TONE.has(character)
    ? TONE_RANK
    : (MARK_RANK.get(character) ??
      MARK_ORDER.length + character.codePointAt(0)!)

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

  // Before anything else: drop the private-use characters no reader can
  // resolve, and unwrap the delimiters that say what kind of
  // transcription this is. Both are about the string rather than in it,
  // so they go before the walk that folds what the string is made of, and
  // the unwrap runs on the stripped text so a private-use character
  // between a slash and the end cannot hide the wrap.
  const stripped = text.replace(PRIVATE_USE, '')
  const bare = WRAPPING_DELIMITER.exec(stripped)?.[2] ?? stripped

  // Two passes, because a replacement can itself contain something the
  // second pass acts on: `ȵ` expands to `ɲ̟`, and the advancing mark then
  // has to decompose and sort with the rest of its run. Doing both in one
  // walk would leave a replacement's own marks in input order while a
  // literal occurrence got sorted.
  let source = ''

  for (const character of bare) {
    const digit = SUPERSCRIPT_DIGIT[character]

    if (digit) {
      source += TONE_DIGIT[digit]
      continue
    }

    source += REPLACE[character] ?? character
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
