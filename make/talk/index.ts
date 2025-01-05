import st from '@lancejpollard/script-tree'

// https://en.wikipedia.org/wiki/Hangul_Syllables

const HANGUL_START = 0xac00
const HANGUL_END = 0xd7a3
let X = HANGUL_START

const m = {
  u: {
    grave: '\u0300',
    acute: '\u0301',
    dacute: '\u030B',
    dgrave: '\u030F',
    up: '\u0302',
    down: '\u030C',
    dot: '\u0307',
    ddot: '\u0308',
    ring: '\u030A',
    tilde: '\u0303',
    macron: '\u0304',
    hook: '\u0309',
  },
  d: {
    grave: '\u0316',
    acute: '\u0317',
    ring: '\u0325',
    dot: '\u0323',
    ddot: '\u0324',
    down: '\u032C',
    tilde: '\u0330',
    macron: '\u0331',
    cedilla: '\u0327',
    up: '\u032D',
    hook: '\u0328',
  },
}

const D: Record<string, string> = {
  '--': m.u.dgrave,
  '-': m.u.grave,
  '++': m.u.dacute,
  '+': m.u.acute,
  '//': `${m.d.hook}${m.u.dacute}`, // rising 2 (vietnamese ngã)
  '/': `${m.d.hook}${m.u.acute}`, // rising (vietnamese sắc)
  '\\/': m.u.down, // falling rising (vietnamese hỏi)
  '/\\': m.u.up, // rising falling
  '\\\\': `${m.d.hook}${m.u.dgrave}`, // falling 2 (vietnamese nặng)
  '\\': `${m.d.hook}${m.u.grave}`, // falling (vietnamese huyền)
  '^': m.u.dot, // accent/stress mark
  $: m.d.ddot,
  '&': m.d.tilde,
  _: m.u.macron, // long vowel
  '@': m.d.grave, // non-syllabic
  '!': m.d.macron, // short vowel
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

export type Take = {
  i: string
  x: string
  o: string
  name?: string
  o2?: string
}

export const VOWELS: Array<Take> = []

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
              const x = g.match(/i/i) && a === '^' ? 'ï' : G[g]
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
  { i: '@', x: '켐', o: `@` },
  { i: 'h~', x: '켑', o: `ɦ` },
  { i: 'm', x: '켒', o: `m` },
  { i: 'N', x: '켓', o: `n${m.d.dot}` },
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
]

export const GLYPHS = [
  ...VOWELS,
  ...CONSONANTS,
  ...SYMBOLS,
  ...NUMERALS,
]

// LAST used is U+CF82, so can continue from there.

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
const tree = st.fork(GLYPHS)
// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
const make = (text: string): string => st.form(text, tree)

make.inputs = (text: string): Array<string> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  st.list(text, tree).map((x: any) => x.i)

make.readableOutput = (text: string): Array<string> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  st.list(text, tree).map((x: any) => x.o)

make.readable = (text: string): string =>
  make.readableOutput(text).join('')

make.machineOutputs = (text: string): Array<string> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  st.list(text, tree).map((x: any) => x.x)

make.machine = (text: string): string =>
  make.machineOutputs(text).join('')

export default make

function getNextGlyph() {
  return String.fromCodePoint(X++)
}
