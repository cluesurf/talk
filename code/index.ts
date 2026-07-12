import st from '@lancejpollard/script-tree'
import { m } from './constants'

// https://en.wikipedia.org/wiki/Hangul_Syllables
// LAST used is U+CF82, so can continue from there.

const HANGUL_START = 0xac00
// const HANGUL_END = 0xd7a3
const HANGUL_ALLOWED_END_FOR_BASE_TONES = 0xcfff

let HANGUL_CODE = HANGUL_START

const D: Record<string, string> = {
  '--': m.u.dgrave!,
  '-': m.u.grave!,
  '++': m.u.dacute!,
  '+': m.u.acute!,
  '//': `${m.d.hook}${m.u.dacute}`, // rising 2 (vietnamese ngã)
  '/': `${m.d.hook}${m.u.acute}`, // rising (vietnamese sắc)
  '\\/': m.u.down!, // falling rising (vietnamese hỏi)
  '/\\': m.u.up!, // rising falling
  '\\\\': `${m.d.hook}${m.u.dgrave}`, // falling 2 (vietnamese nặng)
  '\\': `${m.d.hook}${m.u.grave}`, // falling (vietnamese huyền)
  '^': m.u.dot!, // accent/stress mark
  $: m.d.ddot!,
  '&': m.d.tilde!,
  _: m.u.macron!, // long vowel
  '@': m.d.grave!, // non-syllabic
  '!': m.d.macron!, // short vowel
  '': '',
}

const G: Record<string, string> = {
  I: `i${m.d.dot}`,
  E: `e${m.d.dot}`,
  A: `a${m.d.dot}`,
  O: `o${m.d.dot}`,
  U: `u${m.d.dot}`,
  i: `i`,
  e: `e`,
  a: `a`,
  o: `o`,
  u: `u`,
}

export interface Take {
  i: string
  x: string
  o: string
  name?: string
  o2?: string
}

export const VOWELS: Take[] = []

export const BASE_VOWEL_GLYPHS = [
  'I',
  'E',
  'A',
  'O',
  'U',
  'i',
  'e',
  'a',
  'o',
  'u',
]
export const TONE_MARKS = [
  '--',
  '-',
  '++',
  '+',
  '/',
  '//',
  '\\/',
  '/\\',
  '\\\\',
  '\\',
  '',
]
export const VARIANT_MARKS = ['$', '']
export const NASAL_MARKS = ['&', '']
export const DURATION_MARKS = ['_', '!', '']
export const SYLLABIC_MARKS = ['@', '']
export const ACCENT_MARKS = ['^', '']

BASE_VOWEL_GLYPHS.forEach(g => {
  ACCENT_MARKS.forEach(a => {
    DURATION_MARKS.forEach(l => {
      SYLLABIC_MARKS.forEach(s => {
        NASAL_MARKS.forEach(n => {
          VARIANT_MARKS.forEach(v => {
            TONE_MARKS.forEach(t => {
              const i = `${g}${v}${n}${s}${t}${l}${a}`
              const x = /i/i.exec(g) && a === '^' ? 'ï' : G[g]
              const y = x === 'ï' ? '' : D[a]
              const x2 = v === '$' && x === 'u' ? 'r' : x
              const v2 = v === '$' && g === 'u' ? '' : `${D[v]}`
              const o =
                l === '!'
                  ? `${x2}${y}${D[l]}${D[n]}${D[s]}${D[t]}${v2}`
                  : `${x2}${D[l]}${D[n]}${D[s]}${D[t]}${v2}${y}`
              VOWELS.push({ i, x: getNextGlyph(), o })
            })
          })
        })
      })
    })
  })
})

export const SYMBOLS = [
  { i: '=.', x: '콴', o: '.' },
  { i: '=?', x: '콵', o: '?' },
  { i: '=!', x: '콶', o: '!' },
  { i: '=+', x: '콷', o: '+' },
  { i: '=-', x: '콸', o: '-' },
  { i: '>', x: '콹', o: '>' },
  { i: '<', x: '콺', o: '<' },
  { i: '/', x: '콻', o: '/' },
  { i: '\\', x: '콼', o: '\\' },
  { i: '|', x: '콽', o: '|' },
  { i: '(', x: '콾', o: '(' },
  { i: ')', x: '콿', o: ')' },
  { i: '[', x: '쾀', o: '[' },
  { i: ']', x: '쾁', o: ']' },
  { i: ' ', x: '쾂', o: ' ' },
]

