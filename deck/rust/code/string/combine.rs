use crate::string::types::Modifier;

/// A sound is a base plus its modifiers in a fixed slot order, so any set of
/// modifiers has exactly one talk spelling.
///
/// THE MODIFIERS SHARE ONE PAIR OF BRACKETS. `kʷʰ` is `k<wh>`, not
/// `k<w><h>`. Repeating the brackets per mark costs two characters each and
/// says nothing extra: the run belongs to one base either way, and the
/// contents are uniquely decodable, so the reader needs no separator to know
/// where one mark ends and the next begins.
///
/// WHY BRACKETS AT ALL. The marks used to be bare sigils and a run of them
/// could not always be segmented back. Chao tone levels were `++ + * - --`,
/// so `fu+++` was both `fu˥˦` and `fu˦˥` and the reader had to guess: a rise
/// read back as a fall. Delimiting the run ends the whole class of defect,
/// and `()`, `[]` and `{}` stay free for regular expressions.
///
/// `pre` holds the modifiers that come BEFORE the base, in their own
/// brackets. Position is a distinction, not a spelling choice: `ʰk` is
/// pre-aspirated and `kʰ` post-aspirated, `ⁿd` is prenasalized and `dⁿ`
/// nasally released. They are different sounds, so they get different talk.
pub fn combine(
  base_talk: &str,
  mods: &[&Modifier],
  pre: &[&Modifier],
) -> String {
  let mut ordered = mods.to_vec();

  ordered.sort_by_key(|modifier| modifier.order);

  // Innermost last on the way in, so a pre-run mirrors the post-run.
  let mut leading = pre.to_vec();

  leading.sort_by_key(|modifier| std::cmp::Reverse(modifier.order));

  let mut talk = String::new();

  let mut lead = String::new();

  for modifier in leading {
    lead.push_str(&modifier.talk);
  }

  talk.push_str(&wrap(&lead));
  talk.push_str(base_talk);

  let mut trail = String::new();

  for modifier in ordered {
    trail.push_str(&modifier.talk);
  }

  talk.push_str(&wrap(&trail));

  talk
}

/// A run of modifier tokens, bracketed, or nothing when the run is empty.
fn wrap(run: &str) -> String {
  if run.is_empty() {
    String::new()
  } else {
    format!("<{run}>")
  }
}
