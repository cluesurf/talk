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
  // THE TIE, ABOVE OR BELOW. U+035C is the same tie as U+0361, written
  // underneath when a descender leaves no room above. One thing, two
  // spellings, which is exactly what this table is for. The tie itself is
  // kept: `t͡ʃ` is one affricate and `tʃ` may be two segments meeting.
  '\u{035c}': '\u{0361}',
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
 * NOTHING IS DROPPED ANY MORE.
 *
 * This held `͡`, `͜`, `.` and `‿`, and deleting them was a category error.
 * Normalizing folds the several ways of writing ONE thing into one of them.
 * It does not decide that a thing is unimportant. Every character here said
 * something the source meant:
 *
 *   `.`   the syllable boundary. `ʔeː˧.t͡ɕʰia̯˧.buː˧` states three
 *         syllables, and without it a reader has to guess. Measured at
 *         14,271 deletions in Thai alone.
 *   `‿`   the link between two words spoken as one.
 *   `͡ ͜`  the tie binding two letters into a single segment. `t͡ʃ` is one
 *         affricate and `tʃ` may be a stop meeting a fricative across a
 *         boundary, so dropping the tie merges a distinction the writer
 *         took the trouble to make.
 *
 * They pass through now and the parser reports them, `.` and `‿` as symbols
 * and the tie likewise. The one genuine fold among the four is in `REPLACE`:
 * `͜` and `͡` are two spellings of the same tie, above and below, chosen by
 * whether a descender leaves room. That is the ring-above and ring-below
 * case exactly, and folding it loses nothing.
 */

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
 * The canonical order for the marks that follow a base, DERIVED FROM PHOIBLE
 * rather than chosen.
 *
 * Combining marks that share a Unicode combining class keep their input order
 * under NFD, so `n̪̥` and `n̥̪` stay two different strings for one sound.
 * Worse, the parser matches greedily: one reads as the phone `n̪` plus
 * voiceless, the other as the phone `n̥` plus dental, giving `n$h!` and
 * `nh!$` for the same segment. Sorting the run fixes both.
 *
 * WHICH ORDER TO SORT INTO HAS NO STANDARD. Unicode declines to decide: dental
 * U+032A and voiceless U+0325 are both combining class 220, and NFD only
 * reorders across different classes, so it leaves the two strings distinct and
 * unequal. The IPA Handbook says what each diacritic means and never what
 * sequence to write two of them in.
 *
 * So the order is recovered from the corpus this project already reads.
 * `pnpm derive:mark-order` in mesh walks phoible's 3,142 distinct phoneme
 * spellings, takes one vote per pair of marks stacked on a base, and
 * topologically sorts the result. phoible turned out to be completely
 * self-consistent: 135 pairs decided, NONE written both ways, no cycles.
 *
 * THE EVIDENCE IS UNEVEN AND THE TABLE SHOULD BE READ THAT WAY. `ː` rests on
 * 367 stack observations and `ʰ` on 135, so their positions are solid. The no
 * audible release mark U+031A was stacked ONCE, and its place here is the
 * topological tie-break rather than a fact about phoible. Re-run the
 * derivation rather than hand-editing this, so the two never drift.
 *
 * WHAT IT CHANGED, against the hand-written order it replaces: voiceless now
 * precedes aspiration and syllabic precedes velarization, which is what
 * phoible writes and the reverse of what was here. Welsh `r̥ʰ` and `l̩ˠ` used
 * to come out `rʰ̥` and `lˠ̩`, moving a combining mark onto the modifier
 * letter beside it, where it re-anchors and renders on the wrong glyph.
 */

