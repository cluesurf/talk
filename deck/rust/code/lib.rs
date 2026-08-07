//! talk: a phonetic encoding. IPA to talk (ascii) to simple (readable) to
//! machine (one Hangul code point per sound).
//!
//! Everything is derived from three data files (in base/) and a double-array
//! trie scan.
//!
//! ```
//! assert_eq!(talk::ipa_to_talk("tʰa"), "th~a");
//! assert_eq!(talk::talk_to_ipa("th~a"), "tʰa");
//! assert_eq!(talk::readable("th~a"), "tʰa");
//! assert_eq!(talk::machine("th~a").chars().count(), 2);
//! ```

pub mod string;
pub mod syllable;
pub mod trie;

pub use string::combine::combine;
pub use string::convert::{
  ipa_to_talk, machine, machine_outputs, parse_ipa, readable, talk_to_ipa, tokenize, IpaUnit,
};
pub use string::enumerate::enumerate_sounds;
pub use string::sound::{make_sound, segment};
pub use string::types::{
  Attaches, Form, Kind, Modifier, Phone, Sound, SoundInfo, SymbolEntry, TokenEntry, Unit,
};
pub use syllable::{
  chunk, cluster, group_clusters_into_syllables, group_segments_into_clusters, read_segments,
  serialize, syllables, Chunked, Cluster, ClusterKey, Error, Segment, SegmentKind, Syllable, Tone,
};
