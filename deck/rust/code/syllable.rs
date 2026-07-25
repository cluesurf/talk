//! Syllable parsing: split a talk word into syllables, each a sequence of
//! onset, nucleus, and coda clusters.

pub mod clusters;
#[allow(clippy::module_inception)]
pub mod syllable;

pub use syllable::{
  chunk, cluster, group_clusters_into_syllables, group_segments_into_clusters, read_segments,
  serialize, Chunked, Cluster, ClusterKey, Error, Segment, SegmentKind, Syllable, Tone,
};

/// Split a talk word into its syllables and clusters.
pub fn syllables(talk: &str) -> Result<Chunked, Error> {
  chunk(talk)
}
