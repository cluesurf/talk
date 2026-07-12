import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: false,
    include: ['**/*.test.ts'],
  },
  resolve: {
    // Mirror the `~/*` -> `./*` path alias from tsconfig.json so the
    // test files can import from `~/make` the same way the source does.
    alias: {
      '~': root,
    },
  },
})
