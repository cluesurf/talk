/**
 * List the exact Unicode code-point ranges of Han ideographs used in CHINESE
 * (Sinitic) writing, and NOT characters that are exclusively Korean (Hanja),
 * Japanese (kokuji), or Vietnamese (Chu Nom).
 *
 * WHY THIS IS A DATABASE PROBLEM, NOT A RANGE PROBLEM
 * ---------------------------------------------------
 * Unicode UNIFIES Han across Chinese / Japanese / Korean / Vietnamese. The
 * characters 中 山 人 水 火 國 are the SAME code points in every CJKV language,
 * assigned the script `Han`, not a per-language script. There is no
 * "Chinese-only" Unicode block or range. So `\p{Unified_Ideograph}` (or the
 * assigned CJK ranges) gives you "Han ideographs", NOT "Chinese ideographs".
 *
 * The only principled way to say "this character is used in Chinese" is the
 * Unihan database (UAX #38). A character counts as Chinese here if it has:
 *   - a Chinese IRG SOURCE   — G (PRC), T (Taiwan), H (Hong Kong), M (Macau); or
 *   - a Chinese READING      — Mandarin / Cantonese / Hanyu Pinyin / ...
 *
 * Shared characters (also used in Japanese/Korean) ARE included, because they
 * are used in Chinese too. Only characters with NO Chinese source and NO
 * Chinese reading (Korean-only hanja, Japanese-only kokuji, Vietnamese-only
 * Nom) are excluded. The script downloads Unihan, applies the filter, and
 * collapses the matching code points into contiguous ranges.
 *
 * HONEST CAVEAT
 * -------------
 * Unihan cannot cleanly separate "Sinitic Chinese" from non-Sinitic writing
 * that also happens to use Han-derived characters encoded via China's
 * submission (Zhuang Sawndip, some Yao/Dong/Bouyei traditions). Those may carry
 * a G-source. The READING filter (Mandarin/Cantonese/Pinyin) is the tightest
 * proxy for genuinely Sinitic use; the SOURCE filter is broader. The script
 * reports both so you can pick, and defaults to their UNION (the standard
 * "Chinese repertoire" definition the Unicode docs suggest).
 *
 * Run:  pnpm tsx task/data/script/list-chinese-character-unicode-ranges.ts
 *   flags:  --readings-only   use only Chinese readings (tightest Sinitic set)
 *           --sources-only    use only Chinese IRG sources
 *           --version 17.0.0  pin a Unihan version (default below)
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
function flag(name: string): boolean {
  return args.includes(`--${name}`)
}
function option(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback
}

const UNIHAN_VERSION = option('version', '17.0.0')
const UNIHAN_URL = `https://www.unicode.org/Public/${UNIHAN_VERSION}/ucd/Unihan.zip`

const HERE = path.resolve('task/data/script')
const CACHE_DIR = path.resolve('tmp/.unihan-cache', UNIHAN_VERSION)
const ZIP_PATH = path.join(CACHE_DIR, 'Unihan.zip')

// Unihan files we need and the properties in each that mark Chinese use.
const NEEDED_FILES = ['Unihan_IRGSources.txt', 'Unihan_Readings.txt']

// IRG source = which national body encoded the character. G/T/H/M are Chinese.
const CHINESE_SOURCE_PROPERTIES = new Set([
  'kIRG_GSource', // PRC (Mainland China)
  'kIRG_TSource', // Taiwan
  'kIRG_HSource', // Hong Kong
  'kIRG_MSource', // Macau
])

// Readings a Chinese (Sinitic) language assigns. Korean/Japanese/Vietnamese
// readings (kKorean, kJapaneseOn, kVietnamese, ...) are deliberately excluded.
const CHINESE_READING_PROPERTIES = new Set([
  'kMandarin',
  'kCantonese',
  'kHanyuPinyin',
  'kHanyuPinlu',
  'kXHC1983',
  'kTGHZ2013',
])

async function ensureUnihan(): Promise<void> {
  mkdirSync(CACHE_DIR, { recursive: true })

  const allExtracted = NEEDED_FILES.every(f =>
    existsSync(path.join(CACHE_DIR, f)),
  )
  if (allExtracted) {
    return
  }

  if (!existsSync(ZIP_PATH)) {
    console.error(`[unihan] downloading ${UNIHAN_URL}`)
    const response = await fetch(UNIHAN_URL)
    if (!response.ok) {
      throw new Error(
        `Unihan download failed ${response.status}. Check the version (${UNIHAN_VERSION}) is published at unicode.org/Public/.`,
      )
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    writeFileSync(ZIP_PATH, buffer)
    console.error(`[unihan] saved ${(buffer.length / 1e6).toFixed(1)} MB`)
  }

  console.error(`[unihan] extracting ${NEEDED_FILES.join(', ')}`)
  execFileSync('unzip', ['-o', ZIP_PATH, ...NEEDED_FILES, '-d', CACHE_DIR], {
    stdio: 'ignore',
  })
}

/** Code points whose line carries any property in `properties`. */
function collectCodePoints(file: string, properties: Set<string>): Set<number> {
  const text = readFileSync(path.join(CACHE_DIR, file), 'utf8')
  const found = new Set<number>()

  for (const line of text.split('\n')) {
    if (line.length === 0 || line.startsWith('#')) {
      continue
    }
    // format:  U+3400<TAB>kMandarin<TAB>qiu
    const tab = line.indexOf('\t')
    const tab2 = line.indexOf('\t', tab + 1)
    if (tab < 0 || tab2 < 0) {
      continue
    }
    const property = line.slice(tab + 1, tab2)
    if (!properties.has(property)) {
      continue
    }
    const token = line.slice(0, tab) // "U+3400"
    const codePoint = parseInt(token.slice(2), 16)
    if (!Number.isNaN(codePoint)) {
      found.add(codePoint)
    }
  }

  return found
}

