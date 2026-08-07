import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'code/index.ts',
    'code/syllable/index.ts',
    'code/token/index.ts',
  ],
  // Emit both ESM and CJS. ESM consumers (`import talk from '@cluesurf/talk'`)
  // need a real module so the default export is the talk object itself; a
  // CJS-only build makes Node's interop hide the API under a nested
  // `.default`. CJS stays for any `require()` consumers.
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'host',
  splitting: false,
  // Zero runtime dependencies: the JSON data files are inlined into the
  // bundle, and there are no external packages to keep out.
})
