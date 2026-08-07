//! Ported from the v1 coverage suite. The IPA charts (base/ipa/*.csv) are the
//! full inventory. Every chart symbol must either be a cleanly supported phone
//! or be listed in missing.csv as a known, unsupported symbol. Nothing is
//! allowed to silently fall through. A provisional phone is only an approximate
//! fallback for an otherwise-unsupported symbol, so it does not count as
//! supported (those symbols belong in missing.csv).

use std::collections::HashSet;

use talk::string::data::phones;
use talk::string::runtime::nfd;

fn column(raw: &str) -> Vec<&str> {
  raw
    .trim()
    .lines()
    .skip(1)
    .filter_map(|line| line.split(',').next())
    .filter(|symbol| !symbol.is_empty())
    .collect()
}

/// The ring above and the ring below are the same feature; `normalize_ipa`
/// folds them onto the ring below and phones.json now stores that form, while
/// the charts still write the ring above where a descender needs it.
fn fold(text: &str) -> String {
  nfd(text).replace('\u{030a}', "\u{0325}")
}

fn supported() -> HashSet<String> {
  phones()
    .iter()
    .filter(|phone| !phone.provisional)
    .map(|phone| fold(&phone.ipa))
    .collect()
}

fn is_supported(symbol: &str) -> bool {
  supported().contains(&fold(symbol))
}

fn consonants() -> Vec<&'static str> {
  column(include_str!("../base/ipa/consonants.csv"))
}

fn vowels() -> Vec<&'static str> {
  column(include_str!("../base/ipa/vowels.csv"))
}

fn missing() -> HashSet<&'static str> {
  column(include_str!("../base/ipa/missing.csv"))
    .into_iter()
    .collect()
}

#[test]
fn every_consonant_is_either_supported_or_documented_missing() {
  let known = missing();
  let unaccounted: Vec<&str> = consonants()
    .into_iter()
    .filter(|symbol| !is_supported(symbol) && !known.contains(symbol))
    .collect();

  assert_eq!(unaccounted, Vec::<&str>::new());
}

#[test]
fn every_vowel_is_either_supported_or_documented_missing() {
  let known = missing();
  let unaccounted: Vec<&str> = vowels()
    .into_iter()
    .filter(|symbol| !is_supported(symbol) && !known.contains(symbol))
    .collect();

  assert_eq!(unaccounted, Vec::<&str>::new());
}

#[test]
fn missing_csv_lists_no_symbol_that_is_actually_supported() {
  let mut stale: Vec<&str> = missing()
    .into_iter()
    .filter(|symbol| is_supported(symbol))
    .collect();

  stale.sort_unstable();

  assert_eq!(stale, Vec::<&str>::new());
}

#[test]
fn missing_csv_lists_only_symbols_that_appear_in_the_charts() {
  let in_chart: HashSet<&str> = consonants().into_iter().chain(vowels()).collect();
  let mut orphaned: Vec<&str> = missing()
    .into_iter()
    .filter(|symbol| !in_chart.contains(symbol))
    .collect();

  orphaned.sort_unstable();

  assert_eq!(orphaned, Vec::<&str>::new());
}

#[test]
fn every_chart_symbol_maps_to_a_talk_spelling() {
  let unmapped: Vec<&str> = phones()
    .iter()
    .filter(|phone| phone.talk.is_empty())
    .map(|phone| phone.ipa.as_str())
    .collect();

  assert_eq!(unmapped, Vec::<&str>::new());
}
