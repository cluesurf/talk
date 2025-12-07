import make from '~/index.js'

export enum Simplify {
  VowelNone = 2,
  VowelOne = 5,
  VowelBasic = 6,
  VowelAll = 8,

  ConsonantSimplified = 2,
  ConsonantAll = 4,

  ToneNo = 2,
  ToneYes = 3,

  DurationNo = 2,
  DurationYes = 3,

  AspirationNo = 2,
  AspirationYes = 3,
}

const MAX =
  1 *
  Simplify.VowelAll *
  Simplify.ConsonantAll *
  Simplify.ToneYes *
  Simplify.DurationYes *
  Simplify.AspirationYes

export interface SimplifyType {
  vowel: 'none' | 'one' | 'basic' | 'all'
  consonant: 'all' | 'simplified'
  tone: 'yes' | 'no'
  duration: 'yes' | 'no'
  aspiration: 'yes' | 'no'
}

export interface ViewType {
  text: string
  code: string
  mass: number
  load: Record<string, string>
}

const VOWEL: SimplifyType['vowel'][] = ['none', 'one', 'basic', 'all']
const CONSONANT: SimplifyType['consonant'][] = ['all', 'simplified']
const TONE: SimplifyType['tone'][] = ['yes', 'no']
const DURATION: SimplifyType['duration'][] = ['yes', 'no']
const ASPIRATION: SimplifyType['aspiration'][] = ['yes', 'no']

export default function simplifyPhonetics(text: string) {
  const holdBase: Record<string, ViewType[]> = {}

  text = text.replace(/=(.)/g, '')

  VOWEL.forEach(vowel => {
    CONSONANT.forEach(consonant => {
      TONE.forEach(tone => {
        DURATION.forEach(duration => {
          ASPIRATION.forEach(aspiration => {
            const view = simplifyPhoneticsCase(text, {
              vowel,
              consonant,
              tone,
              duration,
              aspiration,
            })

            const list = (holdBase[view.text] ??= [])
            list.push(view)
          })
        })
      })
    })
  })

  const holdHead: ViewType[] = []
  const codeList: Record<string, boolean> = {}
  for (const line in holdBase) {
    const list = holdBase[line]
    list?.sort((a, b) => b.mass - a.mass)
    const head = list?.[0]
    if (head && !codeList[head.code] && head.code) {
      holdHead.push(head)
    }
    if (head) {
      codeList[head.code] = true
    }
  }

  const massList = holdHead.map(view => view.mass)
  const min = Math.min(...massList) - 1
  const max = Math.max(...massList)

  holdHead.forEach(view => {
    view.mass = normalizeMass(view.mass, min, max)
  })

  holdHead.sort((a, b) => b.mass - a.mass)

  return holdHead
}

export function simplifyPhoneticsCase(
  text: string,
  { vowel, consonant, tone, aspiration, duration }: SimplifyType,
) {
  const view: ViewType = { text, code: '', mass: 1, load: {} }

  switch (consonant) {
    case 'simplified': {
      moveToSimplifiedConsonantText(view)
      break
    }
    case 'all': {
      moveToAllConsonantText(view)
      break
    }
  }

  switch (vowel) {
    case 'none': {
      moveToNoVowelText(view)
      break
    }
    case 'one': {
      moveToOneVowelText(view)
      break
    }
    case 'basic': {
      moveToBasicVowelText(view)
      break
    }
    case 'all': {
      moveToAllVowelText(view)
      break
    }
  }

  switch (tone) {
    case 'no': {
      moveToNoToneText(view)
      break
    }
    case 'yes': {
      moveToYesToneText(view)
      break
    }
  }

  switch (aspiration) {
    case 'no': {
      moveToNoAspirationText(view)
      break
    }
    case 'yes': {
      moveToYesAspirationText(view)
      break
    }
  }

  switch (duration) {
    case 'no': {
      moveToNoDurationText(view)
      break
    }
    case 'yes': {
      moveToYesDurationText(view)
      break
    }
  }

  view.code = make.machine(view.text)

  return view
}

function moveToNoDurationText(view: ViewType) {
  const text = view.text.replace(/_/g, '')
  view.load.duration = 'no'
  if (text !== view.text) {
    view.mass *= Simplify.DurationNo
    view.text = text
  }
}

function moveToYesDurationText(view: ViewType) {
  view.mass *= Simplify.DurationYes
  view.load.duration = 'yes'
}

