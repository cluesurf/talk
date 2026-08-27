//! The three spaces, and the dense codes built over them.

use talk::{
  Composition, Notation, Space, Tier, byte_width, count_attested,
  count_space, decode_unit, encode_unit, ipa_to_talk, model_for,
  normalize_ipa, pack, segment, size_of, talk_to_ipa, unit_for, unpack,
};

const NOTATIONS: [Notation; 2] = [Notation::Ipa, Notation::Tone];
const TIERS: [Tier; 3] = [Tier::Seed, Tier::Band, Tier::Mesh];

fn every() -> Vec<(Notation, Tier)> {
  NOTATIONS
    .iter()
    .flat_map(|notation| TIERS.iter().map(move |tier| (*notation, *tier)))
    .collect()
}

// ─── the three spaces ────────────────────────────────────────────────────

#[test]
fn orders_producible_below_permitted() {
  // A sound can be writable without being pronounceable. The counts have
  // to reflect that or the model is wrong.
  for notation in NOTATIONS {
    for tier in [Tier::Band, Tier::Mesh] {
      assert!(
        count_space(notation, tier, Space::Producible)
          < count_space(notation, tier, Space::Permitted)
      );
    }
  }
}

#[test]
fn grows_from_seed_to_band_to_mesh() {
  for notation in NOTATIONS {
    let seed = count_space(notation, Tier::Seed, Space::Producible);
    let band = count_space(notation, Tier::Band, Space::Producible);
    let mesh = count_space(notation, Tier::Mesh, Space::Producible);

    assert!(seed < band, "{notation:?} seed {seed} band {band}");
    assert!(band < mesh, "{notation:?} band {band} mesh {mesh}");
  }
}

#[test]
fn ipa_is_larger_than_tone_past_seed() {
  // talk is deliberately coarser, so its space must be the smaller one.
  for tier in [Tier::Band, Tier::Mesh] {
    assert!(
      count_space(Notation::Ipa, tier, Space::Producible)
        > count_space(Notation::Tone, tier, Space::Producible)
    );
  }
}

#[test]
fn attachment_rules_cut_the_permitted_space() {
  let producible =
    count_space(Notation::Ipa, Tier::Mesh, Space::Producible);
  let permitted = count_space(Notation::Ipa, Tier::Mesh, Space::Permitted);

  assert!(permitted / producible > 100);
}

// ─── unit_for ────────────────────────────────────────────────────────────

#[test]
fn splits_atoms_at_seed() {
  assert_eq!(
    unit_for("p\u{2b0}", Notation::Ipa, Tier::Seed),
    Some(vec!["p".to_string(), "\u{2b0}".to_string()])
  );
}

#[test]
fn keeps_the_phoneme_whole_at_mesh() {
  assert_eq!(
    unit_for("p\u{2b0}", Notation::Ipa, Tier::Mesh),
    Some(vec!["p\u{2b0}".to_string()])
  );
}

#[test]
fn strips_suprasegmentals_at_band() {
  assert_eq!(
    unit_for("a\u{2d0}", Notation::Ipa, Tier::Band),
    Some(vec!["a".to_string()])
  );
}

#[test]
fn counts_distinct_units_not_occurrences() {
  let corpus = ["p", "p", "p\u{2b0}", "b"];

  assert_eq!(
    count_attested(corpus.iter().copied(), Notation::Ipa, Tier::Mesh),
    3
  );
}

// ─── codec ───────────────────────────────────────────────────────────────

#[test]
fn sizes_bytes_to_the_tier() {
  // The whole reason widths are per tier: the smallest is a byte and the
  // largest is four, so a single width would waste three quarters.
  //
  // WHY NOT SIX FIXED NUMBERS. It was written that way, and every one of
  // them was a restatement of the inventory size on the day it was typed.
  // Adding sounds moved `tone mesh` from two bytes to three and the test
  // failed without anything being wrong. What has to hold is that a width is
  // the SMALLEST that fits its tier, and that the six are not all the same.
  let mut widths = std::collections::BTreeSet::new();

  for (notation, tier) in every() {
    let width = byte_width(notation, tier) as u32;
    let size = count_space(notation, tier, Space::Producible) as u128;

    widths.insert(width);

    assert!(size <= 256u128.pow(width), "{notation:?} {tier:?} overflows");
    assert!(
      size > 256u128.pow(width - 1),
      "{notation:?} {tier:?} is wider than it needs"
    );
  }

  assert!(widths.len() > 1, "the tiers do not all share one width");
  assert_eq!(byte_width(Notation::Tone, Tier::Seed), 1);
  assert_eq!(byte_width(Notation::Ipa, Tier::Mesh), 4);
}

#[test]
fn keeps_every_code_inside_its_width() {
  for (notation, tier) in every() {
    let width = byte_width(notation, tier);

    assert!(size_of(notation, tier) <= 256u64.pow(width as u32));
  }
}

#[test]
fn round_trips_the_edges() {
  for (notation, tier) in every() {
    let size = size_of(notation, tier);

    for code in [0, 1, size - 2, size - 1] {
      let composition =
        decode_unit(code, notation, tier).expect("decodes");

      assert_eq!(
        encode_unit(&composition, notation, tier),
        Ok(code),
        "{notation:?} {tier:?} {code}"
      );
    }
  }
}

