// Talk to sounds.

import { combine } from './combine'
import { R } from './runtime'
import type { Modifier, Phone, Sound, SymbolEntry } from './type'

export function makeSound(base: Phone, mods: Modifier[]): Sound {
  const talk = combine(base.talk, mods)
  const ordered = [...mods].sort((a, b) => a.order - b.order)

  const prefix = ordered.filter(m => m.prefix)
  const suffix = ordered.filter(m => !m.prefix)

  const ipa =
    prefix.map(m => m.ipa).join('') +
    base.ipa +
    suffix.map(m => m.ipa).join('')

  const simple =
    prefix.map(m => m.simple).join('') +
    base.simple +
    suffix.map(m => m.simple).join('')

  return {
    talk,
    ipa,
    simple,
    machine: R.machineByTalk.get(talk) ?? '',
    kind: base.kind,
    base,
    modifiers: ordered,
    raw: false,
  }
}

function rawSound(entry: SymbolEntry): Sound {
  return {
    talk: entry.talk,
    ipa: entry.ipa,
    simple: entry.simple,
    machine: R.machineByTalk.get(entry.talk) ?? '',
    kind: 'symbol',
    modifiers: [],
    raw: true,
  }
}

// Split a talk string into sounds. A single starter lookup gives the base
// (or a symbol); a base then swallows the modifiers that follow it, and
// the sound is re-emitted in canonical order.
export function segment(text: string): Sound[] {
  const sounds: Sound[] = []

  let i = 0

  while (i < text.length) {
    const start = R.talkStarter.matchAt(text, i)

    if (start === undefined) {
      // Unknown character: carry it through so nothing is silently dropped.
      const ch = text[i++]

      sounds.push(rawSound({ talk: ch, ipa: ch, simple: ch }))
      continue
    }

    i += R.talkStarter.matchedLength

    if (start.role === 'phone') {
      const mods: Modifier[] = []

      while (true) {
        const mod = R.talkModifier.matchAt(text, i)

        if (mod === undefined) {
          break
        }

        mods.push(mod)
        i += R.talkModifier.matchedLength
      }

      sounds.push(makeSound(start.phone, mods))
    } else if (start.role === 'symbol') {
      sounds.push(rawSound(start.symbol))
    }
  }

  return sounds
}
