import chalk from 'chalk'
import makeTalk from './make/talk'
import makeTalkToIpa from './make/talk/ipa'
import makeIpaToTalk from './make/ipa/talk'
import makeIpaToXSampa from './make/ipa/xsampa'
import chunk from './make/talk/syllables'
// import simplifyPhonetics from './make/talk/simplify'

// talk('txando^', 'txandȯ')
// talk('surdjyo^', 'suṙdjyȯ')
// talk('HEth~Ah', 'ḥẹtɦạh')
// talk('siqk', 'siṅk')
// talk('txya@+a-a++u', 'txyá̖àa̋u')
// talk('hwpo$kUi^mUno$s', 'hwpo̤kụïmụno̤s')
// talk('sinho^rEsi', 'sinhȯṙẹsi')
// talk("batO_'aH", 'batọ̄qaḥ')
// talk('aiyuQaK', 'aiyuq̇aḳ')
// talk("s'oQya&te", 'sqoq̇ya̰te')
// talk('t!arEba', 't̖aṙẹba')
// talk('txhaK!EnEba', 'txhaḳ̖ẹnẹba')
// talk('txh~im', 'txɦim')
// talk('txy~h~im', 'txẏɦim')
// talk('mh!im', 'mħim')
// talk('nh!iqh!lh!', 'nħiṅħlħ')
// talk('p*at.', 'p̂aṯ')
// talk('t*et.', 't̬eṯ')
// talk('nulQ~tQ~', 'nul̰t̰')
// talk('b?ad?', 'b̗ad̗')
// talk('p*od*h~U&u$t*ak*el*', 'p̂od̬ɦụ̰rt̬ak̬el̬')
// talk('na/\\q', 'nâṅ')
// talk('na\\\\q', 'ną̏ṅ')

// // talk('diəm˧˩˨')
// // talk('cɤ̆n˧˧')
// // talk('ɲɤ˨˦')
// // talk('uj˧˩˨')
// // talk('è.ɣì.ɣɔ̀')
// // talk('àá.fá')
// // talk('àà.k͡pɔ̃̀') // ?
// // talk('àá.ɾĩ́')
// // talk('āá.sì.kí')
// // talk('áásìkiriìmù')
// // talk('āá.ʃáà.ī.tà')
// // talk('àà.wɛ̀')
// // talk('àà.jò')
// // talk('ʊ̄.mɔ̃̄.lɛ̀')
// // talk('jà.ú.jà.úù')
// // talk('ka̠ɡa̠sʰʌ̹ŋd͡ʑa̠')
// // talk('ˈka̠ːɡa̠ɦa̠da̠')
// // talk('ka̠ɡa̠βo̞βo̞')
// // talk('săw˧˩˨')
// // talk('sɤ̆p˨ˀ˩')
// // talk('ʔɗəwk͡p̚˧˨ʔ')
// // talk('ɑb̥eˈd̥isə')
// // talk('t͡ɕɘ(ː)ŋo̞')
// // talk('t͡ɕʌ̹t̚k͈a̠ɾa̠k̚t͡ɕ͈iɭ')
// // talk('t͡ɕʌ̹pɕ͈i')
// // talk('ˈt͡ɕɘ(ː)mpʰo̞')
// // talk('t͡ɕʌ̹ŋɕʰinɰiɦa̠k̚')
// // talk('t͡ɕʌ̹ŋsʰa̠ŋβwe̞da̠m')
// // talk('ip̚p͈ʌ̹p̚t͡ɕ͈a̠')
// // talk('(ʔ)evoˈlut͡sja')
// // talk('adʁiˈχal')
// ipaToTalk(
//   'k͈o̞ms͈o̞mo̞ɭsʰɯkxɯ-na̠-a̠muɾe̞',
//   'k@oms@omoLsh~OkHO=-na_u&=-a_u&mure',
// )
// ipaToTalk('ɸʷo̞', 'Fw~o')
// ipaToTalk('kxɯnsʰo̞ɾit͡ɕʰida̠', 'kHOnsh~oritxy~h~ida_u&')
// ipaToTalk('kxɯʎʎikʰa̠da̠', 'kHOly~ly~ikh~a_u&da_u&')
// ipaToTalk('ɔ̂ːi̯.on', 'o$_i@on')
// ipaToTalk('kuɾl', 'kurl')

