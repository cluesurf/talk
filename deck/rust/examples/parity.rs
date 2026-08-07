use std::fs;

fn main() {
  let raw = fs::read_to_string("/tmp/ts-parity.json").expect("fixture");
  let rows: Vec<Vec<String>> = serde_json::from_str(&raw).expect("json");
  let mut bad = 0;

  for row in &rows {
    let talk_out = talk::ipa_to_talk(&row[0]);
    let machine: Vec<String> = talk::machine(&talk_out, talk::Notation::Tone, talk::Tier::Mesh)
      .iter()
      .map(|code| code.to_string())
      .collect();

    if talk_out != row[1]
      || machine.join(" ") != row[2]
      || talk::normalize_ipa(&row[0]) != row[3]
    {
      if bad < 3 {
        println!("  {:?} ts {:?} rs {:?}", row[0], row[1], talk_out);
      }
      bad += 1;
    }
  }

  println!("rust mismatches: {} of {}", bad, rows.len());
}
