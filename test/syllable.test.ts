// Syllabification of Talk words. Migrated from the old top-level
// `test.ts` visual runner into real assertions: every case checks
// that (a) the clusters preserve every letter of the input and
// (b) the syllable split matches the expected `a - b - c` shape.

import { describe, expect, it } from 'vitest'
import chunk from '~/code/syllables'

// [word, expected syllables joined with ' - ']
const CASES: [string, string][] = [
  ['ayu$ve^ydU', 'a - yu$ - ve^y - dU'],
  ['kUba^llU', 'kU - ba^l - lU'],
  ['fOla^sOfi', 'fO - la^ - sO - fi'],
  ['fOla^sOfirmja', 'fO - la^ - sO - firm - ja'],
  ["'lKadami", "'l - Ka - da - mi"],
  ["'ldjaryu", "'l - djar - yu"],
  ["'lttazalludju", "'lt - ta - zal - lu - dju"],
  ["'l'alw'hh~i", "'l - 'alw - 'hh~ - i"],
  ['sUfI^stUkeItEdanjdxwa', 'sU - fI^s - tU - keI - tE - danjd - xwa'],
  ['AmplIfaydrai', 'Amp - lI - fayd - rai'],
  ['briqketzwaqlOmptzwa', 'briq - ketz - wa - qlOmpt - zwa'],
  [
    'A&_^mplIfaydzoltxahasntayCwa',
    'A&_^mp - lI - fayd - zol - txa - hasn - tayC - wa',
  ],
  ["'lddarr'dj'ti", "'ld - darr - 'dj - 't - i"],
  ["'lK'Qida_ti", "'l - K - 'Qi - da_ - ti"],
  ["'lGu_lfu", "'l - Gu_l - fu"],
  ["galf'u", "galf - 'u"],
  ["galf'u'", "galf - 'u'"],
  ["galf'u'l", "galf - 'u - 'l"],
  ['gaialfsz', 'gai - alfsz'],
  ['gaiaoilfst', 'gai - ao - ilfst'],
  ['greIdAotxs', 'greI - dAotxs'],
  ['prvst', 'prvst'],
  ["'uHtQ~ubu_tQ~", "'uH - tQ~u - bu_tQ~"],
  ["kahru_dQ~aw'iyy", "ka - hru_ - dQ~aw - 'iyy"],
  ['kahru_manziliyy', 'ka - hru_ - man - zi - liyy'],
  ['ladjdja', 'ladj - dja'],
  ['ko_nsarva_tuwa_r', 'ko_n - sar - va_ - tu - wa_r'],
  ['marciya', 'mar - ci - ya'],
  ['masQ~sQ~a_sQ~', 'masQ~ - sQ~a_sQ~'],
  ['mudjrim', 'mu - djrim'],
  ['maHh~alliyy', 'ma - Hh~al - liyy'],
  ['kIt~a_^b', 'kI - t~a_^b'],
  ['KusQ~rumill', 'Ku - sQ~ru - mill'],
  ['KasQ~riyya', 'Ka - sQ~riy - ya'],
  ['KantQ~u_r', 'Kan - tQ~u_r'],
  ['Qidjrim', 'Qi - djrim'],
  ['mawrid', 'maw - rid'],
  [
    "'lssamaka_tu 'lbuhh~ayri_a_tu",
    "'ls - sa - ma - ka_ - tu - 'l - bu - hh~ay - ri_ - a_ - tu",
  ],
  ["'lliK'hh~u", "'l - liK - 'hh~ - u"],
  ["'lQi_'da_tu", "'l - Qi_ - 'd - a_ - tu"],
  ['u$U^nIq', 'u$U^ - nIq'],
  ['bu$U^nIq', 'bu$U^ - nIq'],
  ['bou$U^nIq', 'bou$ - U^ - nIq'],
  ['sa^kOu$', 'sa^ - kOu$'],
  ['xakiu$U', 'xa - kiu$ - U'],
  ['ske^ytbou$dIq', 'ske^yt - bou$ - dIq'],
  ['fOla^sOfirmja', 'fO - la^ - sO - firm - ja'],
  ['paieia', 'pai - ei - a'],
  ['txhaqkz', 'txhaqkz'],
  ['djrawl', 'djrawl'],
  // consonant clusters only
  ['twstqknmplzstk', 'twst - qk - nmp - lz - stk'],
  ['twstxqkzlnkmplzstk', 'twstx - qkz - ln - kmp - lz - stk'],
  ['strwbryndjmpl', 'strwb - rynd - jm - pl'],
  ['sgnfkntlyqgmdnzl', 'sg - nf - knt - lyq - gmd - nz - l'],
]

function syllableText(word: string): string {
  const { syllables } = chunk(word)

  return syllables
    .map(s => s.clusters.map(({ text }) => text).join(''))
    .join(' - ')
}

function letters(word: string): string {
  const { syllables } = chunk(word)

  return syllables
    .flatMap(s => s.clusters)
    .map(c => c.text)
    .join('')
}

describe('syllabification preserves every letter', () => {
  it.each(CASES)('%s', word => {
    expect(letters(word)).toBe(word.replace(/ /g, ''))
  })
})

describe('syllabification splits at the expected boundaries', () => {
  it.each(CASES)('%s', (word, expected) => {
    expect(syllableText(word)).toBe(expected)
  })
})