parse('ayu$ve^ydU', 'a - yu$ - ve^y - dU')
parse('kUba^llU', 'kU - ba^l - lU')
parse('fOla^sOfi', 'fO - la^ - sO - fi')
parse('fOla^sOfirmja', 'fO - la^ - sO - firm - ja')
parse("'lKadami", "'l - Ka - da - mi")
parse("'ldjaryu", "'l - djar - yu")
parse("'lttazalludju", "'l - t - ta - zal - lu - dju")
parse("'l'alw'hh~i", "'l - 'alw - 'hh~ - i")
parse(
  'sUfI^stUkeItEdanjdxwa',
  'sU - fI^s - tU - keI - tE - danjd - xwa',
)
parse('AmplIfaydrai', 'Amp - lI - fayd - rai')
parse('briqketzwaqlOmptzwa', 'briq - ketz - wa - qlOmpt - zwa')
// parse('AmplIfaydz')
parse(
  'A&_^mplIfaydzoltxahasntayCwa',
  'A&_^mp - lI - fayd - zol - txa - hasn - tayC - wa',
)
parse("'lddarr'dj'ti", "'l - d - darr - 'dj - 't - i")

parse("'lK'Qida_ti", "'l - K - 'Qi - da_ - ti")

parse("'lGu_lfu", "'l - Gu_l - fu")
parse("galf'u", "galf - 'u")
parse("galf'u'", "galf - 'u'")
parse("galf'u'l", "galf - 'u - 'l")
parse('gaialfsz', 'gai - alfsz')
parse('gaiaoilfst', 'gai - ao - ilfst')
parse('greIdAotxs', 'greI - dAotxs')
parse('prvst', 'prvst')
parse("'uHtQ~ubu_tQ~", "'uH - tQ~u - bu_tQ~")
parse(
  ['ka', 'hru_', 'dQ~a', "w'", 'i', 'yy'].join(''),
  "ka - hru_ - dQ~aw - 'iyy",
)
parse(
  ['ka', 'hru_', 'manz', 'i', 'li', 'yy'].join(''),
  'ka - hru_ - man - zi - liyy',
)
parse(['la', 'djd', 'ja'].join(''), 'ladj - dja')
parse(
  ['ko_ns', 'arv', 'a_', 'tu', 'wa_r'].join(''),
  'ko_n - sar - va_ - tu - wa_r',
)
parse(['marc', 'i', 'ya'].join(''), 'mar - ci - ya')
parse(['ma', 'sQ~', 'sQ~a_sQ~'].join(''), 'masQ~ - sQ~a_sQ~')
parse(['mu', 'dj', 'rim'].join(''), 'mu - djrim')
parse(['ma', 'Hh~al', 'li', 'yy'].join(''), 'ma - Hh~al - liyy')
parse('kIt~a_^b', 'kI - t~a_^b')
parse(['Ku', 'sQ~', 'ru', 'mill'].join(''), 'Ku - sQ~ru - mill')
parse(['Ka', 'sQ~', 'riy', 'ya'].join(''), 'Ka - sQ~riy - ya')
parse(['KantQ~', 'u_r'].join(''), 'Kan - tQ~u_r')
parse(['Qidj', 'rim'].join(''), 'Qi - djrim')
parse(['ma', 'wrid'].join(''), 'maw - rid')
parse(
  "'lssamaka_tu 'lbuhh~ayri_a_tu",
  "'l - s - sa - ma - ka_ - tu - 'l - bu - hh~ay - ri_ - a_ - tu",
)
parse(`'lliK'hh~u`, `'l - liK - 'hh~ - u`)
parse(`'lQi_'da_tu`, `'l - Qi_ - 'd - a_ - tu`)

// console.log('hello', makeTalk.machine('hello'))

// console.log(
//   'greIdAotxs',
//   simplifyPhonetics('greIdAotxs').map(
//     view => `${view.text} (${view.mass}) = ${view.code}`,
//   ),
// )

