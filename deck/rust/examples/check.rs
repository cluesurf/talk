fn main() {
  for i in [
    "\u{2b0}k", "k\u{2b0}", "\u{207f}d", "d\u{207f}", "p\u{2b0}k",
    "a\u{2b0}k", "m\u{2b0}k", "s\u{2b0}", "n\u{325}\u{32a}",
  ] {
    let t = talk::ipa_to_talk(i);
    let back = talk::talk_to_ipa(&t);
    let want = talk::normalize_ipa(i);
    println!(
      "{:?} -> {:?} {}",
      i,
      t,
      if back == want { "ok" } else { "DIFF" }
    );
  }
  for t in ["h!!", "h~k", "n~d", "ph~k", "ah~k", "sh~k"] {
    println!("  {:?} -> {:?}", t, talk::talk_to_ipa(t));
  }
}
