fn main() {
  let input = "m\u{325}\u{1da3}";
  for unit in talk::parse_ipa(input) {
    if let talk::IpaUnit::Phone { base, modifiers, pre } = unit {
      println!(
        "base {} pre {:?} post {:?}",
        base.talk,
        pre.iter().map(|m| &m.feature).collect::<Vec<_>>(),
        modifiers.iter().map(|m| (&m.feature, m.order)).collect::<Vec<_>>()
      );
    } else {
      println!("other unit");
    }
  }
  println!("-> {:?}", talk::ipa_to_talk(input));
}
