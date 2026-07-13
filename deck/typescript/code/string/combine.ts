import type { Modifier } from './type'

// A sound is a base plus its modifiers in a fixed slot order, so any set
// of modifiers has exactly one talk spelling.
export function combine(baseTalk: string, mods: Modifier[]): string {
  const ordered = [...mods].sort((a, b) => a.order - b.order)

  return baseTalk + ordered.map(m => m.talk).join('')
}