export const NUMERALS = [
  { i: '0', x: '콪', o: '0' },
  { i: '1', x: '콫', o: '1' },
  { i: '2', x: '콬', o: '2' },
  { i: '3', x: '콭', o: '3' },
  { i: '4', x: '콮', o: '4' },
  { i: '5', x: '콯', o: '5' },
  { i: '6', x: '콰', o: '6' },
  { i: '7', x: '콱', o: '7' },
  { i: '8', x: '콲', o: '8' },
  { i: '9', x: '콳', o: '9' },
]

export const CONSONANTS = [
  // { i: '@', x: '켐', o: `@` },
  { i: 'h~', x: '켑', o: `ɦ` },
  { i: 'm', x: '켒', o: `m` },
  { i: 'N', x: '켓', o: `n${m.d.dot}` },
  { i: 'n~', x: '쾃', o: `n` },
  { i: 'n', x: '켔', o: `n` },
  { i: 'q', x: '켕', o: `n${m.u.dot}` },
  { i: 'G~', x: '켖', o: `g${m.u.tilde}` },
  { i: 'G', x: '켗', o: `g${m.u.dot}` },
  { i: 'g?', x: '켘', o: `g${m.u.grave}` },
  { i: 'g', x: '켙', o: `g` },
  { i: "'", x: '켚', o: `'` },
  { i: 'Q', x: '켛', o: `q${m.u.dot}` },
  { i: 'd~Q~', x: '켜', o: `d${m.d.tilde}` },
  { i: 'd~', x: '켝', o: `d` },
  { i: 'd?', x: '켞', o: `d${m.d.grave}` },
  { i: 'd!', x: '켟', o: `d${m.d.acute}` },
  { i: 'd*', x: '켠', o: `d${m.d.down}` },
  { i: 'd.', x: '켡', o: `d${m.d.macron}` },
  { i: 'D', x: '켢', o: `d${m.d.dot}` },
  { i: 'dQ~', x: '켣', o: `d${m.d.tilde}` },
  { i: 'd', x: '켤', o: `d` },
  { i: 'b?', x: '켥', o: `b${m.d.grave}` },
  { i: 'b!', x: '켦', o: `b${m.d.acute}` },
  { i: 'b', x: '켧', o: `b` },
  { i: 'p!', x: '켨', o: `p${m.u.acute}` },
  { i: 'p*', x: '켩', o: `p${m.u.up}` },
  { i: 'p.', x: '켪', o: `t${m.u.macron}` },
  { i: 'p@', x: '켫', o: `x${m.u.down}` },
  { i: 'p', x: '켬', o: `p` },
  { i: 't~Q~', x: '켭', o: `t${m.d.tilde}` },
  { i: 't~', x: '켮', o: `t` },
  { i: 'T!', x: '켯', o: `t${m.d.dot}${m.d.acute}` },
  { i: 'T', x: '켰', o: `t${m.d.dot}` },
  { i: 't!', x: '켱', o: `t${m.d.acute}` },
  { i: 't*', x: '켲', o: `t${m.d.down}` },
  { i: 'tQ~', x: '켳', o: `t${m.d.tilde}` },
  { i: 't@', x: '켴', o: `t${m.d.up}` },
  { i: 't.', x: '켵', o: `t${m.d.macron}` },
  { i: 't', x: '켶', o: `t` },
  { i: 'k!', x: '켷', o: `k${m.d.acute}` },
  { i: 'k.', x: '켸', o: `k${m.d.macron}` },
  { i: 'k*', x: '켹', o: `k${m.d.down}` },
  { i: 'K!', x: '켺', o: `k${m.d.dot}${m.d.acute}` },
  { i: 'K', x: '켻', o: `k${m.d.dot}` },
  { i: 'k', x: '켼', o: `k` },
  { i: 'H!', x: '켽', o: `h${m.d.dot}${m.d.acute}` },
  { i: 'H', x: '켾', o: `h${m.d.dot}` },
  { i: 'h!', x: '켿', o: `ħ` },
  { i: 'h', x: '콀', o: `h` },
  { i: 'J', x: '콁', o: `ȷ̈` },
  { i: 'j!', x: '콂', o: `j${m.u.acute}` },
  { i: 'j', x: '콃', o: `j` },
  { i: 'S!', x: '콄', o: `s${m.d.dot}${m.u.acute}` },
  { i: 's!', x: '콅', o: `s${m.u.acute}` },
  { i: 'S', x: '콆', o: `s${m.d.dot}` },
  { i: 'sQ~', x: '콇', o: `s${m.d.tilde}` },
  { i: 's@', x: '콈', o: `s${m.d.up}` },
  { i: 's', x: '콉', o: `s` },
  { i: 'F', x: '콊', o: `f${m.d.dot}` },
  { i: 'f!', x: '콋', o: `f${m.d.acute}` },
  { i: 'f', x: '콌', o: `f` },
  { i: 'V', x: '콍', o: `v${m.d.dot}` },
  { i: 'v', x: '콎', o: `v` },
  { i: 'z!', x: '콏', o: `z${m.u.acute}` },
  { i: 'zQ~', x: '콐', o: `z${m.d.tilde}` },
  { i: 'z', x: '콑', o: `z` },
  { i: 'Z!', x: '콒', o: `z${m.d.dot}${m.u.acute}` },
  { i: 'Z', x: '콓', o: `z${m.d.dot}` },
  { i: 'CQ~', x: '코', o: `c${m.d.dot}${m.u.tilde}` },
  { i: 'C', x: '콕', o: `c${m.d.dot}` },
  { i: 'cQ~', x: '콖', o: `c${m.u.tilde}` },
  { i: 'c', x: '콗', o: `c` },
  { i: 'L', x: '콘', o: `l${m.d.dot}` },
  { i: 'l*', x: '콙', o: `l${m.d.down}` },
  { i: 'lQ~', x: '콚', o: `l${m.d.tilde}` },
  { i: 'l', x: '콛', o: `l` },
  { i: 'R', x: '콜', o: `r${m.d.dot}` },
  { i: 'rQ~', x: '콝', o: `r${m.u.tilde}` },
  { i: 'r', x: '콞', o: `r${m.u.dot}` },
  { i: 'x!', x: '콟', o: `x${m.u.acute}` },
  { i: 'X!', x: '콠', o: `x${m.d.dot}${m.u.acute}` },
  { i: 'X', x: '콡', o: `x${m.d.dot}` },
  { i: 'x@', x: '콢', o: `x${m.d.up}` },
  { i: 'x', x: '콣', o: `x` },
  { i: 'W', x: '콤', o: `w${m.u.dot}` },
  { i: 'w!', x: '콥', o: `w${m.u.acute}` },
  { i: 'w~', x: '콦', o: `w${m.d.dot}` },
  { i: 'w', x: '콧', o: `w` },
  { i: 'y~', x: '콨', o: `y${m.u.dot}` },
  { i: 'y', x: '콩', o: `y` },
  // Precomposed letters that `makeIpaToTalk` emits for real chart
  // phones but had no glyph, so `machine()` threw on them. The dental
  // `~`, ejective `!`, and implosion `?` are suffix-only marks, so
  // each base+feature needs its own glyph (following `t~`, `f!`,
  // `b?`). Hangul continues the consonant block from U+CF84.
  { i: 'b~', x: '쾄', o: `b` }, // b̪
  { i: 'p~', x: '쾅', o: `p` }, // p̪
  { i: 'm~', x: '쾆', o: `m` }, // ɱ
  { i: 's~', x: '쾇', o: `s` }, // s̪
  { i: 'z~', x: '쾈', o: `z` }, // z̪
  { i: 'l~', x: '쾉', o: `l` }, // l̪
  { i: 'S~', x: '쾊', o: `s${m.d.dot}` }, // ɬ̪
  { i: 't?', x: '쾋', o: `t${m.d.grave}` }, // ɗ̥
  { i: 'c!', x: '쾌', o: `c${m.u.acute}` }, // θʼ
  { i: 'F!', x: '쾍', o: `f${m.d.dot}${m.u.acute}` }, // ɸʼ
  { i: 'ky~!', x: '쾎', o: `ky${m.u.dot}${m.d.acute}` }, // cʼ
  { i: 'xy~!', x: '쾏', o: `xy${m.u.dot}${m.u.acute}` }, // ɕʼ
  { i: 'c*', x: '쾐', o: `c${m.d.down}` }, // 𝼊 retroflex click
  { i: 'K*', x: '쾑', o: `k${m.d.dot}${m.d.down}` }, // ʞ velar click
]

