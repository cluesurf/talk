//! Ported from the v1 round-trip suite. talk is the canonical normal form, so
//! converting a talk letter to IPA and back must return the same talk letter.
//! This is the "no lossy data" guarantee. (IPA to talk to IPA is many-to-one on
//! purpose and is not asserted.)

use std::collections::BTreeSet;

use talk::string::data::phones;
use talk::{ipa_to_talk, talk_to_ipa};

fn inventory() -> Vec<&'static str> {
  let mut seen = BTreeSet::new();

  phones()
    .iter()
    .map(|phone| phone.talk.as_str())
    .filter(|talk| seen.insert(*talk))
    .collect()
}

#[test]
fn has_a_non_trivial_canonical_inventory() {
  assert!(inventory().len() > 100);
}

#[test]
fn every_canonical_talk_letter_round_trips() {
  let broken: Vec<String> = inventory()
    .into_iter()
    .filter_map(|talk| {
      let ipa = talk_to_ipa(talk);
      let back = ipa_to_talk(&ipa);

      (back != talk).then(|| format!("{talk} -> {ipa} -> {back}"))
    })
    .collect();

  assert_eq!(broken, Vec::<String>::new());
}

#[test]
fn the_rounded_front_vowel_pair_is_consistent_both_directions() {
  assert_eq!(talk_to_ipa("a$"), "ø");
  assert_eq!(ipa_to_talk("ø"), "a$");
  assert_eq!(talk_to_ipa("e$"), "œ");
  assert_eq!(ipa_to_talk("œ"), "e$");
}
