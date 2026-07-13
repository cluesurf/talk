// Copy the shared top-level base/ data into this package's code/base, so
// imports resolve and the build bundles it. The single source of truth is
// the repo-root base/; this copy is generated and gitignored.

import { cpSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = resolve(here, '../../../../base')
const target = resolve(here, '../../base')

rmSync(target, { recursive: true, force: true })
cpSync(source, target, { recursive: true })

console.log(`copied ${source} -> ${target}`)
