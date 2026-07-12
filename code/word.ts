export type PhoneticConfig = {
  vowels: Array<string>
  consonants: {
    start: Array<string>
    end: Array<string>
  }
  rules: {
    allow_starting_vowels: boolean
    allow_ending_vowels: boolean
    allow_starting_consonants: boolean
    allow_ending_consonants: boolean
    start_consonant_probability?: number
    end_consonant_probability?: number
  }
  rewrites: Record<string, string>
  output: Record<string, string>
}

export type Word = {
  text: string
  talk: string
  syllables: Array<string>
}

export type SyllableCount =
  | number
  | {
      min: number
      max: number
    }

const DEFAULT_START_CONSONANT_PROBABILITY = 0.3
const DEFAULT_END_CONSONANT_PROBABILITY = 0.5

// Function to check if a string ends with a vowel from the given vowels array
function endsWithVowel(str: string, vowels: Array<string>): boolean {
  if (str.length === 0) {
    return false
  }
  const lastChar = str.charAt(str.length - 1)
  return vowels.includes(lastChar)
}

// Function to generate a single syllable
function generateSyllable(
  config: PhoneticConfig,
  options: {
    isFirstSyllable: boolean
    isLastSyllable: boolean
    previousSyllable?: string
  },
): string {
  const { vowels, consonants, rules } = config
  const { isFirstSyllable, isLastSyllable, previousSyllable } = options

  let syllable: Array<string> = []

  // Check if previous syllable ends with a vowel
  const prevEndsWithVowel =
    previousSyllable && endsWithVowel(previousSyllable, vowels)

  // Add starting consonant based on position and rules
  if (isFirstSyllable) {
    // For first syllable, use the allow_starting_consonants rule
    if (
      rules.allow_starting_consonants &&
      Math.random() <
        (rules.start_consonant_probability ??
          DEFAULT_START_CONSONANT_PROBABILITY)
    ) {
      syllable.push(getRandomElement(consonants.start))
    }
  } else {
    // For non-first syllables, always add a consonant if previous syllable ends with vowel
    if (prevEndsWithVowel) {
      syllable.push(getRandomElement(consonants.start))
    } else if (
      Math.random() <
      (rules.start_consonant_probability ??
        DEFAULT_START_CONSONANT_PROBABILITY)
    ) {
      // Otherwise add with probability
      syllable.push(getRandomElement(consonants.start))
    }
  }

  // Add vowel (required)
  syllable.push(getRandomElement(vowels))

  // Add ending consonant based on position and rules
  if (isLastSyllable) {
    // For last syllable, use the allow_ending_consonants rule
    if (
      rules.allow_ending_consonants &&
      Math.random() <
        (rules.end_consonant_probability ??
          DEFAULT_END_CONSONANT_PROBABILITY)
    ) {
      syllable.push(getRandomElement(consonants.end))
    }
  } else {
    // For non-last syllables, add ending consonant with probability
    if (
      Math.random() <
      (rules.end_consonant_probability ??
        DEFAULT_END_CONSONANT_PROBABILITY)
    ) {
      syllable.push(getRandomElement(consonants.end))
    }
  }

  return syllable.join('')
}

// Function to apply rewrite rules
function applyRewrites(
  word: string,
  rewrites: Record<string, string>,
): string {
  let result = word
  let previousResult = ''

  // Continue applying rewrites until no more changes occur
  while (previousResult !== result) {
    previousResult = result

    for (const [pattern, replacement] of Object.entries(rewrites)) {
      result = result.split(pattern).join(replacement)
    }
  }

  return result
}

// Function to apply output transformations
function applyOutputTransformations(
  word: string,
  outputTransforms: Record<string, string>,
): string {
  let result = word

  for (const [pattern, replacement] of Object.entries(
    outputTransforms,
  )) {
    const regex = new RegExp(pattern, 'g')
    result = result.replace(regex, replacement)
  }

  return result
}

// Function to generate a word with specific number of syllables
export function generateWord(
  syllableCount: number,
  config: PhoneticConfig,
): Word {
  const syllables: Array<string> = []

  for (let i = 0; i < syllableCount; i++) {
    // Determine syllable position
    const isFirstSyllable = i === 0
    const isLastSyllable = i === syllableCount - 1
    const previousSyllable = i > 0 ? syllables[i - 1] : undefined

    // Generate syllable with position context
    syllables.push(
      generateSyllable(config, {
        isFirstSyllable,
        isLastSyllable,
        previousSyllable,
      }),
    )
  }

  // Join syllables and apply rewrites
  const talk = syllables.join('')
  let text = applyRewrites(talk, config.rewrites)

  text = applyOutputTransformations(text, config.output)

  return { text, talk, syllables }
}

// Main function to generate words
function generateWords(
  count: number,
  syllableSpec: SyllableCount,
  config: PhoneticConfig,
): Array<Word> {
  const checks = new Set<string>()
  const words: Array<Word> = []

  while (words.length < count) {
    // Determine syllable count for this word
    let syllableCount: number
    if (typeof syllableSpec === 'number') {
      syllableCount = syllableSpec
    } else {
      syllableCount = Math.floor(
        Math.random() * (syllableSpec.max - syllableSpec.min + 1) +
          syllableSpec.min,
      )
    }

    const word = generateWord(syllableCount, config)

    // Only add unique words
    if (!checks.has(word.text)) {
      checks.add(word.text)
      words.push(word)
    }
  }

  return words
}

// Export for use as a module
export default generateWords

// Helper function to get a random element from an array
function getRandomElement<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)]!
}
