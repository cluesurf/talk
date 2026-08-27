//! Ported from the v1 machine suite. The machine encoding maps each talk sound
//! to one code point, and the encoding is both total (every sound has a glyph)
//! and injective (distinct sounds never collide).

use std::collections::HashMap;

use talk::{Notation, Tier, enumerate_sounds, machine};

#[test]
fn encodes_each_sound_as_one_hangul_code_point() {
  let cases: [(&str, usize); 7] = [
    ("g", 1),
    // Voiceless m (m̥), one sound.
    ("m<v->", 1),
    // Palatal nasal (ɲ), one sound.
    ("n<y>", 1),
    // Voiceless bilabial trill (ʙ̥), one sound.
    ("b<rv->", 1),
    ("$e", 1),
    // t + a + k.
    ("tak", 3),
    // m + a + n<y> + a.
    ("man<y>a", 4),
  ];

  for (talk, want) in cases {
    assert_eq!(machine(talk, Notation::Tone, Tier::Mesh).len(), want, "machine({talk})");
  }
}

#[test]
fn distinct_enumerated_sounds_map_to_distinct_codes() {
  let mut by_code: HashMap<i64, String> = HashMap::new();
  let mut collisions: Vec<String> = Vec::new();

  for sound in enumerate_sounds() {
    let codes = machine(&sound.talk, Notation::Tone, Tier::Mesh);

    let Some(&code) = codes.first() else {
      continue;
    };

    if code < 0 {
      continue;
    }

    match by_code.get(&code) {
      Some(prior) if *prior != sound.talk => {
        collisions.push(format!("{prior} and {} both -> {code}", sound.talk));
      }
      _ => {
        by_code.insert(code, sound.talk);
      }
    }
  }

  assert_eq!(collisions, Vec::<String>::new());
}

#[test]
fn every_enumerated_sound_encodes_to_exactly_one_code_point() {
  let bad: Vec<String> = enumerate_sounds()
    .into_iter()
    .filter(|sound| machine(&sound.talk, Notation::Tone, Tier::Mesh).len() != 1)
    .map(|sound| sound.talk)
    .collect();

  assert_eq!(bad, Vec::<String>::new());
}
