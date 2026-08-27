import pytest

from talk import enumerate_sounds, machine

# Ported from the v1 machine suite. The machine encoding maps each talk sound
# to one code point, and the encoding is both total (every sound has a glyph)
# and injective (distinct sounds never collide).


@pytest.mark.parametrize(
    "talk_text,length",
    [
        ("g", 1),
        ("m<v->", 1),  # voiceless m (m̥), one sound
        ("n<y>", 1),  # palatal nasal (ɲ), one sound
        ("b<rv->", 1),  # voiceless bilabial trill (ʙ̥), one sound
        ("$e", 1),
        ("tak", 3),  # t + a + k
        ("man<y>a", 4),  # m + a + n<y> + a
    ],
)
def test_encodes_one_code_point_per_sound(talk_text, length):
    assert len(machine(text=talk_text, type="tone", system="mesh")) == length


def test_distinct_enumerated_sounds_map_to_distinct_codes():
    by_hangul = {}
    collisions = []
    for sound in enumerate_sounds():
        codes = machine(text=sound.talk, type="tone", system="mesh")
        if not codes or codes[0] < 0:
            continue
        hangul = codes[0]
        prior = by_hangul.get(hangul)
        if prior is not None and prior != sound.talk:
            collisions.append(f"{prior} and {sound.talk} both -> {hangul}")
        else:
            by_hangul[hangul] = sound.talk
    assert collisions == []


def test_every_enumerated_sound_encodes_to_exactly_one_code_point():
    bad = [s.talk for s in enumerate_sounds() if len(machine(text=s.talk, type="tone", system="mesh")) != 1]
    assert bad == []
