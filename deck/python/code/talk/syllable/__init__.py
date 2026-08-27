"""Syllabification: talk in, syllables out.

Split a talk word into syllables, each a sequence of onset, nucleus and coda
clusters. TypeScript's `code/syllable/syllable.ts` is the reference.
"""

from __future__ import annotations

from .clusters import CLUSTERS, Clusters
from .syllable import (
    Chunked,
    Cluster,
    ClusterKey,
    Segment,
    Syllable,
    chunk,
    cluster,
    group_clusters_into_syllables,
    group_segments_into_clusters,
    read_segments,
    serialize,
    syllables,
)

__all__ = [
    "CLUSTERS",
    "Chunked",
    "Cluster",
    "ClusterKey",
    "Clusters",
    "Segment",
    "Syllable",
    "chunk",
    "cluster",
    "group_clusters_into_syllables",
    "group_segments_into_clusters",
    "read_segments",
    "serialize",
    "syllables",
]
