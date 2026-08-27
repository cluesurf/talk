//! Convert the shared fixture so the result can be diffed against the
//! TypeScript library, which is the reference for the new notation.
use std::fs;

fn main() {
  let raw = fs::read_to_string(
    "../typescript/test/fixture/pronunciation-sample.json",
  )
  .expect("fixture");
  let cases: serde_json::Value = serde_json::from_str(&raw).expect("json");
  let mut out = serde_json::Map::new();

  for case in cases.as_array().expect("array") {
    let ipa = case["ipa"].as_str().expect("ipa");

    out.insert(
      ipa.to_string(),
      serde_json::Value::String(talk::ipa_to_talk(ipa)),
    );
  }

  fs::write(
    "tmp_parity.json",
    serde_json::to_string(&serde_json::Value::Object(out)).expect("write"),
  )
  .expect("write");

  println!("{} converted", cases.as_array().expect("array").len());
}
