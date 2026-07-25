//! Ported from the v1 machine suite. The Hangul encoding maps each talk sound
//! to one code point, and the encoding is both total (every sound has a glyph)
//! and injective (distinct sounds never collide).

use std::collections::HashMap;

use talk::{enumerate_sounds, machine};

#[test]
fn encodes_each_sound_as_one_hangul_code_point() {
  let cases: [(&str, usize); 7] = [
    ("g", 1),
    // Voiceless m (m̥), one sound.
    ("mh!", 1),
    // Palatal nasal (ɲ), one sound.
    ("ny~", 1),
    // Voiceless bilabial trill (ʙ̥), one sound.
    ("bbh!", 1),
    ("u$", 1),
    // t + a + k.
    ("tak", 3),
    // m + a + ny~ + a.
    ("many~a", 4),
  ];

  for (talk, want) in cases {
    assert_eq!(machine(talk).chars().count(), want, "machine({talk})");
  }
}

#[test]
fn distinct_enumerated_sounds_map_to_distinct_hangul() {
  let mut by_hangul: HashMap<String, String> = HashMap::new();
  let mut collisions: Vec<String> = Vec::new();

  for sound in enumerate_sounds() {
    let hangul = machine(&sound.talk);

    if hangul.is_empty() {
      continue;
    }

    match by_hangul.get(&hangul) {
      Some(prior) if *prior != sound.talk => {
        collisions.push(format!("{prior} and {} both -> {hangul}", sound.talk));
      }
      _ => {
        by_hangul.insert(hangul, sound.talk);
      }
    }
  }

  assert_eq!(collisions, Vec::<String>::new());
}

#[test]
fn every_enumerated_sound_encodes_to_exactly_one_code_point() {
  let bad: Vec<String> = enumerate_sounds()
    .into_iter()
    .filter(|sound| machine(&sound.talk).chars().count() != 1)
    .map(|sound| sound.talk)
    .collect();

  assert_eq!(bad, Vec::<String>::new());
}