/** Per-character Mandarin + Cantonese readings, for the CSV. */
function collectReadingValues(): Map<
  number,
  { mandarin: string; cantonese: string }
> {
  const text = readFileSync(
    path.join(CACHE_DIR, 'Unihan_Readings.txt'),
    'utf8',
  )
  const map = new Map<number, { mandarin: string; cantonese: string }>()

  for (const line of text.split('\n')) {
    if (line.length === 0 || line.startsWith('#')) {
      continue
    }
    const parts = line.split('\t')
    if (parts.length < 3) {
      continue
    }
    const [token, property, value] = parts
    if (property !== 'kMandarin' && property !== 'kCantonese') {
      continue
    }
    const codePoint = parseInt(token!.slice(2), 16)
    if (Number.isNaN(codePoint)) {
      continue
    }
    const entry = map.get(codePoint) ?? { mandarin: '', cantonese: '' }
    if (property === 'kMandarin') {
      entry.mandarin = value!.trim()
    } else {
      entry.cantonese = value!.trim()
    }
    map.set(codePoint, entry)
  }

  return map
}

/** Quote a CSV field only when it contains a comma, quote, or newline. */
function csvField(value: string): string {
  return /[",\n\r]/.test(value)
    ? `"${value.replace(/"/g, '""')}"`
    : value
}

/** Collapse a set of code points into sorted contiguous [start, end] ranges. */
function toRanges(codePoints: Set<number>): [number, number][] {
  const sorted = [...codePoints].sort((a, b) => a - b)
  const ranges: [number, number][] = []

  for (const cp of sorted) {
    const last = ranges[ranges.length - 1]
    if (last && cp === last[1] + 1) {
      last[1] = cp
    } else {
      ranges.push([cp, cp])
    }
  }

  return ranges
}

const hex = (n: number): string => `0x${n.toString(16).toUpperCase()}`

function main(): void {
  const sources = collectCodePoints(
    'Unihan_IRGSources.txt',
    CHINESE_SOURCE_PROPERTIES,
  )
  const readings = collectCodePoints(
    'Unihan_Readings.txt',
    CHINESE_READING_PROPERTIES,
  )

  const union = new Set<number>([...sources, ...readings])

  // choose the active set per flags
  const chosen = flag('readings-only')
    ? readings
    : flag('sources-only')
      ? sources
      : union
  const label = flag('readings-only')
    ? 'readings only (Mandarin/Cantonese/Pinyin) — tightest Sinitic'
    : flag('sources-only')
      ? 'IRG sources only (G/T/H/M)'
      : 'union of Chinese sources + readings (default)'

  const ranges = toRanges(chosen)

  // report
  console.error('')
  console.error(`Unihan ${UNIHAN_VERSION}  —  Chinese Han ideographs`)
  console.error(`  by Chinese SOURCE (G/T/H/M):        ${sources.size}`)
  console.error(`  by Chinese READING (Mand/Cant/PY):  ${readings.size}`)
  console.error(`  union (default):                    ${union.size}`)
  console.error(`  readings only, not sourced:         ${[...readings].filter(c => !sources.has(c)).length}`)
  console.error(`  sourced only, no reading:           ${[...sources].filter(c => !readings.has(c)).length}`)
  console.error('')
  console.error(`ACTIVE set: ${label}`)
  console.error(`  characters: ${chosen.size}`)
  console.error(`  contiguous ranges: ${ranges.length}`)
  console.error('')

  // emit a generated TypeScript module
  const out = [
    `// Generated by task/data/script/list-chinese-character-unicode-ranges.ts`,
    `// Unihan ${UNIHAN_VERSION}. Definition: ${label}.`,
    `// ${chosen.size} characters across ${ranges.length} contiguous ranges.`,
    `//`,
    `// These are Han ideographs USED IN CHINESE. They are shared with Japanese`,
    `// and Korean where those languages reuse the same characters; only`,
    `// exclusively non-Chinese characters (Korean-only hanja, Japanese-only`,
    `// kokuji, Vietnamese-only Nom) are excluded. There is no Unicode range for`,
    `// "Chinese and never Japanese/Korean" — that does not exist.`,
    `//`,
    `// Note: 〇 (U+3007, ideographic zero) is used in Chinese but is a symbol,`,
    `// not a Unihan ideograph, so add it separately if your app needs it.`,
    ``,
    `export const CHINESE_IDEOGRAPH_RANGES: ReadonlyArray<`,
    `  readonly [start: number, end: number]`,
    `> = [`,
    ...ranges.map(([s, e]) => `  [${hex(s)}, ${hex(e)}],`),
    `]`,
    ``,
    `export function isChineseIdeograph(character: string): boolean {`,
    `  const codePoint = character.codePointAt(0)`,
    `  if (codePoint === undefined) {`,
    `    return false`,
    `  }`,
    `  return CHINESE_IDEOGRAPH_RANGES.some(`,
    `    ([start, end]) => codePoint >= start && codePoint <= end,`,
    `  )`,
    `}`,
    ``,
  ].join('\n')

  const outPath = path.join(HERE, 'chinese-character-unicode-ranges.generated.ts')
  writeFileSync(outPath, out)
  console.error(`wrote ${path.relative(process.cwd(), outPath)}`)

  // per-character CSV: one row per Chinese ideograph with its readings.
  const readingValues = collectReadingValues()
  const csvPath = path.resolve(
    option('csv', 'base/chinese-symbols-unicode.csv'),
  )
  mkdirSync(path.dirname(csvPath), { recursive: true })

  const csvLines = ['code_point,decimal,character,mandarin,cantonese']
  for (const codePoint of [...chosen].sort((a, b) => a - b)) {
    const character = String.fromCodePoint(codePoint)
    const reading = readingValues.get(codePoint) ?? {
      mandarin: '',
      cantonese: '',
    }
    const codeLabel = `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`
    csvLines.push(
      [
        codeLabel,
        String(codePoint),
        csvField(character),
        csvField(reading.mandarin),
        csvField(reading.cantonese),
      ].join(','),
    )
  }
  writeFileSync(csvPath, csvLines.join('\n') + '\n')
  console.error(
    `wrote ${path.relative(process.cwd(), csvPath)} (${chosen.size} rows)`,
  )

  // also print the ranges to stdout for a quick look
  console.log(`// ${chosen.size} chars, ${ranges.length} ranges (${label})`)
  for (const [s, e] of ranges) {
    console.log(`[${hex(s)}, ${hex(e)}],`)
  }
}

ensureUnihan()
  .then(main)
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