const MARK_ORDER = [
  '\u{327}', // cedilla
  '\u{32a}', // dental
  '\u{33c}', // linguolabial
  '\u{33a}', // apical
  '\u{33b}', // laminal
  '\u{31f}', // advanced
  '\u{320}', // retracted
  '\u{31d}', // raised
  '\u{31e}', // lowered
  '\u{33d}', // mid-centralized
  '\u{318}', // advanced tongue root
  '\u{319}', // retracted tongue root
  'ᶣ', // labial-palatalized
  '\u{339}', // more rounded
  '\u{31c}', // less rounded
  '\u{32c}', // voiced
  '\u{324}', // breathy
  'ʱ', // murmured
  '\u{330}', // creaky
  'ᴱ', // sphincteric
  '\u{348}', // fortis
  '\u{349}', // lenis
  '\u{353}', // frictionalized
  '\u{325}', // voiceless
  '\u{347}', // non-sibilant
  'ⁿ', // nasal release
  'ˡ', // lateral release
  '\u{31a}', // no audible release
  '\u{329}', // syllabic
  'ʷ', // labialized
  'ʲ', // palatalized
  'ˀ', // glottalized
  '\u{32f}', // non-syllabic
  'ˑ', // half-long
  '\u{306}', // extra-short
  '\u{303}', // nasalized
  '\u{308}', // centralized
  'ˠ', // velarized
  '˞', // rhotic
  'ˤ', // pharyngealized
  '˥', // tone extra-high
  '˦', // tone high
  '˧', // tone mid
  '˨', // tone low
  '˩', // tone extra-low
  '↓', // downstep
  'ʰ', // aspirated
  'ʼ', // ejective
  'ː', // long
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

/**
 * Marks whose place in a run says WHEN, not merely what.
 *
 * Sorting a run is right when the marks describe one moment from several
 * angles. `n̪̥` and `n̥̪` are one sound written two ways, dental and
 * voiceless, both true of the whole segment, so an order has to be picked
 * and either will do.
 *
 * It is wrong the moment a run describes a sequence. These four establish
 * points in time, and every mark between two of them is being timed against
 * them:
 *
 *   `˥ ˦ ˧ ˨ ˩`   pitch targets, in the order the voice reaches them
 *   `↓`           downstep, which lowers everything AFTER it
 *   `ː ˑ`         length, which the marks before and after fall either side
 *   `̆`            extra-short, likewise
 *
 * MEASURED, in the corpus this normalizer runs over. Vietnamese writes its
 * ngã tone `˦ˀ˥`, a rise interrupted by glottalisation partway up. Sorting
 * pulled the `ˀ` to the front of the run and produced `ˀ˦˥`, a catch and
 * then a clean rise, in 2,838 rows. Navajo writes `óː`, the tone on the
 * vowel, and sorting pushed the acute past the length mark to give `oː́`,
 * where the accent now attaches to the `ː` and renders on it, in 3,707 rows
 * across three languages. The two look unrelated and are the same defect.
 *
 * So the run is cut at each anchor and each piece sorted alone. Nothing
 * crosses an anchor, the anchors stay where they were written, and marks
 * that genuinely commute still canonicalise.
 */

const ANCHOR = new Set([
  '˥',
  '˦',
  '˧',
  '˨',
  '˩',
  '↓',
  'ː',
  'ˑ',
  '\u{0306}', // extra-short
])

/** Whether a character attaches to a preceding base rather than standing alone. */
const isAffix = (character: string): boolean =>
  /\p{Mn}|\p{Lm}|\p{Sk}/u.test(character)

const isBase = (character: string): boolean => /\p{L}/u.test(character)

/**
 * One run, sorted between its anchors and never across them.
 *
 * The anchors keep their positions and each stretch between two of them is
 * sorted on its own, so `˦ˀ˥` keeps the glottal where the voice makes it and
 * `óː` keeps the accent on the vowel, while `n̥̪` still canonicalises because
 * neither of its marks is an anchor.
 */

function ordered(run: string[]): string[] {
  const out: string[] = []
  let piece: string[] = []

  for (const character of run) {
    if (ANCHOR.has(character)) {
      out.push(...piece.sort((a, b) => rankOf(a) - rankOf(b)), character)
      piece = []
      continue
    }

    piece.push(character)
  }

  return [...out, ...piece.sort((a, b) => rankOf(a) - rankOf(b))]
}

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
    if (afterBase) run = ordered(run)
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
