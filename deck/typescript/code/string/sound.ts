// Talk to sounds.

import { combine } from './combine'
import { codeOf } from '../space/codec'
import { R, modifierAttaches, pickModifier } from './runtime'
import { NO_CODE } from './type'

/**
 * `machine()` reports the tone type at full detail, which is what the
 * flat code always meant.
 */
const TONE = 'tone' as const
const MESH = 'mesh' as const
import type { Modifier, Phone, Sound, SymbolEntry } from './type'

export function makeSound(
  base: Phone,
  mods: Modifier[],
  pre: Modifier[] = [],
): Sound {
  const talk = combine(base.talk, mods, pre)
  const ordered = [...mods].sort((a, b) => a.order - b.order)
  const leading = [...pre].sort((a, b) => b.order - a.order)

  const prefix = ordered.filter(m => m.prefix)
  const suffix = ordered.filter(m => !m.prefix)

  const ipa =
    leading.map(m => m.ipa).join('') +
    prefix.map(m => m.ipa).join('') +
    base.ipa +
    suffix.map(m => m.ipa).join('')

  const simple =
    leading.map(m => m.simple).join('') +
    prefix.map(m => m.simple).join('') +
    base.simple +
    suffix.map(m => m.simple).join('')

  return {
    talk,
    ipa,
    simple,
    machine: codeOf({
      sound: { base, modifiers: ordered },
      type: TONE,
      system: MESH,
    }),
    kind: base.form,
    base,
    modifiers: ordered,
    pre: leading,
    raw: false,
  }
}

function rawSound(entry: SymbolEntry): Sound {
  return {
    talk: entry.talk,
    ipa: entry.ipa,
    simple: entry.simple,
    // A passthrough symbol is not a sound, so it has no code.
    machine: NO_CODE,
    kind: 'symbol',
    modifiers: [],
    pre: [],
    raw: true,
  }
}

// Split a talk string into sounds. A single starter lookup gives the base
// (or a symbol); a base then swallows the modifiers that follow it, and
// the sound is re-emitted in canonical order.
export function segment(text: string): Sound[] {
  const sounds: Sound[] = []

  // Modifiers seen before a base, which modify what FOLLOWS: `h~k` is
  // pre-aspirated, `n~d` prenasalized. No affix spelling is also a starter
  // spelling, so a modifier match here is unambiguous; where both match,
  // the longer one wins, as everywhere else in the scan.
  let leading: Modifier[] = []

  let i = 0

  while (i < text.length) {
    const start = R.talkStarter.matchAt(text, i)
    const startLength = start === undefined ? 0 : R.talkStarter.matchedLength

    const ahead = R.talkModifier.matchAt(text, i)

    const aheadLength =
      ahead === undefined ? 0 : R.talkModifier.matchedLength

    if (ahead !== undefined && aheadLength > startLength) {
      const after = i + aheadLength
      const next = R.talkStarter.matchAt(text, after)
      // Only a pre-modifier if a base actually follows AND can carry it.
      // Without the first check the longer match wins too eagerly: `h!!`
      // is `h` with extra-short, but `h!` is also the voiceless affix, and
      // taking it would leave a stray `!`. Without the second, a mark
      // lands on a base that cannot bear it.
      if (next !== undefined && next.role === 'phone') {
        const modifier = pickModifier(ahead, next.phone.form)

        if (modifier && modifierAttaches(next.phone, modifier)) {
          leading.push(modifier)
          i += aheadLength
          continue
        }
      }
    }

    if (start === undefined) {
      // Unknown character: carry it through so nothing is silently dropped.
      const ch = text[i++]

      sounds.push(rawSound({ talk: ch, ipa: ch, simple: ch }))
      continue
    }

    // `startLength` was captured BEFORE the lookahead below, because
    // `matchAt` stores its result on the trie: probing for a base after a
    // candidate pre-modifier overwrites `matchedLength`, and reading it
    // here would advance by the wrong amount, sometimes by zero.
    i += startLength

    if (start.role === 'phone') {
      const mods: Modifier[] = []

      while (true) {
        const options = R.talkModifier.matchAt(text, i)

        if (options === undefined) {
          break
        }

        // A spelling can mean different things by base form (`@` is
        // non-syllabic on a vowel, syllabic on a consonant), so the base
        // decides which reading applies. A spelling with no reading for
        // this form is not an affix here, and ends the sound.
        const mod = pickModifier(options, start.phone.form)

        if (mod === undefined) {
          break
        }

        // Attachment breaks a TIE here; it does not reject. The rules were
        // written to keep the enumeration conservative, and a parser that
        // enforced them would refuse valid input wherever a phone's
        // features are incomplete.
        //
        // So a mark moves to the following base only when that base can
        // carry it and this one cannot: `sh~k` is `s` then pre-aspirated
        // `k`, while `lQ~h!` keeps its voiceless mark because nothing
        // follows to take it.
        if (!modifierAttaches(start.phone, mod)) {
          const after = R.talkStarter.matchAt(text, i + R.talkModifier.matchedLength)

          if (
            after !== undefined &&
            after.role === 'phone' &&
            modifierAttaches(after.phone, mod)
          ) {
            break
          }
        }

        mods.push(mod)
        i += R.talkModifier.matchedLength
      }

      sounds.push(makeSound(start.phone, mods, leading))
      leading = []
    } else if (start.role === 'symbol') {
      sounds.push(rawSound(start.symbol))
    }
  }

  // A pre-modifier with nothing after it modifies nothing. Carry the
  // spelling through rather than dropping it, so a caller sees the input
  // was incomplete instead of losing it silently.
  for (const modifier of leading) {
    sounds.push(
      rawSound({
        talk: modifier.talk,
        ipa: modifier.ipa,
        simple: modifier.simple,
      }),
    )
  }

  return sounds
}
