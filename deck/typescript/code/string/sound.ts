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
/**
 * The modifiers inside one pair of brackets, or null when the contents are
 * not a clean run of them.
 *
 * ORDER IS FREE ON THE WAY IN. `combine` writes the canonical order, so a
 * stored sound has one spelling, but a person typing `k<hw>` and a person
 * typing `k<wh>` mean the same thing and both should parse. This is the same
 * contract the IPA side already has, where `n̪̥` and `n̥̪` both read and one
 * comes back.
 *
 * NULL RATHER THAN A PARTIAL READ. Anything unrecognised inside the brackets
 * means the whole run is not talk, and the caller carries the characters
 * through untouched instead of keeping the half it understood.
 */

function readRun(
  run: string,
  form: 'consonant' | 'vowel',
): Modifier[] | null {
  if (!run) {
    return null
  }

  const out: Modifier[] = []
  let at = 0

  while (at < run.length) {
    const options = R.talkModifier.matchAt(run, at)

    if (options === undefined) {
      return null
    }

    const one = pickModifier(options, form)

    if (one === undefined) {
      return null
    }

    out.push(one)
    at += R.talkModifier.matchedLength
  }

  return out.length ? out : null
}

/**
 * The span of a bracketed modifier run starting at `at`, or null.
 *
 * A SCAN, NOT A SEARCH. This read `indexOf('>')`, which finds a closing
 * bracket anywhere ahead: a stray `<` with its match far downstream would
 * swallow every sound between them and hand the contents to the modifier
 * reader as one run. Walking forward instead stops at the first character
 * that cannot be inside a run, so an unclosed `<` fails here and is carried
 * through as an ordinary character rather than eating the rest of the word.
 *
 * Runs do not nest. A `<` inside one is malformed, not a sub-run, so it ends
 * the attempt rather than opening a second.
 */

function runSpan(text: string, at: number): { body: string; end: number } | null {
  if (text[at] !== '<') {
    return null
  }

  let index = at + 1

  while (index < text.length) {
    const one = text[index]

    if (one === '>') {
      return index === at + 1
        ? null
        : { body: text.slice(at + 1, index), end: index + 1 }
    }

    if (one === '<') {
      return null
    }

    index += 1
  }

  return null
}

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

    // A BRACKETED RUN BEFORE A BASE is the pre-modifiers, `<h>k` for
    // pre-aspirated. Read whole, then split into tokens, so the scan below
    // never sees a `<` or a `>`.
    if (startLength === 0) {
      const span = runSpan(text, i)

      if (span) {
        const next = R.talkStarter.matchAt(text, span.end)

        if (next !== undefined && next.role === 'phone') {
          const held = readRun(span.body, next.phone.form)

          if (held) {
            leading.push(...held)
            i = span.end
            continue
          }
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

      // A BRACKETED RUN AFTER A BASE carries every modifier on it, in one
      // pair. `k<wh>` is labialized and aspirated. The contents are
      // uniquely decodable, so no separator is needed inside.
      const span = runSpan(text, i)

      if (span) {
        const held = readRun(span.body, start.phone.form)

        if (held) {
          sounds.push(makeSound(start.phone, held, leading))
          leading = []
          i = span.end
          continue
        }
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
