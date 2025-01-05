import merge from 'lodash/merge'

import {
  ACCENT_MARKS,
  BASE_VOWEL_GLYPHS,
  DURATION_MARKS,
  NASAL_MARKS,
  SYLLABIC_MARKS,
  TONE_MARKS,
  VARIANT_MARKS,
} from '.'
import {
  consonants,
  endConsonants,
  fullConsonants,
  startConsonants,
  vowels,
} from './syllables'

type Mark = {
  aspiration?: boolean
  click?: boolean
  dentalization?: boolean
  ejection?: boolean
  elongation?: boolean
  implosion?: boolean
  labialization?: boolean
  nasalization?: boolean
  palatalization?: boolean
  pharyngealization?: boolean
  stop?: boolean
  stress?: boolean
  tense?: boolean
  tone?:
    | 'extra high'
    | 'high'
    | 'low'
    | 'extra low'
    | 'rising'
    | 'rising 2'
    | 'falling'
    | 'falling 2'
    | 'rising falling'
    | 'falling rising'
  truncation?: boolean
  type?: 'punctuation' | 'vowel' | 'consonant'
  value?: string
  velarization?: boolean
  voicelessness?: boolean
  form?: 'wall' | 'flow' | 'turn'
}

type Span = { chunk: Array<Mark>; match: string }