// Every consonant modifier (aspiration, palatalization, dental,
// voiceless, ...) should collapse onto its base as a SINGLE glyph, so
// `machine()` emits one Hangul code point per sound. Rather than hand
// listing each combination, generate them: take each base letter above,
// apply the modifier suffixes `makeIpaToTalk` can emit, and assign the
// next free Hangul code point. The readable form is composed from the
// base plus modifier glyphs, so it stacks the same diacritics.

// The atomic base letters (single sounds), including the doubled
// trills, in the spirit of `BASE_VOWEL_GLYPHS`.
const CONSONANT_BASE_INPUTS = [
  'm', 'n', 'N', 'q', 'g', 'k', 'b', 'p', 'd', 't', 'T', 'D',
  's', 'z', 'x', 'j', 'X', 'J', 'f', 'v', 'c', 'C', 'h', 'H',
  'l', 'L', 'r', 'R', 'w', 'y', 'G', 'Q', "'", 'W', 'F', 'V',
  'Z', 'S', 'b?', 'd?', 'g?', 'bb', 'GG', 'Rr',
]

// Modifier-suffix combinations `makeIpaToTalk` can emit (empty = the
// bare base, then singles and the common voiceless stacks). Applied to
// every base, so any modified consonant collapses onto one glyph.
const CONSONANT_MODIFIER_INPUTS = [
  '', 'h!', '~', '~h!', 'y~', 'y~h!', 'w~', 'w~h!', 'G~', 'G~h!',
  'h~', 'h~h!', 'Q~', 'Q~h!', '!', '?', '@', '.',
]

