import json
from importlib.resources import files

from talk import ipa_to_talk, talk_to_ipa

# Ported from the v1 round-trip suite. talk is the canonical normal form, so
# converting a talk letter to IPA and back must return the same talk letter.
# (IPA -> talk -> IPA is many-to-one on purpose and is not asserted.)
PHONES = json.loads((files("talk") / "base" / "phones.json").read_text("utf-8"))
INVENTORY = list(dict.fromkeys(p["talk"] for p in PHONES))


def test_has_a_non_trivial_canonical_inventory():
    assert len(INVENTORY) > 100


def test_every_canonical_talk_letter_round_trips():
    broken = []
    for talk_text in INVENTORY:
        ipa = talk_to_ipa(talk_text)
        back = ipa_to_talk(ipa)
        if back != talk_text:
            broken.append(f"{talk_text} -> {ipa} -> {back}")
    assert broken == []


def test_a_dollar_round_trips_with_o_slash():
    assert talk_to_ipa("a$") == "ø"
    assert ipa_to_talk("ø") == "a$"


def test_e_dollar_round_trips_with_oe_ligature():
    assert talk_to_ipa("e$") == "œ"
    assert ipa_to_talk("œ") == "e$"