const MARK: Record<string, Mark> = {
  '=.': { type: 'punctuation', value: '.' },
  '=@': { type: 'punctuation', value: '@' },
  '=?': { type: 'punctuation', value: '?' },
  '=!': { type: 'punctuation', value: '!' },
  '=+': { type: 'punctuation', value: '+' },
  '=-': { type: 'punctuation', value: '-' },
  'h!': { voicelessness: true },
  'h~': { aspiration: true },
  'w~': { labialization: true },
  'y~': { palatalization: true },
  'G~': { velarization: true },
  'Q~': { pharyngealization: true },
  'l*': { type: 'consonant', value: 'l', form: 'wall', click: true },
  't*': { type: 'consonant', value: 't', form: 'wall', click: true },
  'd*': { type: 'consonant', value: 'd', form: 'wall', click: true },
  'k*': { type: 'consonant', value: 'k', form: 'wall', click: true },
  'p*': { type: 'consonant', value: 'p', form: 'wall', click: true },
  'n.': { type: 'consonant', value: 'n', form: 'flow', stop: true },
  'q.': { type: 'consonant', value: 'q', form: 'flow', stop: true },
  'g.': { type: 'consonant', value: 'g', form: 'wall', stop: true },
  'd.': { type: 'consonant', value: 'd', form: 'wall', stop: true },
  'b.': { type: 'consonant', value: 'b', form: 'wall', stop: true },
  'p.': { type: 'consonant', value: 'p', form: 'wall', stop: true },
  't.': { type: 'consonant', value: 't', form: 'wall', stop: true },
  'k.': { type: 'consonant', value: 'k', form: 'wall', stop: true },
  's.': { type: 'consonant', value: 's', form: 'flow', stop: true },
  'f.': { type: 'consonant', value: 'f', form: 'flow', stop: true },
  'v.': { type: 'consonant', value: 'v', form: 'flow', stop: true },
  'z.': { type: 'consonant', value: 'z', form: 'flow', stop: true },
  'j.': { type: 'consonant', value: 'j', form: 'flow', stop: true },
  'x.': { type: 'consonant', value: 'x', form: 'flow', stop: true },
  'c.': { type: 'consonant', value: 'c', form: 'flow', stop: true },

  'n@': { type: 'consonant', value: 'n', form: 'flow', tense: true },
  'q@': { type: 'consonant', value: 'q', form: 'flow', tense: true },
  'g@': { type: 'consonant', value: 'g', form: 'wall', tense: true },
  'd@': { type: 'consonant', value: 'd', form: 'wall', tense: true },
  'b@': { type: 'consonant', value: 'b', form: 'wall', tense: true },
  'p@': { type: 'consonant', value: 'p', form: 'wall', tense: true },
  't@': { type: 'consonant', value: 't', form: 'wall', tense: true },
  'k@': { type: 'consonant', value: 'k', form: 'wall', tense: true },
  's@': { type: 'consonant', value: 's', form: 'flow', tense: true },
  'f@': { type: 'consonant', value: 'f', form: 'flow', tense: true },
  'v@': { type: 'consonant', value: 'v', form: 'flow', tense: true },
  'z@': { type: 'consonant', value: 'z', form: 'flow', tense: true },
  'j@': { type: 'consonant', value: 'j', form: 'flow', tense: true },
  'x@': { type: 'consonant', value: 'x', form: 'flow', tense: true },
  'c@': { type: 'consonant', value: 'c', form: 'flow', tense: true },

  'n!': { type: 'consonant', value: 'n', form: 'flow', ejection: true },
  'q!': { type: 'consonant', value: 'q', form: 'flow', ejection: true },
  'g!': { type: 'consonant', value: 'g', form: 'wall', ejection: true },
  'd!': { type: 'consonant', value: 'd', form: 'wall', ejection: true },
  'b!': { type: 'consonant', value: 'b', form: 'wall', ejection: true },
  'p!': { type: 'consonant', value: 'p', form: 'wall', ejection: true },
  't!': { type: 'consonant', value: 't', form: 'wall', ejection: true },
  'k!': { type: 'consonant', value: 'k', form: 'wall', ejection: true },
  's!': { type: 'consonant', value: 's', form: 'flow', ejection: true },
  'f!': { type: 'consonant', value: 'f', form: 'flow', ejection: true },
  'v!': { type: 'consonant', value: 'v', form: 'flow', ejection: true },
  'z!': { type: 'consonant', value: 'z', form: 'flow', ejection: true },
  'j!': { type: 'consonant', value: 'j', form: 'flow', ejection: true },
  'x!': { type: 'consonant', value: 'x', form: 'flow', ejection: true },
  'c!': { type: 'consonant', value: 'c', form: 'flow', ejection: true },
  'C!': { type: 'consonant', value: 'C', form: 'flow', ejection: true },
  'y!': { type: 'consonant', value: 'y', form: 'flow', ejection: true },
  'w!': { type: 'consonant', value: 'w', form: 'flow', ejection: true },
  'Q!': { type: 'consonant', value: 'Q', form: 'flow', ejection: true },
  'l!': { type: 'consonant', value: 'l', form: 'flow', ejection: true },
  'r!': { type: 'consonant', value: 'r', form: 'flow', ejection: true },
  't~': {
    type: 'consonant',
    value: 't',
    form: 'wall',
    dentalization: true,
  },
  'd~': {
    type: 'consonant',
    value: 'd',
    form: 'wall',
    dentalization: true,
  },

  m: { type: 'consonant', value: 'm', form: 'flow' },
  n: { type: 'consonant', value: 'n', form: 'flow' },
  N: { type: 'consonant', value: 'N', form: 'flow' },
  q: { type: 'consonant', value: 'q', form: 'flow' },
  g: { type: 'consonant', value: 'g', form: 'wall' },
  G: { type: 'consonant', value: 'G', form: 'flow' },
  d: { type: 'consonant', value: 'd', form: 'wall' },
  b: { type: 'consonant', value: 'b', form: 'wall' },
  p: { type: 'consonant', value: 'p', form: 'wall' },
  t: { type: 'consonant', value: 't', form: 'wall' },
  T: { type: 'consonant', value: 'T', form: 'wall' },
  k: { type: 'consonant', value: 'k', form: 'wall' },
  K: { type: 'consonant', value: 'K', form: 'wall' },
  h: { type: 'consonant', value: 'h', form: 'flow' },
  H: { type: 'consonant', value: 'H', form: 'flow' },
  s: { type: 'consonant', value: 's', form: 'flow' },
  S: { type: 'consonant', value: 'S', form: 'flow' },
  f: { type: 'consonant', value: 'f', form: 'flow' },
  F: { type: 'consonant', value: 'F', form: 'flow' },
  V: { type: 'consonant', value: 'V', form: 'flow' },
  v: { type: 'consonant', value: 'v', form: 'flow' },
  z: { type: 'consonant', value: 'z', form: 'flow' },
  Z: { type: 'consonant', value: 'Z', form: 'flow' },
  j: { type: 'consonant', value: 'j', form: 'flow' },
  J: { type: 'consonant', value: 'J', form: 'flow' },
  x: { type: 'consonant', value: 'x', form: 'flow' },
  X: { type: 'consonant', value: 'X', form: 'flow' },
  c: { type: 'consonant', value: 'c', form: 'flow' },
  C: { type: 'consonant', value: 'C', form: 'flow' },
  y: { type: 'consonant', value: 'y', form: 'flow' },
  W: { type: 'consonant', value: 'W', form: 'flow' },
  w: { type: 'consonant', value: 'w', form: 'flow' },
  Q: { type: 'consonant', value: 'Q', form: 'flow' },
  "'": { type: 'consonant', value: "'", form: 'flow' },
  l: { type: 'consonant', value: 'l', form: 'flow' },
  L: { type: 'consonant', value: 'L', form: 'flow' },
  r: { type: 'consonant', value: 'r', form: 'flow' },
  R: { type: 'consonant', value: 'R', form: 'flow' },
  ' ': { type: 'punctuation', value: ' ' },
}