function moveToNoAspirationText(view: ViewType) {
  const text = view.text.replace(/h~/g, '')
  view.load.aspiration = 'no'

  if (text !== view.text) {
    view.mass *= Simplify.AspirationNo
    view.text = text
  }
}

function moveToYesAspirationText(view: ViewType) {
  view.mass *= Simplify.AspirationYes
  view.load.aspiration = 'yes'
}

function moveToNoToneText(view: ViewType) {
  const text = view.text.replace(/[\-\+]+/g, '')
  view.load.tone = 'no'
  if (text !== view.text) {
    view.mass *= Simplify.ToneNo
    view.text = text
  }
}

function moveToYesToneText(view: ViewType) {
  view.mass *= Simplify.ToneYes
  view.load.tone = 'yes'
}

function moveToNoVowelText(view: ViewType) {
  const text = view.text
    .replace(/u\$/g, 'ð') // this isn't a vowel, it's the English r.
    .replace(/[aeiou][\$\^&_\+\-\!@]*/gi, '')
    .replace(/ð/g, 'u$')
  view.load.vowel = 'none'

  if (text !== view.text) {
    view.mass *= Simplify.VowelNone
    view.text = text
  }
}

function moveToOneVowelText(view: ViewType) {
  const text = view.text
    .replace(/u\$/g, 'ð')
    .replace(/([aeiou])\$/gi, (_, $1) => `${$1}`)
    .replace(/[aeiou][\^&_\+\-\!@]*/gi, 'a')
    .replace(/ð/g, 'u$')
    .replace(/a+/g, 'a')
  view.load.vowel = 'one'

  if (text !== view.text) {
    view.mass *= Simplify.VowelOne
    view.text = text
  }
}

function moveToBasicVowelText(view: ViewType) {
  const text = view.text
    .replace(/u\$/g, 'ð')
    .replace(/([aeiou])\$/gi, (_, $1) => `${$1}`)
    .replace(/([aeiou])[\^&_\+\-\!@]*/gi, (_, $1: string) =>
      $1.toLowerCase(),
    )
    .replace(/a+/g, 'a')
    .replace(/e+/g, 'e')
    .replace(/i+/g, 'i')
    .replace(/o+/g, 'o')
    .replace(/u+/g, 'u')
    .replace(/ai/g, 'a')
    .replace(/au/g, 'a')
    .replace(/ao/g, 'o')
    .replace(/ae/g, 'e')
    .replace(/io/g, 'o')
    .replace(/ia/g, 'a')
    .replace(/ou/g, 'u')
    .replace(/oi/g, 'i')
    .replace(/ð/g, 'u$')
  view.load.vowel = 'basic'

  if (text !== view.text) {
    view.mass *= Simplify.VowelBasic
    view.text = text
  }
}

function moveToAllVowelText(view: ViewType) {
  view.mass *= Simplify.VowelAll
  view.load.vowel = 'all'
}

function moveToSimplifiedConsonantText(view: ViewType) {
  const text = view.text
    .replace(/H/g, 'h')
    .replace(/h~/g, 'h')
    .replace(/y~/g, 'y')
    .replace(/G~/g, '')
    .replace(/Q~/g, '')
    .replace(/w~/g, 'w')
    .replace(/t~/g, 't')
    .replace(/d~/g, 'd')
    .replace(/b[\?\!@]?/gi, 'p')
    .replace(/p[\?\!\*\.@]?/gi, 'p')
    .replace(/t[\?\!\*\.@]?/gi, 't')
    .replace(/d[\?\!\*@]?/gi, 't')
    .replace(/s[\?\!\*@]?/gi, 's')
    .replace(/j/gi, 'x')
    .replace(/v/gi, 'f')
    .replace(/z/gi, 's')
    .replace(/d/gi, 't')
    .replace(/g/gi, 'k')
  view.load.consonant = 'simplified'

  if (text !== view.text) {
    view.mass *= Simplify.ConsonantSimplified
    view.text = text
  }
}

function moveToAllConsonantText(view: ViewType) {
  view.mass *= Simplify.ConsonantAll
  view.load.consonant = 'all'
}

function normalizeMass(
  value: number,
  min: number,
  max: number,
): number {
  if (min >= max) {
    throw new Error(
      'Minimum value must be less than the maximum value.',
    )
  }
  if (value < min || value > max) {
    throw new Error('Value must be within the range of min and max.')
  }
  return parseFloat(((value - min) / (max - min)).toFixed(4))
}
