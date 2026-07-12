import TABLE, { XSAMPA, XSAMPA_PATTERN } from '~/code/base'
import { ipa2xsampa as ipa2xsampaUntyped } from 'x-sampa-ipa'

import { makeIpaToTalk, makeTalkToIpa } from './ipa'

// `x-sampa-ipa` ships no types, so `ipa2xsampa` is `any`. Pin the
// signature we rely on so the call sites stay type-safe.
const ipa2xsampa = ipa2xsampaUntyped as (ipa: string) => string

export function makeXSampaToIpa(text: string) {
  return text.replace(XSAMPA_PATTERN, xs => {
    if (!xs) {
      return ''
    }

    const i = XSAMPA[xs]!
    const x = TABLE[i]!.IPA

    return x
  })
}

export function makeTalkToXSampa(text: string) {
  return ipa2xsampa(makeTalkToIpa(text))
}

/**
 * Convert X-SAMPA to talk format.
 * Goes through IPA as an intermediate step.
 *
 * @param text - X-SAMPA text to convert
 * @returns Text in talk format
 */
export function makeXSampaToTalk(text: string) {
  return makeIpaToTalk(makeXSampaToIpa(text))
}
