import pytest

import talk
from talk.space import Composition

NOTATIONS = ["ipa", "tone"]
TIERS = ["seed", "band", "mesh"]
ALL = [(n, t) for n in NOTATIONS for t in TIERS]


# ─── the three spaces ────────────────────────────────────────────────────


def test_orders_attested_producible_permitted():
    # A sound can be writable without being pronounceable, and pronounceable
    # without anyone pronouncing it. The counts must reflect that ordering.
    for notation in NOTATIONS:
        for tier in ("band", "mesh"):
            producible = talk.count_space(
                notation=notation, tier=tier, space="producible"
            )
            permitted = talk.count_space(
                notation=notation, tier=tier, space="permitted"
            )

            assert producible < permitted


def test_grows_from_seed_to_band_to_mesh():
    for notation in NOTATIONS:
        sizes = [
            talk.count_space(
                notation=notation, tier=tier, space="producible"
            )
            for tier in TIERS
        ]

        assert sizes[0] < sizes[1] < sizes[2]


def test_ipa_is_larger_than_tone_past_seed():
    # talk is deliberately coarser, so its space must be the smaller one.
    for tier in ("band", "mesh"):
        assert talk.count_space(
            notation="ipa", tier=tier, space="producible"
        ) > talk.count_space(
            notation="tone", tier=tier, space="producible"
        )


def test_attachment_rules_cut_the_permitted_space():
    producible = talk.count_space(
        notation="ipa", tier="mesh", space="producible"
    )
    permitted = talk.count_space(
        notation="ipa", tier="mesh", space="permitted"
    )

    assert permitted / producible > 100


# ─── unit_for ────────────────────────────────────────────────────────────


def test_unit_for_splits_atoms_at_seed():
    assert talk.unit_for(phoneme="pʰ", notation="ipa", tier="seed") == [
        "p",
        "ʰ",
    ]


def test_unit_for_keeps_the_phoneme_whole_at_mesh():
    assert talk.unit_for(phoneme="pʰ", notation="ipa", tier="mesh") == ["pʰ"]


def test_unit_for_strips_suprasegmentals_at_band():
    assert talk.unit_for(phoneme="aː", notation="ipa", tier="band") == ["a"]
    assert talk.unit_for(phoneme="a˥", notation="ipa", tier="band") == ["a"]


def test_unit_for_keeps_segmental_marks_at_band():
    assert talk.unit_for(phoneme="pʰ", notation="ipa", tier="band") == ["pʰ"]


def test_count_attested_counts_distinct_units():
    corpus = ["p", "p", "pʰ", "b"]

    assert (
        talk.count_attested(phonemes=corpus, notation="ipa", tier="mesh")
        == 3
    )


# ─── capacity ────────────────────────────────────────────────────────────


def test_tone_seed_and_band_fit_their_hangul_groups():
    # Attachment rules on the last nine modifiers cut `tone` by roughly
    # three quarters, which brought `band` back inside its character space.
    # `mesh` is still six times too large.
    assert (
        talk.count_space(notation="tone", tier="seed", space="producible")
        < talk.CAPACITY["seed"]
    )
    assert (
        talk.count_space(notation="tone", tier="band", space="producible")
        < talk.CAPACITY["band"]
    )
    assert (
        talk.count_space(notation="tone", tier="mesh", space="producible")
        > talk.CAPACITY["mesh"]
    )


def test_ipa_never_fits_a_character_space():
    for tier in ("band", "mesh"):
        assert (
            talk.count_space(notation="ipa", tier=tier, space="producible")
            > talk.CAPACITY[tier]
        )


# ─── codec ───────────────────────────────────────────────────────────────


def test_byte_width_is_sized_per_tier():
    # The whole reason widths are per tier: `tone seed` is a byte and
    # `ipa mesh` is four, so a single width would waste three quarters.
    assert talk.byte_width(notation="tone", tier="seed") == 1
    assert talk.byte_width(notation="tone", tier="band") == 2
    assert talk.byte_width(notation="tone", tier="mesh") == 2
    assert talk.byte_width(notation="ipa", tier="seed") == 1
    assert talk.byte_width(notation="ipa", tier="band") == 3
    assert talk.byte_width(notation="ipa", tier="mesh") == 4


def test_every_code_fits_its_declared_width():
    for notation, tier in ALL:
        width = talk.byte_width(notation=notation, tier=tier)

        assert talk.size_of(notation=notation, tier=tier) <= 256**width


@pytest.mark.parametrize("notation,tier", ALL)
def test_round_trips_the_edges(notation, tier):
    size = talk.size_of(notation=notation, tier=tier)

    for code in (0, 1, size - 2, size - 1):
        composition = talk.decode_unit(
            code=code, notation=notation, tier=tier
        )

        assert (
            talk.encode_unit(
                composition=composition, notation=notation, tier=tier
            )
            == code
        )


