import type { Modifier } from './type'

// A sound is a base plus its modifiers, and any set of modifiers has exactly
// one talk spelling.
//
// THE MODIFIERS SHARE ONE PAIR OF BRACKETS. `kʷʰ` is `k<wh>`, not
// `k<w><h>`. Repeating the brackets per mark costs two characters each and
// says nothing extra: the run belongs to one base either way, and the
// contents are uniquely decodable, so the reader needs no separator to know
// where one mark ends and the next begins.
//
// WHY BRACKETS AT ALL. The marks used to be bare sigils and a run of them
// could not always be segmented back. Chao tone levels were `++ + * - --`,
// so `fu+++` was both `fu˥˦` and `fu˦˥` and the reader had to guess: a rise
// read back as a fall. Delimiting the run ends the whole class of defect
// rather than the one instance of it, and `()`, `[]` and `{}` stay free for
// the regular expressions the search surface uses.
//
// THE ORDER IS CANONICAL ON THE WAY OUT AND FREE ON THE WAY IN. `combine`
// sorts by slot, so one set of modifiers has one spelling and `k<wh>` and
// `k<hw>` cannot both be stored. The parser accepts either, the same way it
// accepts `n̪̥` and `n̥̪` for one sound and returns one of them.
//
// `pre` holds the modifiers that come BEFORE the base, in their own
// brackets. Position is a distinction rather than a spelling choice: `ʰk` is
// pre-aspirated and `kʰ` post-aspirated, `ⁿd` is prenasalized and `dⁿ`
// nasally released. They are different sounds, so they get different talk.
export function combine(
  baseTalk: string,
  mods: Modifier[],
  pre: Modifier[] = [],
): string {
  const ordered = [...mods].sort((a, b) => a.order - b.order)
  // Innermost last on the way in, so a pre-run mirrors the post-run.
  const leading = [...pre].sort((a, b) => b.order - a.order)

  return (
    wrap(leading.map(one => one.talk).join('')) +
    baseTalk +
    wrap(ordered.map(one => one.talk).join(''))
  )
}

/** A run of modifier tokens, bracketed, or nothing when the run is empty. */

function wrap(run: string): string {
  return run ? `<${run}>` : ''
}
