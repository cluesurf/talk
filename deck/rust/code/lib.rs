//! talk: a phonetic encoding. IPA to talk (ascii) to simple (readable) to
//! machine (one 24-bit integer per sound).
//!
//! Everything is derived from three data files (in base/) and a double-array
//! trie scan.
//!
//! ```
//! assert_eq!(talk::ipa_to_talk("tʰa"), "t<h>a");
//! assert_eq!(talk::talk_to_ipa("t<h>a"), "tʰa");
//! assert_eq!(talk::readable("t<h>a"), "tʰa");
//! assert_eq!(
//!   talk::machine("t<h>a", talk::Notation::Tone, talk::Tier::Mesh).len(),
//!   2
//! );
//! ```

pub mod space;
pub mod string;
pub mod syllable;
pub mod trie;

pub use string::combine::combine;
pub use space::axis::{Attachment, MarkGroup, attaches, ipa_axes};
pub use space::codec::{
  Composition, byte_width, decode_unit, encode_unit, machine, machine_bytes,
  machine_text, pack, size_of, unpack,
};
pub use space::count::{
  Space, bytes_for, capacity, count_attested, count_space, unit_for,
};
pub use space::model::{
  Model, ModelAxis, ModelBase, Notation, Tier, axes_for, model_for,
};
pub use string::normalize::{normalize_ipa, normalize_ipa_with, NormalizeIpaOptions};
pub use string::convert::{
  ipa_to_talk, parse_ipa, readable, talk_to_ipa, tokenize, IpaUnit,
};
pub use string::enumerate::enumerate_sounds;
pub use string::sound::{make_sound, segment};
pub use string::types::{
  CODE_LIMIT, NO_CODE,
  Attaches, Form, Kind, Modifier, Phone, Sound, SoundInfo, SymbolEntry, Unit,
};
pub use syllable::{
  chunk, cluster, group_clusters_into_syllables, group_segments_into_clusters, read_segments,
  serialize, syllables, Chunked, Cluster, ClusterKey, Error, Segment, SegmentKind, Syllable, Tone,
};