const EXTRA_FEATURES: Record<string, Mark> = {
  '--': { tone: 'extra low' },
  '-': { tone: 'low' },
  '++': { tone: 'extra high' },
  '+': { tone: 'high' },
  '//': { tone: 'rising 2' }, // rising 2 (vietnamese ngã)
  '/': { tone: 'rising' }, // rising (vietnamese sắc)
  '\\/': { tone: 'falling rising' }, // falling rising (vietnamese hỏi)
  '/\\': { tone: 'rising falling' }, // rising falling
  '\\\\': { tone: 'falling 2' }, // falling 2 (vietnamese nặng)
  '\\': { tone: 'falling' }, // falling (vietnamese huyền)
  '@': { tense: true },
  '.': { stop: true },
  '!': { truncation: true },
  _: { elongation: true },
  '^': { stress: true },
  '?': { implosion: true },
  '*': { click: true },
  '~': { dentalization: true },
  '&': { nasalization: true },
}

BASE_VOWEL_GLYPHS.forEach(g => {
  ACCENT_MARKS.forEach(a => {
    DURATION_MARKS.forEach(l => {
      SYLLABIC_MARKS.forEach(s => {
        NASAL_MARKS.forEach(n => {
          VARIANT_MARKS.forEach(v => {
            TONE_MARKS.forEach(t => {
              const i = `${g}${v}${n}${s}${t}${l}${a}`
              const features = merge(
                { type: 'vowel', value: `${g}${v}` },
                EXTRA_FEATURES[n],
                EXTRA_FEATURES[s],
                EXTRA_FEATURES[t],
                EXTRA_FEATURES[l],
                EXTRA_FEATURES[a],
              )

              MARK[i] = features
            })
          })
        })
      })
    })
  })
})

export default function make(string: string) {
  return group(chunk(string))
}

export function chunk(string: string) {
  let x = string
  const chunks: Array<Mark> = []
  let i = 0
  while (x.length) {
    let matched = false
    symbol: for (const key in MARK) {
      if (x.startsWith(key)) {
        const val = MARK[key]
        if (val && val.type) {
          chunks.push({ ...val })
        } else {
          // merge with previous....
          chunks[chunks.length - 1] = {
            ...chunks[chunks.length - 1],
            ...val,
          }
        }
        x = x.slice(key.length)
        i += key.length
        matched = true
        break symbol
      }
    }
    if (!matched) {
      console.error(string, string.slice(i))
      throw new Error('Invalid characters found')
    }
  }
  return chunks
}