// console.log(simplifyPhonetics(`Kad~Q~a_^'`))
parse('u$U^nIq', 'u$U^ - nIq')
parse('bu$U^nIq', 'bu$U^ - nIq')
parse('bou$U^nIq', 'bou$ - U^ - nIq')
parse('sa^kOu$', 'sa^ - kOu$')
parse('xakiu$U', 'xa - kiu$ - U')
parse('ske^ytbou$dIq', 'ske^yt - bou$ - dIq')

// console.log('\n' + makeTalkToIpa('Ci_'))

parse('KantQ~u_r', 'Kan - tQ~u_r')
parse('mawrid', 'maw - rid')
parse('fOla^sOfirmja', 'fO - la^ - sO - firm - ja')
parse('paieia', 'pai - ei - a')
parse('txhaqkz', 'txhaqkz')
parse('djrawl', 'djrawl')

// consonant clusters only
parse('twstqknmplzstk', 'twst - qk - nmp - lz - stk')
parse('twstxqkzlnkmplzstk', 'twstx - qkz - ln - kmp - lz - stk')
parse('strwbryndjmpl', 'strwb - rynd - jm - pl')
parse('sgnfkntlyqgmdnzl', 'sg - nf - knt - lyq - gm - dn - zl')

function parse(word: string, expectedSyllables?: string) {
  // Check if there are any errors first
  const { syllables, clusters } = chunk(word)

  // Build syllable text
  const syllableText = syllables
    .map(syllable => syllable.clusters.map(({ text }) => text).join(''))
    .join(' - ')

  // Check for errors
  const syllableLetters = syllables
    .flatMap(s => s.clusters)
    .map(c => c.text)
    .join('')
  const wordWithoutSpaces = word.replace(/ /g, '')
  const hasLetterError = syllableLetters !== wordWithoutSpaces
  const hasSyllableError =
    expectedSyllables && syllableText !== expectedSyllables

  // Print word (bold red if error, bold white otherwise)
  if (hasLetterError) {
    console.log(chalk.bold.red(word), chalk.yellow('(letter mismatch)'))
  } else if (hasSyllableError) {
    console.log(
      chalk.bold.red(word),
      chalk.yellow('(syllable mismatch)'),
    )
  } else {
    console.log(chalk.green(word))
  }

  // Print syllables
  console.log(
    `  ${chalk.gray('syllables:')}  ${syllables
      .map((syllable, i) => {
        const text = syllable.clusters.map(({ text }) => text).join('')
        const color = hasSyllableError ? chalk.red : chalk
        if (i > 0) {
          return `- ${color(text)}`
        }
        return color(text)
      })
      .join(' ')}`,
  )

  if (hasSyllableError) {
    console.log(
      `    ${chalk.gray('desired:')}  ${expectedSyllables
        .split(' - ')
        .map((text, i) => {
          const color = chalk.cyan
          if (i > 0) {
            return `- ${color(text)}`
          }
          return color(text)
        })
        .join(' ')}`,
    )
  }

  // Print clusters
  console.log(
    `   ${chalk.gray('clusters:')}  ${clusters
      .map((cluster, i) => {
        const color = hasLetterError ? chalk.red : chalk
        if (i > 0) {
          return `- ${color(cluster.text)}`
        }
        return color(cluster.text)
      })
      .join(' ')}`,
  )
}

// function talk(a: string, b: string) {
//   const o = makeTalk(a)
//   // console.log(o)
//   o.split('').forEach((x, i) => {
//     if (x !== b[i]) {
//       throw new Error(`${o} with ${x} != ${b[i]}`)
//     }
//   })
// }

// function ipaToTalk(a: string, b: string) {
//   const o = makeIpaToTalk(a)
//   const x = makeIpaToXSampa(a)
//   // console.log(o, x)
//   console.log(a, x)
//   o.split('').forEach((x, i) => {
//     if (x !== b[i]) {
//       throw new Error(`${o} with ${x} != ${b[i]}`)
//     }
//   })
// }
