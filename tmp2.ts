import talk from '~/make'
import { loadMappings } from '~/test/helper'

const esc = (s: string) => s.replace(/\\/g,'\\\\').replace(/_/g,'\\_').replace(/\*/g,'\\*').replace(/~/g,'\\~').replace(/\|/g,'\\|')

function row(ipa: string, t: string) {
  let simp='', mach=''
  try { simp = talk.readable(t) } catch { simp='?' }
  try { mach = talk.machine(t) } catch { mach='?' }
  return `| ${ipa||' '} | ${esc(t)} | ${simp} | ${mach} |`
}

const m = loadMappings()
console.log('=== EXAMPLES ===')
const ex = ['txando^','surdjyo^','HEth~Ah','siqk','txya@+a-a++u','hwpo$kUi^mUno$s','sinho^rEsi',"batO_'aH",'aiyuQaK',"s'oQya&te",'t!arEba','txhaK!EnEba','txh~im','txy~h~im','mh!im']
console.log('| ascii | simplified | hangul |')
console.log('| :-- | :-- | :-- |')
for (const a of ex) { let s,h; try{s=talk.readable(a)}catch{s='?'} try{h=talk.machine(a)}catch{h='?'} console.log(`| ${esc(a)} | ${s} | ${h} |`) }

console.log('\n=== CONSONANTS ('+Object.keys(m.consonants).length+') ===')
console.log('| IPA | ascii | simplified | hangul |')
console.log('| :-- | :-- | :-- | :-- |')
for (const [ipa,t] of Object.entries(m.consonants)) console.log(row(ipa,t))

console.log('\n=== VOWELS ('+Object.keys(m.vowels).length+') ===')
console.log('| IPA | ascii | simplified | hangul |')
console.log('| :-- | :-- | :-- | :-- |')
for (const [ipa,t] of Object.entries(m.vowels)) console.log(row(ipa,t))
