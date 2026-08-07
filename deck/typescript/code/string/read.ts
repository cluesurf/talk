// Read a string as whichever type it is written in.
//
// The two scanners return different shapes: `parseIpa` gives units that
// may be symbols or unknown text, `segment` gives Sounds. This flattens
// both to the one thing an encoder needs, a base with its modifiers.

import { parseIpa } from './convert'
import { segment } from './sound'
import type { Modifier, Phone } from './type'

export type ReadSound = {
  base?: Phone
  modifiers: Modifier[]
}

export function readSounds({
  text,
  type,
}: {
  text: string
  type: 'ipa' | 'tone'
}): ReadSound[] {
  if (type === 'tone') {
    return segment(text).map(sound => ({
      base: sound.base,
      modifiers: sound.modifiers,
    }))
  }

  return parseIpa(text).map(unit =>
    unit.role === 'phone'
      ? { base: unit.base, modifiers: unit.modifiers }
      : { modifiers: [] },
  )
}
