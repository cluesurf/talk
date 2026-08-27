use std::collections::HashSet;

use talk::string::data::phones;
use talk::string::runtime::nfd;
use talk::{Notation, Tier, enumerate_sounds, normalize_ipa, ipa_to_talk, machine, readable, segment, talk_to_ipa, Kind};

// ─── coverage ────────────────────────────────────────────────────────────────

#[test]
fn maps_every_phone_ipa_back_to_its_own_talk_spelling() {
  let drift: Vec<String> = phones()
    .iter()
    .filter_map(|phone| {
      // A phone distinguished ONLY by a mark this encoding drops (the raised
      // `˔` on `ɹ̠˔`, `̝` on `ʟ̝`) collapses onto its plain base by design, so
      // it has no talk spelling of its own to come back to. `normalize_ipa`
      // changing the string is exactly that condition.
      if normalize_ipa(&phone.ipa) != nfd(&phone.ipa) {
        return None;
      }

      let got = ipa_to_talk(&phone.ipa);

      (got != phone.talk).then(|| format!("{}: {got} != {}", phone.ipa, phone.talk))
    })
    .collect();

  assert_eq!(drift, Vec::<String>::new());
}

// ─── machine encoding ────────────────────────────────────────────────────────

#[test]
fn gives_exactly_one_code_point_per_phone() {
  let bad: Vec<&str> = phones()
    .iter()
    .filter(|phone| machine(&phone.talk, Notation::Tone, Tier::Mesh).len() != 1)
    .map(|phone| phone.talk.as_str())
    .collect();

  assert_eq!(bad, Vec::<&str>::new());
}

#[test]
fn gives_exactly_one_code_point_per_enumerated_sound() {
  let bad: Vec<String> = enumerate_sounds()
    .into_iter()
    .filter(|sound| machine(&sound.talk, Notation::Tone, Tier::Mesh).len() != 1)
    .map(|sound| sound.talk)
    .collect();

  assert_eq!(bad, Vec::<String>::new());
}

#[test]
fn never_gives_two_sounds_the_same_code() {
  // The registry is gone, so this checks the COMPUTED codes are still a
  // bijection: what `tokens.json` used to guarantee by construction now has
  // to hold by arithmetic.
  let mut seen: std::collections::HashMap<i64, String> =
    std::collections::HashMap::new();
  let mut dupes: Vec<String> = Vec::new();

  for sound in enumerate_sounds() {
    let codes = machine(&sound.talk, Notation::Tone, Tier::Mesh);

    let Some(&code) = codes.first() else { continue };

    if code < 0 {
      continue;
    }

    match seen.get(&code) {
      Some(prior) if *prior != sound.talk => {
        dupes.push(format!("{prior} and {} both -> {code}", sound.talk));
      }
      _ => {
        seen.insert(code, sound.talk);
      }
    }
  }

  assert_eq!(dupes, Vec::<String>::new());
}

// ─── round trips ─────────────────────────────────────────────────────────────

#[test]
fn ipa_to_talk_to_ipa_is_stable() {
  for word in ["tʰa", "kʷasˤo", "ˈmama", "ãtu", "sˤuːl", "nʲokʰ"] {
    let talk = ipa_to_talk(word);

    // A second pass through talk to ipa to talk is a fixed point.
    assert_eq!(ipa_to_talk(&talk_to_ipa(&talk)), talk);
  }
}

#[test]
fn canonicalizes_modifier_order() {
  // Aspiration then labialization collapses to the canonical spelling.
  assert_eq!(ipa_to_talk("tʰʷ"), ipa_to_talk("tʷʰ"));
}

// ─── api ─────────────────────────────────────────────────────────────────────

#[test]
fn exposes_the_conversions_at_the_crate_root() {
  assert_eq!(ipa_to_talk("tʰ"), "t<h>");
  assert_eq!(talk_to_ipa("t<h>"), "tʰ");
  assert_eq!(readable("t<h>"), "tʰ");
  assert_eq!(machine("t<h>", Notation::Tone, Tier::Mesh).len(), 1);
}

#[test]
fn tokenizes_into_sounds_with_features() {
  let sounds = segment("t<h>a");
  let first = &sounds[0];

  assert_eq!(first.base.map(|phone| phone.talk.as_str()), Some("t"));
  assert_eq!(
    first
      .modifiers
      .iter()
      .map(|modifier| modifier.feature.as_str())
      .collect::<Vec<_>>(),
    vec!["aspirated"]
  );
}

#[test]
fn carries_symbols_and_numerals_through() {
  assert_eq!(readable("\\. 7"), ". 7");
  assert_eq!(segment("\\. 7")[0].kind, Kind::Symbol);
}