export function group(chunks: Array<Mark>) {
  const list: Array<Array<Span>> = []

  let i = 0
  while (i < chunks.length) {
    const span: Array<Span> = []
    let j = 0

    const chunk = chunks[i]!

    if (chunk.type === 'punctuation') {
      span.push({ chunk: [chunk], match: chunk.value! })
      list.push(span)
      i++
      continue
    }

    while (j < fullConsonants.length) {
      const x = fullConsonants[j++]!
      const chunk = chunks.slice(i, i + x.length)
      if (chunk.map(x => x.value).join('') === x) {
        span.push({ chunk, match: x })
        i += x.length
        break
      }
    }

    if (span.length) {
      list.push(span)
      continue
    }

    j = 0
    while (j < startConsonants.length) {
      const x = startConsonants[j++]!
      const chunk = chunks.slice(i, i + x.length)
      if (chunk.map(x => x.value).join('') === x) {
        span.push({ chunk, match: x })
        i += x.length
        break
      }
    }

    j = 0
    while (j < consonants.length) {
      const x = consonants[j++]!
      const chunk = chunks.slice(i, i + x.length)
      if (chunk.map(x => x.value).join('') === x) {
        if (span.length) {
          list.push([...span])
        }
        span.length = 0
        span.push({ chunk, match: x })
        i += x.length
        break
      }
    }

    j = 0
    while (j < vowels.length) {
      const x = vowels[j++]!
      const y = x.replace(/\$/g, '')
      const chunk = chunks.slice(i, i + y.length)
      if (chunk.map(x => x.value).join('') === x) {
        span.push({ chunk, match: x })
        i += y.length
        break
      }
    }

    let matched = false
    j = 0
    while (j < endConsonants.length) {
      const x = endConsonants[j++]!
      const y = x.replace(':', '')
      const chunk = chunks.slice(i, i + y.length)
      if (chunk.map(x => x.value).join('') === y) {
        span.push({ chunk, match: x })
        i += y.length
        matched = true
        break
      }
    }

    if (!matched && i === chunks.length - 1) {
      j = 0
      while (j < consonants.length) {
        const x = consonants[j++]!
        const chunk = chunks.slice(i, i + x.length)
        if (chunk.map(x => x.value).join('') === x) {
          span.push({ chunk, match: x })
          i += x.length
          break
        }
      }
    }

    if (span.length) {
      list.push([...span])
    } else {
      const text = chunks
        .slice(i)
        .map(x => x.value)
        .join('')
      throw new Error(`No match found for ${text}`)
    }
  }

  i = 0
  while (i < list.length) {
    const last = list[i - 1]
    const node = list[i++]!
    if (!last) {
      continue
    }

    const lastSpan = last[last.length - 1]!
    const nodeSpan = node[0]!

    // can split
    if (lastSpan.match.match(':')) {
      const nodeSpanText = nodeSpan.chunk[0]!.value!

      let left: Array<Mark> = []
      let right: Array<Mark> = []

      const [a, b] = lastSpan.match.split(':')!

      let j = 0
      let text = ''
      let array = left
      while (j < lastSpan.chunk.length) {
        const mark = lastSpan.chunk[j]!
        text += mark.value
        array.push(mark)
        if (text === a && !right.length) {
          array = right
        }
        j++
      }

      if (right.length) {
        nodeSpan.chunk.unshift(...right)
      }

      lastSpan.chunk = left
    }
  }

  const spans = list.map(spans =>
    spans.map(span => span.chunk.map(serialize).join('')).join(''),
  )

  i = 0
  while (i < spans.length) {
    const node = spans[i]!
    const next = spans[i + 1]

    if (!next) {
      break
    }

    if (!next.match(/[ieaou]/i)) {
      spans[i] += next
      spans.splice(i + 1, 1)
    } else if (
      !node.match(/(tx|dj)$/i) &&
      next.match(/^[ieaou]/i) &&
      node.match(
        /[bcdfghjklmnpqrstvwxyz]([bcdfghjklmnpqrstvwxyz](?:[QGhy]~)?)$/gi,
      )
    ) {
      const text = spans[i]!
      spans[i] = text.slice(0, -RegExp.$1.length)
      spans[i + 1] =
        text.slice(text.length - RegExp.$1.length) + spans[i + 1]
    } else {
      i++
    }
  }

  return spans
}

export function serialize(mark: Mark) {
  const text: Array<string> = []
  if (mark.value) {
    text.push(mark.value)
  }
  if (mark.click) {
    text.push(`*`)
  }
  if (mark.dentalization) {
  }
  if (mark.ejection) {
    text.push(`!`)
  }
  if (mark.implosion) {
    text.push(`?`)
  }
  if (mark.nasalization) {
    text.push(`&`)
  }
  if (mark.tone) {
    switch (mark.tone) {
      case 'extra high':
        text.push(`++`)
        break
      case 'high':
        text.push(`+`)
        break
      case 'low':
        text.push(`-`)
        break
      case 'extra low':
        text.push(`--`)
        break
      case 'rising':
        text.push(`/`)
        break
      case 'rising 2':
        text.push(`//`)
        break
      case 'falling':
        text.push(`\\`)
        break
      case 'falling 2':
        text.push(`\\\\`)
        break
      case 'rising falling':
        text.push(`/\\`)
        break
      case 'falling rising':
        text.push(`\\/`)
        break
    }
  }
  if (mark.elongation) {
    text.push(`_`)
  }
  if (mark.truncation) {
    text.push('!')
  }
  if (mark.stress) {
    text.push(`^`)
  }
  if (mark.dentalization) {
    text.push(`~`)
  }
  if (mark.pharyngealization) {
    text.push(`Q~`)
  }
  if (mark.velarization) {
    text.push(`G~`)
  }
  if (mark.palatalization) {
    text.push(`y~`)
  }
  if (mark.labialization) {
    text.push(`w~`)
  }
  if (mark.aspiration) {
    text.push(`h~`)
  }
  if (mark.stop) {
    text.push(`.`)
  }
  if (mark.tense) {
    text.push(`@`)
  }
  if (mark.voicelessness) {
  }

  return text.join('')
}
