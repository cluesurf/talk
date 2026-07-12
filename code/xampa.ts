import TABLE, { XSAMPA, XSAMPA_PATTERN } from '~/code/data/index'
import { ipa2xsampa } from 'x-sampa-ipa'

import { makeIpaToTalk, makeTalkToIpa } from './ipa'

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
  return ipa2xsampa(makeTalkToIpa(text)) as string
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
