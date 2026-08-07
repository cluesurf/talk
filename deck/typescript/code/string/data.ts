// The committed data, typed. This is the only place the JSON is loaded.

import MODIFIERS from '../../base/modifiers.json'
import PHONES from '../../base/phones.json'
import type { Modifier, Phone } from './type'

export const phones = PHONES as Phone[]
export const modifiers = MODIFIERS as Modifier[]
// `base/tokens.json` is gone. Codes used to be assigned there, 91,332 of
// them, which inlined 4.5MB into every bundle for an answer the model can
// derive. `codeOf` in `space/codec` computes them instead.