#[test]
fn round_trips_a_spread() {
  for (notation, tier) in every() {
    let size = size_of(notation, tier);
    let step = (size / 300).max(1);

    let mut code = 0;
    while code < size {
      let composition =
        decode_unit(code, notation, tier).expect("decodes");

      assert_eq!(encode_unit(&composition, notation, tier), Ok(code));
      code += step;
    }
  }
}

#[test]
fn covers_the_seed_tier_with_no_gaps() {
  // Exhaustive where it is cheap, which proves the offsets and radices
  // line up rather than merely sampling well.
  for notation in NOTATIONS {
    let size = size_of(notation, Tier::Seed);
    let seen: std::collections::HashSet<u64> = (0..size)
      .map(|code| {
        let composition =
          decode_unit(code, notation, Tier::Seed).expect("decodes");

        encode_unit(&composition, notation, Tier::Seed).expect("encodes")
      })
      .collect();

    assert_eq!(seen.len() as u64, size);
  }
}

#[test]
fn is_injective_on_tone_band() {
  let size = size_of(Notation::Tone, Tier::Band);
  let seen: std::collections::HashSet<u64> = (0..size)
    .map(|code| {
      let composition =
        decode_unit(code, Notation::Tone, Tier::Band).expect("decodes");

      encode_unit(&composition, Notation::Tone, Tier::Band).expect("encodes")
    })
    .collect();

  assert_eq!(seen.len() as u64, size);
}

#[test]
fn refuses_a_code_outside_the_space() {
  for (notation, tier) in every() {
    let size = size_of(notation, tier);

    assert!(decode_unit(size, notation, tier).is_err());
  }
}

#[test]
fn refuses_an_unknown_base() {
  let composition = Composition {
    base: "not-a-sound".to_string(),
    marks: Vec::new(),
  };

  assert!(
    encode_unit(&composition, Notation::Tone, Tier::Mesh).is_err()
  );
}

#[test]
fn refuses_a_mark_the_base_cannot_carry() {
  // A silent fallback here would file a wrong sound at a real code, which
  // is worse than failing.
  let model = model_for(Notation::Tone);
  let vowel = model
    .bases
    .iter()
    .find(|base| base.form == talk::Form::Vowel)
    .expect("a vowel");

  let composition = Composition {
    base: vowel.key.clone(),
    marks: vec![Some("h~".to_string())],
  };

  assert!(
    encode_unit(&composition, Notation::Tone, Tier::Mesh).is_err()
  );
}

// ─── pack and unpack ─────────────────────────────────────────────────────

#[test]
fn packs_exactly_width_bytes_per_code() {
  for (notation, tier) in every() {
    let width = byte_width(notation, tier);

    assert_eq!(pack(&[0, 1, 2], notation, tier).len(), 3 * width);
  }
}

#[test]
fn packs_and_unpacks() {
  for (notation, tier) in every() {
    let size = size_of(notation, tier);
    let codes = vec![0, 1, size / 2, size - 1];

    assert_eq!(
      unpack(&pack(&codes, notation, tier), notation, tier),
      codes
    );
  }
}

#[test]
fn packs_big_endian() {
  assert_eq!(
    pack(&[0x010203], Notation::Ipa, Tier::Band),
    vec![0x01, 0x02, 0x03]
  );
}

#[test]
fn ignores_a_trailing_partial_code() {
  // A truncated buffer yields the codes it does hold rather than a corrupt
  // final value.
  let bytes = pack(&[5, 6], Notation::Tone, Tier::Band);

  assert_eq!(
    unpack(&bytes[..bytes.len() - 1], Notation::Tone, Tier::Band),
    vec![5]
  );
}

// ─── normalization and pre-modifiers ─────────────────────────────────────

#[test]
fn collapses_marks_that_differ_only_by_order() {
  // Combining marks sharing a Unicode class keep their input order under
  // NFD, so the same sound arrives as two strings. Worse, the parser
  // matches greedily, so each would pick a different base.
  assert_eq!(
    normalize_ipa("n\u{325}\u{32a}"),
    normalize_ipa("n\u{32a}\u{325}")
  );
  assert_eq!(
    ipa_to_talk("n\u{325}\u{32a}"),
    ipa_to_talk("n\u{32a}\u{325}")
  );
}

#[test]
fn never_moves_a_leading_modifier() {
  // `ʰk` is pre-aspirated and `kʰ` post-aspirated. Sorting them together
  // would silently change what a source said.
  assert_ne!(normalize_ipa("\u{2b0}k"), normalize_ipa("k\u{2b0}"));
}

#[test]
fn keeps_pre_aspiration() {
  // `ʰk` used to come back as plain `k`: a modifier before any base had
  // nowhere to go, so the distinction vanished silently.
  assert_eq!(ipa_to_talk("\u{2b0}k"), "<h>k");
  assert_eq!(talk_to_ipa("<h>k"), "\u{2b0}k");
}

#[test]
fn attachment_decides_an_ambiguous_sequence() {
  // A plosive carries aspiration, so `pʰk` is `pʰ` then `k`. A vowel and a
  // nasal do not, so the mark belongs to what follows.
  let post = segment(&ipa_to_talk("p\u{2b0}k"));
  assert_eq!(post[0].modifiers.len(), 1);
  assert!(post[1].pre.is_empty());

  for ipa in ["a\u{2b0}k", "m\u{2b0}k"] {
    let pre = segment(&ipa_to_talk(ipa));

    assert!(pre[0].modifiers.is_empty(), "{ipa}");
    assert_eq!(pre[1].pre.len(), 1, "{ipa}");
  }
}
