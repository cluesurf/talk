/**
 * Filter the Chinese-symbols CSV down to characters that ACTUALLY render in the
 * base system fonts, dropping the ones that show as the missing-glyph tofu box.
 *
 * METHOD: a character renders in a font iff the font's `cmap` maps its code
 * point to a glyph. That is the deterministic ground truth (what any font
 * library reads). We do NOT render + OCR-detect tofu (slow, and a browser's
 * fallback fonts contaminate the result with characters that are NOT actually
 * in the common base font).
 *
 * MODEL (as requested): build a coverage list PER FONT, then keep only the code
 * points present in EVERY list (the intersection = "renders on all of them").
 * Coverage lists accumulate under the coverage dir, so you can extract Mac fonts
 * here, Windows fonts on a Windows box (or CI), then re-run to intersect all.
 *
 * We deliberately EXCLUDE Noto CJK: it is near-complete and would not reflect
 * what the everyday desktop defaults (PingFang / YaHei / SimSun) actually ship,
 * and being a superset it never tightens the intersection anyway.
 *
 * Uses fonttools (via whichever Python the `fonttools` CLI is installed under).
 *
 * Usage:
 *   # extract coverage for one or more fonts, then intersect + filter:
 *   pnpm exec tsx task/data/script/filter-glyphs-by-font-coverage.ts \
 *     --font "/System/Library/PrivateFrameworks/FontServices.framework/Versions/A/Resources/Reserved/PingFangUI.ttc"
 *
 *   # re-run with no --font to just re-intersect whatever coverage files exist:
 *   pnpm exec tsx task/data/script/filter-glyphs-by-font-coverage.ts
 *
 * Flags:
 *   --font <path>       (repeatable) extract this font's coverage
 *   --in <csv>          input CSV   (default hold/base/script/chinese-symbols-unicode.csv)
 *   --out <csv>         output CSV  (default hold/base/script/chinese-symbols-unicode-common.csv)
 *   --coverage-dir <d>  where per-font coverage lists live (default tmp/.font-coverage)
 */

import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
function optionAll(name: string): string[] {
  const out: string[] = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === `--${name}` && argv[i + 1]) {
      out.push(argv[i + 1]!)
    }
  }
  return out
}
function option(name: string, fallback: string): string {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1]! : fallback
}

const IN_CSV = path.resolve(
  option('in', 'hold/base/script/chinese-symbols-unicode.csv'),
)
const OUT_CSV = path.resolve(
  option('out', 'hold/base/script/chinese-symbols-unicode-common.csv'),
)
const COVERAGE_DIR = path.resolve(option('coverage-dir', 'tmp/.font-coverage'))
const FONTS = optionAll('font')

/** The Python interpreter that has fontTools (the one the `fonttools` CLI runs under). */
function fonttoolsPython(): string {
  try {
    execFileSync('python3', ['-c', 'import fontTools'], { stdio: 'ignore' })
    return 'python3'
  } catch {
    // fall back to the shebang of the installed `fonttools` CLI
    const cli = execFileSync('which', ['fonttools']).toString().trim()
    const shebang = readFileSync(cli, 'utf8').split('\n')[0] ?? ''
    const py = shebang.replace(/^#!/, '').trim()
    if (!py) {
      throw new Error(
        'Could not find a Python with fonttools. Install it (pip install fonttools) or ensure `fonttools` is on PATH.',
      )
    }
    return py
  }
}

// Python snippet: dump every Unicode code point a font's cmap covers (handles
// .ttc collections + all Unicode subtables incl. supplementary plane).
const EXTRACT_PY = `
import sys
from fontTools.ttLib import TTFont, TTCollection
path = sys.argv[1]
try:
    fonts = TTCollection(path).fonts
except Exception:
    fonts = [TTFont(path, fontNumber=0)]
cps = set()
for f in fonts:
    if 'cmap' not in f:
        continue
    for t in f['cmap'].tables:
        if t.isUnicode():
            cps.update(t.cmap.keys())
sys.stdout.write("\\n".join(str(c) for c in sorted(cps)))
`

function coverageFileFor(fontPath: string): string {
  const base = path.basename(fontPath).replace(/[^A-Za-z0-9._-]/g, '_')
  return path.join(COVERAGE_DIR, `${base}.txt`)
}

function extractCoverage(python: string, fontPath: string): void {
  if (!existsSync(fontPath)) {
    throw new Error(`font not found: ${fontPath}`)
  }
  console.error(`[coverage] reading cmap: ${fontPath}`)
  const out = execFileSync(python, ['-c', EXTRACT_PY, fontPath], {
    maxBuffer: 256 * 1024 * 1024,
  }).toString()
  const outPath = coverageFileFor(fontPath)
  writeFileSync(outPath, out.endsWith('\n') ? out : out + '\n')
  const count = out.split('\n').filter(Boolean).length
  console.error(
    `[coverage] ${path.basename(fontPath)} covers ${count} code points -> ${path.relative(process.cwd(), outPath)}`,
  )
}

function readCoverage(file: string): Set<number> {
  const set = new Set<number>()
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (line.length === 0) {
      continue
    }
    const n = Number(line)
    if (!Number.isNaN(n)) {
      set.add(n)
    }
  }
  return set
}

function main(): void {
  mkdirSync(COVERAGE_DIR, { recursive: true })

  if (FONTS.length > 0) {
    const python = fonttoolsPython()
    for (const font of FONTS) {
      extractCoverage(python, font)
    }
  }

  const coverageFiles = readdirSync(COVERAGE_DIR)
    .filter(f => f.endsWith('.txt'))
    .map(f => path.join(COVERAGE_DIR, f))

  if (coverageFiles.length === 0) {
    console.error(
      '[filter] no coverage lists yet. Pass --font <path> to extract one first.',
    )
    process.exit(1)
  }

  // load the CSV first, so we can report per-font coverage OF OUR set
  const csv = readFileSync(IN_CSV, 'utf8').split('\n')
  const header = csv[0]!
  const rows = csv.slice(1).filter(line => line.length > 0)
  const ourCodePoints = new Set<number>(
    rows.map(line => Number(line.split(',')[1])),
  )

  // intersect coverage across every font list
  let keep: Set<number> | null = null
  console.error(`\n[filter] intersecting ${coverageFiles.length} font list(s):`)
  for (const file of coverageFiles) {
    const cov = readCoverage(file)
    const ofOurs = [...ourCodePoints].filter(c => cov.has(c)).length
    console.error(
      `  ${path.basename(file).padEnd(28)} covers ${ofOurs} / ${ourCodePoints.size} of our characters`,
    )
    keep =
      keep === null
        ? new Set([...ourCodePoints].filter(c => cov.has(c)))
        : new Set([...keep].filter(c => cov.has(c)))
  }

  const kept = keep ?? new Set<number>()
  const outRows = rows.filter(line => kept.has(Number(line.split(',')[1])))

  mkdirSync(path.dirname(OUT_CSV), { recursive: true })
  writeFileSync(OUT_CSV, [header, ...outRows].join('\n') + '\n')

  console.error('')
  console.error(`input:   ${rows.length} characters`)
  console.error(`kept:    ${outRows.length} (render in all fonts)`)
  console.error(`dropped: ${rows.length - outRows.length} (tofu in at least one)`)
  console.error(`wrote ${path.relative(process.cwd(), OUT_CSV)}`)
}

main()
