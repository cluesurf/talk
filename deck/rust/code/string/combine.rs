use crate::string::types::Modifier;

/// A sound is a base plus its modifiers in a fixed slot order, so any set of
/// modifiers has exactly one talk spelling.
///
/// `pre` holds the modifiers that come BEFORE the base. Position is a
/// distinction, not a spelling choice: `ʰk` is pre-aspirated and `kʰ`
/// post-aspirated, `ⁿd` is prenasalized and `dⁿ` nasally released. They are
/// different sounds, so they get different talk.
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

  for modifier in leading {
    talk.push_str(&modifier.talk);
  }

  talk.push_str(base_talk);

  for modifier in ordered {
    talk.push_str(&modifier.talk);
  }

  talk
}