// Next free Hangul code point after the hand-assigned consonant block.
let CONSONANT_CODE =
  Math.max(...CONSONANTS.map(glyph => glyph.x.codePointAt(0)!)) + 1
const USED_CODES = new Set(
  [...VOWELS, ...CONSONANTS, ...SYMBOLS, ...NUMERALS].map(glyph =>
    glyph.x.codePointAt(0),
  ),
)

function getNextConsonantGlyph() {
  while (USED_CODES.has(CONSONANT_CODE)) {
    CONSONANT_CODE++
  }
  const glyph = String.fromCodePoint(CONSONANT_CODE)
  USED_CODES.add(CONSONANT_CODE)
  CONSONANT_CODE++
  return glyph
}

// Readable lookup: the base glyphs above, plus the suffix-only feature
// marks that have no standalone glyph. Longest key wins so `Q~` beats
// `Q` and `b?` beats `b`.
const READABLE_BY_INPUT = new Map(
  CONSONANTS.map(glyph => [glyph.i, glyph.o]),
)
READABLE_BY_INPUT.set('Q~', `${m.d.tilde}`)
READABLE_BY_INPUT.set('~', '')
READABLE_BY_INPUT.set('@', `${m.d.up}`)
READABLE_BY_INPUT.set('!', `${m.d.acute}`)
READABLE_BY_INPUT.set('?', `${m.d.grave}`)
READABLE_BY_INPUT.set('.', `${m.d.macron}`)
const INPUTS_LONGEST_FIRST = [...READABLE_BY_INPUT.keys()].sort(
  (a, b) => b.length - a.length,
)

function composeConsonantReadable(input: string) {
  let out = ''
  let i = 0
  outer: while (i < input.length) {
    for (const key of INPUTS_LONGEST_FIRST) {
      if (key && input.startsWith(key, i)) {
        out += READABLE_BY_INPUT.get(key)
        i += key.length
        continue outer
      }
    }
    // Should not happen: every generated input is base + known modifiers.
    return input
  }
  return out
}

// Trills whose voiceless form voices each element (ɽ̊r̥ -> Rh!rh!) do
// not fit base + suffix, so they are listed as extras.
const CONSONANT_EXTRA_INPUTS = ['Rh!rh!']

const CONSONANT_SEEN = new Set(CONSONANTS.map(glyph => glyph.i))

function addGeneratedConsonant(input: string) {
  if (CONSONANT_SEEN.has(input)) {
    return
  }
  CONSONANT_SEEN.add(input)
  CONSONANTS.push({
    i: input,
    x: getNextConsonantGlyph(),
    o: composeConsonantReadable(input),
  })
}

for (const base of CONSONANT_BASE_INPUTS) {
  for (const modifier of CONSONANT_MODIFIER_INPUTS) {
    addGeneratedConsonant(base + modifier)
  }
}

for (const input of CONSONANT_EXTRA_INPUTS) {
  addGeneratedConsonant(input)
}

export const GLYPHS = [
  ...VOWELS,
  ...CONSONANTS,
  ...SYMBOLS,
  ...NUMERALS,
]

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
const tree = st.fork(GLYPHS)
// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
const talk = (text: string): string => st.form(text, tree)

talk.inputs = (text: string): string[] =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  st.list(text, tree).map((x: any) => x.i)

talk.readableOutput = (text: string): string[] =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  st.list(text, tree).map((x: any) => x.o)

talk.readable = (text: string): string =>
  talk.readableOutput(text).join('')

talk.machineOutputs = (text: string): string[] =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  st.list(text, tree).map((x: any) => x.x)

talk.machine = (text: string): string =>
  talk.machineOutputs(text).join('')

export default talk

function getNextGlyph() {
  if (HANGUL_CODE > HANGUL_ALLOWED_END_FOR_BASE_TONES) {
    throw new Error(
      `Exceeded available Hangul code points for base tones (max: ${HANGUL_ALLOWED_END_FOR_BASE_TONES})`,
    )
  }
  return String.fromCodePoint(HANGUL_CODE++)
}

// `HANGUL_CODE` ends at 삠, last time I checked on 2025/12/06

// console.log(VOWELS.length) => 5280
