import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts', 'make/**/*.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  outDir: 'host',
  splitting: false,
  // Important: don't bundle dependencies
  external: ['@lancejpollard/script-tree', 'lodash', 'x-sampa-ipa'],
  // Skip type checking
  skipNodeModulesBundle: true,
  // Handle path aliases
  esbuildOptions(options) {
    options.alias = {
      '~': '.',
    }
  },
})
