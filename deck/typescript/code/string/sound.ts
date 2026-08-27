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

/**
 * Read a bracketed modifier run.
 *
 * `base` is the phone the run FOLLOWS, and is given only in that position.
 * A run written after a base is claiming those marks belong to it, and a
 * mark whose `attaches` rule rules that out means the claim is wrong: the
 * run is really the leading run of whatever comes next. Returning null says
 * so, and the caller falls through to the leading reading.
 *
 * `aʰk` and `mʰk` both spell as `X<h>k`, so the spelling alone cannot say
 * which sound the mark belongs to. Aspiration attaches to a plosive and not
 * to a vowel or a nasal, which is what decides it. In the LEADING position
 * there is nothing to decide, so no base is passed and the rule is not
 * applied.
 */

function readRun(
  run: string,
  form: 'consonant' | 'vowel',
  base?: Phone,
  loose = false,
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

    // LOOSE IS THE LAST READING BEFORE GIVING UP. A modifier is normally
    // read against the form of its base, but the encoder writes marks that
    // have no reading for that form: `iʲ` comes back as `i<y^>`, and
    // palatalization is spelled for a consonant. Refusing left the bracket
    // to leak out of the tokenizer one raw character at a time, which is
    // strictly worse than reading it as what it plainly says.
    const one = loose
      ? (pickModifier(options, form) ?? options[0])
      : pickModifier(options, form)

    if (one === undefined) {
      return null
    }

    if (base && !modifierAttaches(base, one)) {
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

/**
 * A binder: `<B>` ties the two graphemes before it into one segment, `<B3>`
 * the three before it, and so on.
 *
 * WHY IT COUNTS BACKWARD. A tie in IPA sits BETWEEN the letters it joins,
 * so `t͡ʃ` says nothing about how far the binding reaches: a reader infers
 * two from the position. That works on paper and not in a string a machine
 * segments, which is why the old spelling carried the tie as an opaque
 * symbol standing between two sounds and could not say what it bound.
 *
 * Naming the count instead makes a doubly-articulated `k͡p` and a
 * three-part cluster equally sayable, and it puts the binder after its
 * material, where the modifier brackets already are.
 *
 * MODIFIERS COUNT AS PART OF THEIR SOUND. `t<h>x<B>` binds the aspirated
 * `t` and the `x`, two graphemes, because a mark belongs to the letter it
 * sits on rather than standing beside it.
 */

const BINDER = /^B(\d*)$/

/** How many sounds a binder joins, or null when the run is not a binder. */

function binderReach(run: string): number | null {
  const found = BINDER.exec(run)

  if (!found) {
    return null
  }

  const reach = found[1] ? Number(found[1]) : 2

  // Binding one sound to nothing is not a tie, and a count that runs past
  // the start of the word cannot be honoured either. Both are left for the
  // caller to reject rather than silently clamped.
  return reach >= 2 ? reach : null
}

/**
 * Several sounds joined into one, as a tie does.
 *
 * THE TIE BINDS THE BASES AND THE MARKS HOIST OUT. `t<h>x<B>` is an
 * aspirated affricate and comes back `t͡ʃʰ`, not `tʰ͡ʃ`. A tie says two
 * LETTERS are one segment, so anything between them breaks the very thing
 * it is asserting, and the aspiration belongs to the whole affricate
 * rather than to the stop half of it.
 *
 * `tʰ͡ʃ` still PARSES, because a source may well write it and refusing to
 * read a source is worse than reading it and saying so canonically. It
 * simply comes back in the other order.
 *
 * The result is raw rather than a phone: the parts keep their identities
 * and the binding is a claim about them, not a new entry in the catalog.
 */

function bindSounds(parts: Sound[]): Sound {
  const talk = parts.map(one => one.talk).join('')
  const simple = parts.map(one => one.simple).join('')

  // A part with no base is a passthrough, and its own spelling is all there
  // is to bind; otherwise the base ties and the marks follow the group.
  const bases = parts.map(one => one.base?.ipa ?? one.ipa)
  const marks = parts.flatMap(one => one.modifiers.map(mark => mark.ipa))
  const pre = parts.flatMap(one => one.pre.map(mark => mark.ipa))

  const ipa = pre.join('') + bases.join('\u{0361}') + marks.join('')

  return rawSound({
    talk: `${talk}<B${parts.length > 2 ? parts.length : ''}>`,
    ipa,
    simple,
  })
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

      // A BINDER TIES WHAT CAME BEFORE IT, so it is read here rather than
      // as a modifier on a following base: `tx<B>` is one affricate, and
      // there is no base after the bracket to carry it.
      if (span) {
        const reach = binderReach(span.body)

        if (reach !== null && sounds.length >= reach) {
          const held = sounds.splice(sounds.length - reach, reach)

          sounds.push(bindSounds(held))
          i = span.end
          continue
        }
      }

      if (span) {
        const next = R.talkStarter.matchAt(text, span.end)

        if (next !== undefined && next.role === 'phone') {
          const held =
            readRun(span.body, next.phone.form) ??
            readRun(span.body, next.phone.form, undefined, true)

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
        // WHOSE MARK IS IT. A run written after a base usually belongs to
        // it, and the `attaches` rule is what settles the cases where it
        // might not: aspiration goes to a plosive, not to a vowel.
        //
        // But the rule alone is too strong. `ipaToTalk` spells b̥ as
        // `b<v->` and kǃʰ as `k!<h>`, and neither voicelessness nor
        // aspiration attaches to those bases by rule, so refusing outright
        // meant the tokenizer could not read back what its own encoder
        // writes and the brackets spilled out as raw characters.
        //
        // A mark is only handed on when there is somewhere for it to GO:
        // the next sound has to be a phone that accepts the whole run. If
        // nothing ahead will take it, it stays where it was written, which
        // is also the reading that loses nothing.
        const fits = readRun(span.body, start.phone.form, start.phone)
        const held =
          fits ??
          readRun(span.body, start.phone.form) ??
          readRun(span.body, start.phone.form, undefined, true)

        let handOn = false

        if (held && !fits) {
          const next = R.talkStarter.matchAt(text, span.end)

          handOn =
            next !== undefined &&
            next.role === 'phone' &&
            readRun(span.body, next.phone.form, next.phone) !== null
        }

        if (held && !handOn) {
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
