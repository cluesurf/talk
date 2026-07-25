use crate::string::types::Modifier;

/// A sound is a base plus its modifiers in a fixed slot order, so any set of
/// modifiers has exactly one talk spelling.
pub fn combine(base_talk: &str, mods: &[&Modifier]) -> String {
  let mut ordered = mods.to_vec();

  ordered.sort_by_key(|modifier| modifier.order);

  let mut talk = String::from(base_talk);

  for modifier in ordered {
    talk.push_str(&modifier.talk);
  }

  talk
}
