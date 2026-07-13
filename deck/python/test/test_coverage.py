import json
import unicodedata
from importlib.resources import files
from pathlib import Path

import pytest

# Ported from the v1 coverage suite. The IPA charts (base/ipa/*.csv) are the
# full inventory. Every chart symbol must either be a cleanly supported phone
# or be listed in missing.csv as a known, unsupported symbol. A provisional
# phone is only an approximate fallback for an otherwise-unsupported symbol,
# so it does not count as supported (those symbols belong in missing.csv).
#
# The charts are dev/test data in the repo-root base/, not shipped in the
# wheel, so they are read from there and the suite skips if they are absent.
IPA_DIR = Path(__file__).resolve().parents[3] / "base" / "ipa"

pytestmark = pytest.mark.skipif(
    not IPA_DIR.exists(), reason="IPA chart data (base/ipa) not present"
)


def _column(name):
    lines = (IPA_DIR / name).read_text("utf-8").strip().splitlines()[1:]
    return [sym for sym in (ln.split(",")[0] for ln in lines) if sym]


def _nfd(text):
    return unicodedata.normalize("NFD", text)


PHONES = json.loads((files("talk") / "base" / "phones.json").read_text("utf-8"))
SUPPORTED = {_nfd(p["ipa"]) for p in PHONES if not p.get("provisional")}

CONSONANTS = _column("consonants.csv") if IPA_DIR.exists() else []
VOWELS = _column("vowels.csv") if IPA_DIR.exists() else []
MISSING = set(_column("missing.csv")) if IPA_DIR.exists() else set()


def _is_supported(symbol):
    return _nfd(symbol) in SUPPORTED


def test_every_consonant_is_supported_or_documented_missing():
    unaccounted = [
        s for s in CONSONANTS if not _is_supported(s) and s not in MISSING
    ]
    assert unaccounted == []


def test_every_vowel_is_supported_or_documented_missing():
    unaccounted = [
        s for s in VOWELS if not _is_supported(s) and s not in MISSING
    ]
    assert unaccounted == []


def test_missing_lists_no_symbol_that_is_supported():
    stale = [s for s in MISSING if _is_supported(s)]
    assert stale == []


def test_missing_lists_only_symbols_that_appear_in_the_charts():
    in_chart = set(CONSONANTS) | set(VOWELS)
    orphaned = [s for s in MISSING if s not in in_chart]
    assert orphaned == []
