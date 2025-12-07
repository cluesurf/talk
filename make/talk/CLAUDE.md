# Talk Module Rules

## Must Do

- **ALWAYS use ES module imports, NEVER use require!** Always use `import` statements,
  never use `require()` statements in TypeScript files.
- **NEVER use .default when importing!** Always use proper ES module imports without
  accessing `.default` property. If you need the default export, use `import name from 'module'`.
- **NEVER add custom regexp or hardcoded letter patterns in syllables.ts!**
  The syllabification logic should work purely with cluster types (CONSONANT, VOWEL, 
  START_CONSONANT, END_CONSONANT, FULL_CONSONANT), not specific letters or patterns.
- **NEVER change cluster-definitions.ts!**
  The user will manage all changes to cluster definitions (consonants, vowels, 
  startConsonants, endConsonants, fullConsonants). Do not modify these lists.