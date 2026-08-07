use talk::{Notation, Space, Tier, byte_width, count_space, size_of};

fn main() {
  println!("  notation tier  producible     codec      bytes");
  for notation in [Notation::Ipa, Notation::Tone] {
    for tier in [Tier::Seed, Tier::Band, Tier::Mesh] {
      println!(
        "  {:?} {:?} {:>12} {:>12} {:>5}",
        notation,
        tier,
        count_space(notation, tier, Space::Producible),
        size_of(notation, tier),
        byte_width(notation, tier)
      );
    }
  }
}
