import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts', 'make/**/*.ts'],
  format: ['esm'],
  dts: false, // Disable .d.ts generation since tsc doesn't support bundler resolution
  sourcemap: true,
  clean: true,
  outDir: 'host',
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
