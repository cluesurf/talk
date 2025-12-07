import makeTalk from './make/talk'
import makeTalkToIpa from './make/talk/ipa'
import makeIpaToTalk from './make/ipa/talk'
import makeIpaToXSampa from './make/ipa/xsampa'
import syllabify, {
  cluster,
  chunkClusters as chunkRaw,
} from './make/talk/syllables'
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

parse('ayu$ve^ydU')
parse('kUba^llU')
parse('fOla^sOfi')
parse('fOla^sOfirmja')
parse("'lKadami")
parse("'ldjaryu")
parse("'lttazalludju")
parse("'l'alw'hh~i")
parse('sUfI^stUkeItEdanjdxwa')
parse('AmplIfaydrai')
parse('briqketzwaqlOmptzwa')
// parse('AmplIfaydz')
parse('A&_^mplIfaydzoltxahasntayCwa')
parse("'lddarr'dj'ti")

parse("'lK'Qida_ti")

parse("'lGu_lfu")
parse("galf'u")
parse("galf'u'")
parse("galf'u'l")
parse('gaialfsz')
parse('gaiaoilfst')
parse('greIdAotxs')
parse('prvst')
parse("'uHtQ~ubu_tQ~")
parse(['ka', 'hru_', 'dQ~a', "w'", 'i', 'yy'].join(''))
parse(['ka', 'hru_', 'manz', 'i', 'li', 'yy'].join(''))
parse(['la', 'djd', 'ja'].join(''))
parse(['ko_ns', 'arv', 'a_', 'tu', 'wa_r'].join(''))
parse(['marc', 'i', 'ya'].join(''))
parse(['ma', 'sQ~', 'sQ~a_sQ~'].join(''))
parse(['mu', 'dj', 'rim'].join(''))
parse(['ma', 'Hh~al', 'li', 'yy'].join(''))
parse('kIt~a_^b')
parse(['Ku', 'sQ~', 'ru', 'mill'].join(''))
parse(['Ka', 'sQ~', 'riy', 'ya'].join(''))
parse(['KantQ~', 'u_r'].join(''))
parse(['Qidj', 'rim'].join(''))
parse(['ma', 'wrid'].join(''))
parse("'lssamaka_tu 'lbuhh~ayri_a_tu")
parse(`'lliK'hh~u`)
parse(`'lQi_'da_tu`)

// console.log('hello', makeTalk.machine('hello'))

// console.log(
//   'greIdAotxs',
//   simplifyPhonetics('greIdAotxs').map(
//     view => `${view.text} (${view.mass}) = ${view.code}`,
//   ),
// )

// console.log(simplifyPhonetics(`Kad~Q~a_^'`))
parse('u$U^nIq')
parse('bu$U^nIq')
parse('bou$U^nIq')
parse('sa^kOu$')
parse('xakiu$U')
parse('ske^ytbou$dIq')

console.log(makeTalkToIpa('Ci_'))

parse('KantQ~u_r')
parse('mawrid')
parse('fOla^sOfirmja')

function parse(word: string) {
  console.log(word)
  const clusters = cluster(word)
  const syllables = syllabify(clusters)

  // Build syllable text, just join syllables with dashes
  const syllableText = syllables
    .map(syllable => syllable.clusters.map(({ text }) => text).join(''))
    .join(' - ')
  console.log('  syllables:', syllableText)

  // Check if all letters are preserved
  const syllableLetters = syllables
    .flatMap(s => s.clusters)
    .map(c => c.text)
    .join('')
  const wordWithoutSpaces = word.replace(/ /g, '')
  if (syllableLetters !== wordWithoutSpaces) {
    console.log(`  ERROR: Letters missing!`)
    console.log(`    Input (no spaces): "${wordWithoutSpaces}"`)
    console.log(`    Output:            "${syllableLetters}"`)
  }
  console.log(
    '  clusters:',
    clusters.map(({ text }) => text).join(' - '),
  )
  // console.log(
  //   makeTalkToIpa(word),
  //   parseProsody(word).map(makeTalkToIpa).join('-'),
  // )
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
