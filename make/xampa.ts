import TABLE, { XSAMPA, XSAMPA_PATTERN } from '~/make/data/index.js'
import { ipa2xsampa } from 'x-sampa-ipa'

import { makeTalkToIpa } from './ipa'

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
