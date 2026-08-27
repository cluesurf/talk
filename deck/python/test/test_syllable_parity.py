"""Syllabification, against the TypeScript build.

WHY THE SHARED FIXTURE. This port was written last, from the TypeScript and
Rust sources, so the risk is not that a rule is missing but that one is
subtly different: a boundary a character early, a cluster labelled
`consonant` where the reference says `start-consonant`. Hand-written cases
only catch what their author already suspected.

`deck/rust/test/fixture/parity.json` is TypeScript's own output over every
enumerated sound, and Rust already passes it. Reading the same file here
means all three builds are held to one answer.

The fixture is large, so this samples it deterministically rather than
running every row. `pytest -k syllable_parity_full` runs the whole thing.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from talk import syllables

FIXTURE = (
    Path(__file__).resolve().parents[2]
    / "rust"
    / "test"
    / "fixture"
    / "parity.json"
)


def _cases() -> list[dict]:
    if not FIXTURE.exists():
        pytest.skip(f"{FIXTURE} is missing, regenerate with tsx test/parity.ts")

    with FIXTURE.open(encoding="utf-8") as handle:
        return json.load(handle)["syllables"]


def _shape(word: str) -> list[list[str]]:
    result = syllables(word)

    return [
        [f"{cell.form.value}:{cell.text}" for cell in one.clusters]
        for one in result.syllables
    ]


def _expected(case: dict) -> list[list[str]]:
    return [
        [f"{cell['form']}:{cell['text']}" for cell in one["clusters"]]
        for one in case.get("syllables", [])
    ]


def _check(case: dict) -> str | None:
    """The mismatch for one case, or None when it agrees."""
    if case.get("lossy") or not case.get("ok", True):
        return None

    word = case["input"]

    try:
        got = _shape(word)
    except Exception as error:  # noqa: BLE001 - reported, not swallowed
        return f"{word!r}: raised {error}"

    want = _expected(case)

    if got != want:
        return f"{word!r}: got {got} want {want}"

    return None


#: Every 97th row, a prime, so the sample is spread rather than clustered.
_STRIDE = 97


def test_syllabification_matches_the_typescript_build() -> None:
    cases = _cases()
    broken = [
        note
        for note in (_check(case) for case in cases[::_STRIDE])
        if note is not None
    ]

    assert broken[:8] == [], f"{len(broken)} of {len(cases[::_STRIDE])} differ"


@pytest.mark.skipif(
    os.environ.get("TALK_FULL_PARITY") != "1",
    reason="set TALK_FULL_PARITY=1 to run all 206,922 cases",
)
def test_syllabification_matches_the_typescript_build_full() -> None:
    cases = _cases()
    broken = [
        note for note in (_check(case) for case in cases) if note is not None
    ]

    assert broken[:8] == [], f"{len(broken)} of {len(cases)} differ"
