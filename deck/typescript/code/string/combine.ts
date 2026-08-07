import type { Modifier } from './type'

// A sound is a base plus its modifiers in a fixed slot order, so any set
// of modifiers has exactly one talk spelling.
//
// `pre` holds the modifiers that come BEFORE the base. Position is a
// distinction, not a spelling choice: `ʰk` is pre-aspirated and `kʰ`
// post-aspirated, `ⁿd` is prenasalized and `dⁿ` nasally released. They are
// different sounds, so they get different talk.
export function combine(
  baseTalk: string,
  mods: Modifier[],
  pre: Modifier[] = [],
): string {
  const ordered = [...mods].sort((a, b) => a.order - b.order)
  // Innermost last on the way in, so a pre-run mirrors the post-run.
  const leading = [...pre].sort((a, b) => b.order - a.order)

  return (
    leading.map(m => m.talk).join('') +
    baseTalk +
    ordered.map(m => m.talk).join('')
  )
}