@pytest.mark.parametrize("notation,tier", ALL)
def test_round_trips_a_spread(notation, tier):
    size = talk.size_of(notation=notation, tier=tier)
    step = max(1, size // 300)

    for code in range(0, size, step):
        composition = talk.decode_unit(
            code=code, notation=notation, tier=tier
        )

        assert (
            talk.encode_unit(
                composition=composition, notation=notation, tier=tier
            )
            == code
        )


def test_covers_the_seed_tier_with_no_gaps():
    # Exhaustive where it is cheap, which proves the offsets and radices
    # line up rather than merely sampling well.
    for notation in NOTATIONS:
        size = talk.size_of(notation=notation, tier="seed")
        seen = {
            talk.encode_unit(
                composition=talk.decode_unit(
                    code=code, notation=notation, tier="seed"
                ),
                notation=notation,
                tier="seed",
            )
            for code in range(size)
        }

        assert len(seen) == size


def test_is_injective_on_tone_band():
    size = talk.size_of(notation="tone", tier="band")
    seen = {
        talk.encode_unit(
            composition=talk.decode_unit(
                code=code, notation="tone", tier="band"
            ),
            notation="tone",
            tier="band",
        )
        for code in range(size)
    }

    assert len(seen) == size


@pytest.mark.parametrize("notation,tier", ALL)
def test_refuses_a_code_outside_the_space(notation, tier):
    size = talk.size_of(notation=notation, tier=tier)

    with pytest.raises(ValueError):
        talk.decode_unit(code=-1, notation=notation, tier=tier)

    with pytest.raises(ValueError):
        talk.decode_unit(code=size, notation=notation, tier=tier)


def test_refuses_an_unknown_base():
    with pytest.raises(ValueError):
        talk.encode_unit(
            composition=Composition(base="not-a-sound", marks=[]),
            notation="tone",
            tier="mesh",
        )


def test_refuses_a_mark_the_base_cannot_carry():
    # A silent fallback here would file a wrong sound at a real code, which
    # is worse than failing.
    vowel = next(
        base
        for base in talk.model_for("tone").bases
        if base.form == "vowel"
    )

    with pytest.raises(ValueError):
        talk.encode_unit(
            composition=Composition(base=vowel.key, marks=["h~"]),
            notation="tone",
            tier="mesh",
        )


# ─── pack and unpack ─────────────────────────────────────────────────────


@pytest.mark.parametrize("notation,tier", ALL)
def test_pack_uses_exactly_width_bytes(notation, tier):
    width = talk.byte_width(notation=notation, tier=tier)
    codes = [0, 1, 2]

    assert len(
        talk.pack(codes=codes, notation=notation, tier=tier)
    ) == len(codes) * width


@pytest.mark.parametrize("notation,tier", ALL)
def test_pack_round_trips(notation, tier):
    size = talk.size_of(notation=notation, tier=tier)
    codes = [0, 1, size // 2, size - 1]

    assert (
        talk.unpack(
            data=talk.pack(codes=codes, notation=notation, tier=tier),
            notation=notation,
            tier=tier,
        )
        == codes
    )


def test_pack_is_big_endian():
    data = talk.pack(codes=[0x010203], notation="ipa", tier="band")

    assert list(data) == [0x01, 0x02, 0x03]


def test_unpack_ignores_a_trailing_partial_code():
    # A truncated buffer yields the codes it does hold rather than a
    # corrupt final value.
    data = talk.pack(codes=[5, 6], notation="tone", tier="band")

    assert talk.unpack(
        data=data[:-1], notation="tone", tier="band"
    ) == [5]


# ─── normalization and pre-modifiers ─────────────────────────────────────


def test_collapses_marks_that_differ_only_by_order():
    # Combining marks sharing a Unicode class keep their input order under
    # NFD, so the same sound arrives as two strings. Worse, the parser
    # matches greedily, so each would pick a different base.
    assert talk.normalize_ipa("n̥̪") == talk.normalize_ipa("n̪̥")
    assert talk.ipa_to_talk("n̥̪") == talk.ipa_to_talk("n̪̥")


def test_orders_spacing_modifiers_too():
    assert talk.ipa_to_talk("kʷʰ") == talk.ipa_to_talk("kʰʷ")


def test_never_moves_a_leading_modifier():
    # `ʰk` is pre-aspirated and `kʰ` post-aspirated. Sorting them together
    # would silently change what a source said.
    assert talk.normalize_ipa("ʰk") != talk.normalize_ipa("kʰ")


def test_normalize_is_idempotent():
    for ipa in ("n̥̪", "kʷʰ", "ã̯", "pʰ"):
        assert talk.normalize_ipa(talk.normalize_ipa(ipa)) == (
            talk.normalize_ipa(ipa)
        )


def test_keeps_pre_aspiration():
    # `ʰk` used to come back as plain `k`: a modifier before any base had
    # nowhere to go, so the distinction vanished silently.
    assert talk.ipa_to_talk("ʰk") == "h~k"
    assert talk.talk_to_ipa("h~k") == "ʰk"


def test_distinguishes_pre_from_post():
    assert talk.ipa_to_talk("ʰk") != talk.ipa_to_talk("kʰ")
    assert talk.ipa_to_talk("ⁿd") != talk.ipa_to_talk("dⁿ")


def test_attachment_decides_an_ambiguous_sequence():
    # A plosive carries aspiration, so `pʰk` is `pʰ` then `k`. A vowel and
    # a nasal do not, so the mark belongs to what follows.
    post = talk.segment(talk.ipa_to_talk("pʰk"))
    assert [m.feature for m in post[0].modifiers] == ["aspirated"]
    assert post[1].pre == []

    for ipa in ("aʰk", "mʰk"):
        pre = talk.segment(talk.ipa_to_talk(ipa))
        assert pre[0].modifiers == []
        assert [m.feature for m in pre[1].pre] == ["aspirated"]


def test_reads_the_same_way_from_either_notation():
    import unicodedata

    for ipa in ("pʰk", "aʰk", "mʰk", "sʰ", "ʰk", "kʰ", "ⁿd", "dⁿ"):
        back = talk.talk_to_ipa(talk.ipa_to_talk(ipa))

        assert unicodedata.normalize("NFD", back) == unicodedata.normalize(
            "NFD", talk.normalize_ipa(ipa)
        )
