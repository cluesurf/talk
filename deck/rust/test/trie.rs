use talk::trie::build_trie;

fn fixture() -> talk::trie::Trie<&'static str> {
  build_trie([
    ("t", "T"),
    ("th~", "TH"),
    ("ty~", "TY"),
    // Astral character, four bytes in UTF-8.
    ("\u{1DF0A}", "CLICK"),
  ])
}

#[test]
fn takes_the_longest_matching_prefix() {
  assert_eq!(fixture().match_at("th~a", 0), Some((&"TH", 3)));
}

#[test]
fn falls_back_to_a_shorter_key_when_the_longer_one_does_not_match() {
  assert_eq!(fixture().match_at("tz", 0), Some((&"T", 1)));
}

#[test]
fn matches_from_an_offset() {
  assert_eq!(fixture().match_at("xty~", 1), Some((&"TY", 3)));
}

#[test]
fn returns_nothing_when_nothing_matches() {
  assert_eq!(fixture().match_at("zzz", 0), None);
}

#[test]
fn matches_an_astral_key() {
  assert_eq!(fixture().match_at("\u{1DF0A}", 0), Some((&"CLICK", 4)));
}

#[test]
fn keeps_the_first_spelling_when_a_key_is_added_twice() {
  let dupes = build_trie([("a", "first"), ("a", "second")]);

  assert_eq!(dupes.match_at("a", 0), Some((&"first", 1)));
}

#[test]
fn lists_every_prefix_shortest_first() {
  let trie = fixture();

  assert_eq!(trie.match_all_at("th~a", 0), vec![(&"T", 1), (&"TH", 3)]);
}

#[test]
fn skips_an_empty_key() {
  let trie = build_trie([("", "EMPTY"), ("a", "A")]);

  assert_eq!(trie.match_at("", 0), None);
  assert_eq!(trie.match_at("a", 0), Some((&"A", 1)));
}
