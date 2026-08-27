"""The cluster whitelists, loaded from base/clusters/.

The category files list the cluster definitions; base/clusters/index.json
holds one Chinese token per atomic piece (each colon-split part and the
colon-removed whole). A cluster's code is the token of its whole
(colon-removed) form.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from importlib.resources import files


def _load(*parts: str) -> list[dict[str, str]]:
    handle = files("talk") / "base" / "clusters"

    for part in parts:
        handle = handle / part

    return json.loads(handle.read_text("utf-8"))


_TOKEN_OF: dict[str, str] = {
    piece["talk"]: piece["token"] for piece in _load("index.json")
}


def _code_of(cluster: str) -> str:
    return _TOKEN_OF.get(cluster.replace(":", ""), "")


def _to_map(rows: list[dict[str, str]]) -> dict[str, str]:
    return {row["talk"]: _code_of(row["talk"]) for row in rows}


@dataclass(frozen=True)
class Clusters:
    consonants: dict[str, str]
    start_consonants: dict[str, str]
    end_consonants: dict[str, str]
    full_consonants: dict[str, str]
    vowels: dict[str, str]


CLUSTERS = Clusters(
    consonants=_to_map(_load("consonants", "index.json")),
    start_consonants=_to_map(_load("consonants", "start.json")),
    end_consonants=_to_map(_load("consonants", "end.json")),
    full_consonants=_to_map(_load("consonants", "full.json")),
    vowels=_to_map(_load("vowels", "index.json")),
)
