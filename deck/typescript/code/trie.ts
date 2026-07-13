// A double-array trie for static longest-prefix matching.
//
// Build once from a fixed set of keys, then scan. This is the base/check
// integer-array representation used by production tokenizers: a
// transition is one array index, with no per-node objects and no
// allocation per match. It is the standard "best structure for static
// longest-match".
//
// State s transitions on a character with dense code c to state
// `base[s] + c`, valid only when `check[base[s] + c] === s`. A state
// carries a value when the prefix that reaches it is itself a key.
//
// Each character is mapped to its dense code through a small Map. The
// alphabet is sparse and high (astral IPA symbols reach into the surrogate
// range), so a Map of the ~150 real characters is far smaller than a flat
// array spanning the whole code-unit range, and just as fast in practice.

// A matched value and the number of code units it spanned.
type Match<T> = { value: T; length: number }

// A temporary node used only while building, then discarded.
type BuildNode<T> = {
  children: Map<number, BuildNode<T>>
  value?: T
}

export class TrieBuilder<T> {
  private charToCode = new Map<number, number>()
  private nextCode = 1
  private root: BuildNode<T> = { children: new Map() }

  add(key: string, value: T): void {
    if (!key) {
      return
    }

    let node = this.root

    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)

      // Remap sparse character codes to a dense 1.. alphabet so base
      // offsets stay small.
      let code = this.charToCode.get(char)

      if (code === undefined) {
        code = this.nextCode++
        this.charToCode.set(char, code)
      }

      let child = node.children.get(code)

      if (!child) {
        child = { children: new Map() }
        node.children.set(code, child)
      }

      node = child
    }

    // First key wins, matching the data's declaration order.
    node.value ??= value
  }

  build(): Trie<T> {
    // Index 0 is unused, state 1 is the root.
    const base = [0, 0]
    const check = [0, 0]
    const value: (T | undefined)[] = [undefined, this.root.value]
    const taken = [true, true]

    const grow = (upto: number) => {
      while (base.length <= upto) {
        base.push(0)
        check.push(0)
        value.push(undefined)
        taken.push(false)
      }
    }

    const queue: { node: BuildNode<T>; state: number }[] = [
      { node: this.root, state: 1 },
    ]

    let head = 0
    let firstFree = 2

    while (head < queue.length) {
      const { node, state } = queue[head++]

      if (node.children.size === 0) {
        continue
      }

      const codes = [...node.children.keys()]

      let least = codes[0]

      for (const code of codes) {
        if (code < least) {
          least = code
        }
      }

      // Find a base b so every child slot b + code is free.
      let b = Math.max(1, firstFree - least)

      for (;;) {
        let fits = true

        for (const code of codes) {
          grow(b + code)

          if (taken[b + code]) {
            fits = false
            break
          }
        }

        if (fits) {
          break
        }

        b++
      }

      base[state] = b

      for (const [code, child] of node.children) {
        const pos = b + code

        taken[pos] = true
        check[pos] = state
        value[pos] = child.value
        queue.push({ node: child, state: pos })
      }

      while (firstFree < taken.length && taken[firstFree]) {
        firstFree++
      }
    }

    return new Trie<T>(this.charToCode, base, check, value)
  }
}

export class Trie<T> {
  // How many code units the last successful `matchAt` consumed. Read it
  // right after a `matchAt` that returned a value, before the next call.
  matchedLength = 0

  constructor(
    private charToCode: Map<number, number>,
    private base: number[],
    private check: number[],
    private value: (T | undefined)[],
  ) {}

  // The value of the longest key that is a prefix of `text` at `at`, or
  // undefined if none. On a hit, `matchedLength` holds its length.
  matchAt(text: string, at: number): T | undefined {
    const { charToCode, base, check, value } = this
    const stateLimit = check.length

    let state = 1
    let bestValue: T | undefined
    let bestLength = 0

    for (let i = at; i < text.length; i++) {
      const code = charToCode.get(text.charCodeAt(i))

      if (code === undefined) {
        break
      }

      const next = base[state] + code

      if (next >= stateLimit || check[next] !== state) {
        break
      }

      state = next

      const hit = value[state]

      if (hit !== undefined) {
        bestValue = hit
        bestLength = i - at + 1
      }
    }

    this.matchedLength = bestLength

    return bestValue
  }

  // Every key that is a prefix of `text` at `at`, with its length, from
  // shortest to longest.
  matchAllAt(text: string, at: number): Match<T>[] {
    const { charToCode, base, check, value } = this
    const stateLimit = check.length

    let state = 1
    const hits: Match<T>[] = []

    for (let i = at; i < text.length; i++) {
      const code = charToCode.get(text.charCodeAt(i))

      if (code === undefined) {
        break
      }

      const next = base[state] + code

      if (next >= stateLimit || check[next] !== state) {
        break
      }

      state = next

      const hit = value[state]

      if (hit !== undefined) {
        hits.push({ value: hit, length: i - at + 1 })
      }
    }

    return hits
  }
}

export function buildTrie<T>(entries: [string, T][]): Trie<T> {
  const builder = new TrieBuilder<T>()

  for (const [key, value] of entries) {
    builder.add(key, value)
  }

  return builder.build()
}
