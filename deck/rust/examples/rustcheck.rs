fn main() {
  for (a,b) in [("n\u{325}\u{32a}","n\u{32a}\u{325}"),("kʷʰ","kʰʷ"),("ʰk","kʰ")] {
    println!("{:?} vs {:?} -> equal? {}", a, b, talk::normalize_ipa(a)==talk::normalize_ipa(b));
  }
}
