import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts', 'make/**/*.ts'],
  // Emit both ESM and CJS. ESM consumers (`import talk from '@cluesurf/talk'`)
  // need a real module so the default export is the talk object itself; a
  // CJS-only build makes Node's interop bind the default import to the whole
  // module namespace, hiding the API under a nested `.default`. CJS stays for
  // any `require()` consumers.
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: true,
  outDir: 'host',
  splitting: false,
  // Keep the bare-package deps external, but bundle lodash. Its subpath
  // imports (`lodash/merge`, `lodash/uniq`) are extensionless, which strict
  // Node ESM cannot resolve from an external import, so inlining lodash keeps
  // the ESM output self-contained and resolvable everywhere.
  external: ['@lancejpollard/script-tree', 'x-sampa-ipa'],
  noExternal: ['lodash'],
  // Handle path aliases
  esbuildOptions(options) {
    options.alias = {
      '~': '.',
    }
  },
})
