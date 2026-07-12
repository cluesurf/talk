import lowercase from './lowercase.json'
import capital from './capital.json'
import other from './other.json'
import diacritics from './diacritics.json'

export type MarkInfo = {
  'X-SAMPA': string
  IPA: string
}

const TABLE: MarkInfo[] = [
  ...(lowercase as MarkInfo[]),
  ...(capital as MarkInfo[]),
  ...(other as MarkInfo[]),
  ...(diacritics as MarkInfo[]),
]

export default TABLE

export const XSAMPA: Record<string, number> = {}
export const IPA: Record<string, number> = {}

for (const [i, e] of TABLE.entries()) {
  XSAMPA[e['X-SAMPA']] = i
  IPA[e.IPA] = i
}

export const XSAMPA_PATTERN = new RegExp(
  '(' +
    Object.keys(XSAMPA)
      .filter(x => !!x)
      .map(escape)
      .join('|') +
    ')',
  'g',
)

export const IPA_PATTERN = new RegExp(
  '(' +
    Object.keys(IPA)
      .filter(x => !!x)
      .map(escape)
      .join('|') +
    ')',
  'g',
)

export function escape(text: string) {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}
