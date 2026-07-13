from talk.trie import build_trie


def make_trie():
    return build_trie(
        [("t", "T"), ("th~", "TH"), ("ty~", "TY"), ("𝼊", "CLICK")]
    )


def test_longest_matching_prefix():
    trie = make_trie()
    assert trie.match_at("th~a", 0) == "TH"
    assert trie.matched_length == 3


def test_falls_back_to_shorter_key():
    trie = make_trie()
    assert trie.match_at("tz", 0) == "T"
    assert trie.matched_length == 1


def test_matches_from_offset():
    trie = make_trie()
    assert trie.match_at("xty~", 1) == "TY"
    assert trie.matched_length == 3


def test_no_match_returns_none():
    trie = make_trie()
    assert trie.match_at("zzz", 0) is None
    assert trie.matched_length == 0


def test_matches_an_astral_key():
    trie = make_trie()
    assert trie.match_at("𝼊", 0) == "CLICK"
    # One code point in Python (the TS port counts two UTF-16 code units).
    assert trie.matched_length == 1


def test_first_spelling_wins_on_duplicate_key():
    dupes = build_trie([("a", "first"), ("a", "second")])
    assert dupes.match_at("a", 0) == "first"
