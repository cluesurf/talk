// The committed data, typed. This is the only place the JSON is loaded.

import TOKENS from '../../base/tokens.json'
import MODIFIERS from '../../base/modifiers.json'
import PHONES from '../../base/phones.json'
import type { Modifier, Phone, TokenEntry } from './type'

export const phones = PHONES as Phone[]
export const modifiers = MODIFIERS as Modifier[]
// Cast through `unknown` because the committed file is rewritten by
// `pnpm tokens`, and during the migration from the old one-Hangul-per-
// sound format it still carries the previous shape.
export const tokenEntries = TOKENS as unknown as TokenEntry[]