/// A tone contour is a SEQUENCE, and the run used to be sorted by pitch.
///
/// `˩˩˦` is a rise and `˦˩˩` is a fall, spelled with the same three letters.
/// Sorting them turned every rise into a fall across the corpus and the
/// original could not be recovered. Not covered by `test/parity.rs`, which
/// exercises `segment`, `machine` and `enumerate_sounds` but never
/// `normalize_ipa`, so the defect was invisible to every test here.
#[test]
fn keeps_tone_runs_in_source_order() {
  // Thai, rising.
  assert_eq!(normalize_ipa("la˦˥"), "la˦˥");
  assert_eq!(normalize_ipa("tʰaːn˩˩˦"), "tʰaːn˩˩˦");
  assert_eq!(
    normalize_ipa("muːn˧la˦˥tʰaːn˩˩˦"),
    "muːn˧la˦˥tʰaːn˩˩˦"
  );

  // Mandarin third tone, a dip to the bottom and back up. Sorted it read 421.
  assert_eq!(normalize_ipa("ma˨˩˦"), "ma˨˩˦");
  assert_eq!(normalize_ipa("ma˧˥"), "ma˧˥");

  // Vietnamese hỏi, dipping-rising.
  assert_eq!(normalize_ipa("maː˧˩˧"), "maː˧˩˧");

  // Downstep lowers the register of what follows it, so which side of a tone
  // letter it sits on is the difference between two readings.
  assert_eq!(normalize_ipa("a↓˥"), "a↓˥");
  assert_eq!(normalize_ipa("a˥↓"), "a˥↓");

  // Two combining accents on one vowel spell a contour the same way two Chao
  // letters do, and neither appears in `MARK_ORDER`.
  assert_eq!(normalize_ipa("a\u{030b}\u{030f}"), "a\u{030b}\u{030f}");
  assert_eq!(normalize_ipa("a\u{030f}\u{030b}"), "a\u{030f}\u{030b}");
}

/// This used to assert `a˥ʰ` and `aʰ˥` were one string. They are not.
///
/// A tone letter is a point in time and a mark before it is not the same as a
/// mark after it, which is the whole reason Vietnamese can write `˦ˀ˥` and
/// mean a rise with a catch partway up.
#[test]
fn keeps_a_mark_on_the_side_of_the_tone_letter_it_was_written_on() {
  assert_ne!(normalize_ipa("a˥ʰ"), normalize_ipa("aʰ˥"));
  assert_eq!(normalize_ipa("a˥ʰ"), "a˥ʰ");
  assert_eq!(normalize_ipa("aʰ˥"), "aʰ˥");
}

/// 2,838 rows. The Vietnamese ngã tone is a rise interrupted by
/// glottalisation partway up, and sorting left a catch followed by a clean
/// rise, which is a different tone.
#[test]
fn keeps_the_vietnamese_glottal_inside_its_contour() {
  assert_eq!(normalize_ipa("ɣo˦ˀ˥"), "ɣo˦ˀ˥");
  assert_eq!(normalize_ipa("maːŋ˦ˀ˥"), "maːŋ˦ˀ˥");
  assert_eq!(normalize_ipa("ŋaː˦ˀ˥"), "ŋaː˦ˀ˥");
}

/// 3,707 rows across three languages. U+02D0 has combining class zero, so an
/// accent pushed past it attaches to the length mark and renders on it.
#[test]
fn keeps_a_tone_accent_on_its_vowel() {
  assert_eq!(normalize_ipa("t\u{02bc}o\u{0301}\u{02d0}"), "t\u{02bc}o\u{0301}\u{02d0}");
}

/// Neither the dental nor the voiceless mark is an anchor and both are true of
/// the whole segment, so either input reaches the same string.
#[test]
fn still_canonicalises_the_marks_that_do_commute() {
  assert_eq!(
    normalize_ipa("n\u{032a}\u{0325}"),
    normalize_ipa("n\u{0325}\u{032a}")
  );
}

/// Applying it twice has to change nothing, or the export cannot apply it at
/// more than one stage.
#[test]
fn tone_normalizing_is_idempotent() {
  for one in ["ma˨˩˦", "tʰaːn˩˩˦", "a↓˥", "maː˧˩˧"] {
    let once = normalize_ipa(one);
    assert_eq!(normalize_ipa(&once), once);
  }
}

/// Normalizing folds duplicate spellings. It does not delete information.
///
/// `DROP` used to hold the tie above, the tie below, the syllable boundary
/// and the link, and every one of them said something the source meant.
#[test]
fn drops_nothing() {
  // The syllable boundary. 14,271 deletions in Thai alone.
  assert_eq!(normalize_ipa("a.b"), "a.b");

  // The link between two words spoken as one.
  assert_eq!(normalize_ipa("a\u{203f}b"), "a\u{203f}b");

  // The tie. `t͡ʃ` is one affricate where `tʃ` may be a stop meeting a
  // fricative across a boundary, so dropping it merged the two.
  assert_eq!(normalize_ipa("t\u{0361}\u{0283}"), "t\u{0361}\u{0283}");
  assert_eq!(normalize_ipa("k\u{0361}p"), "k\u{0361}p");
}

/// The one genuine fold of the four: the tie below IS the tie above, written
/// underneath when a descender leaves no room, exactly as the ring below is.
#[test]
fn folds_the_tie_below_onto_the_tie_above() {
  assert_eq!(
    normalize_ipa("t\u{035c}\u{0283}"),
    normalize_ipa("t\u{0361}\u{0283}")
  );
}

/// Keeping them is only half the job. They have to come back out too.
#[test]
fn round_trips_the_tie_and_the_boundaries() {
  for one in ["t\u{0361}\u{0283}a", "a.b", "a\u{203f}b"] {
    assert_eq!(talk_to_ipa(&ipa_to_talk(one)), one);
  }
}

/// The retroflex click has one spelling.
///
/// Khoisanist work wrote it `‼` because no letter existed. Unicode encoded
/// U+1DF0A in 2021 and the curated catalog spells it that way, so phoible's
/// 12 spellings, all in !Xun, matched no catalog entry and were refused.
#[test]
fn folds_the_doubled_exclamation_onto_the_retroflex_click_letter() {
  assert_eq!(normalize_ipa("k\u{203c}"), "k\u{1df0a}");
  assert_eq!(normalize_ipa("\u{261}\u{203c}x"), "\u{261}\u{1df0a}x");
}
