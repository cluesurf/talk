import pytest

from talk import enumerate_sounds, machine

# Ported from the v1 machine suite. The Hangul encoding maps each talk sound
# to one code point, and the encoding is both total (every sound has a glyph)
# and injective (distinct sounds never collide).


@pytest.mark.parametrize(
    "talk_text,length",
    [
        ("g", 1),
        ("mh!", 1),  # voiceless m (m̥), one sound
        ("ny~", 1),  # palatal nasal (ɲ), one sound
        ("bbh!", 1),  # voiceless bilabial trill (ʙ̥), one sound
        ("u$", 1),
        ("tak", 3),  # t + a + k
        ("many~a", 4),  # m + a + ny~ + a
    ],
)
def test_encodes_one_code_point_per_sound(talk_text, length):
    assert len(machine(talk_text)) == length


def test_distinct_enumerated_sounds_map_to_distinct_hangul():
    by_hangul = {}
    collisions = []
    for sound in enumerate_sounds():
        hangul = machine(sound.talk)
        if not hangul:
            continue
        prior = by_hangul.get(hangul)
        if prior is not None and prior != sound.talk:
            collisions.append(f"{prior} and {sound.talk} both -> {hangul}")
        else:
            by_hangul[hangul] = sound.talk
    assert collisions == []


def test_every_enumerated_sound_encodes_to_exactly_one_code_point():
    bad = [s.talk for s in enumerate_sounds() if len(machine(s.talk)) != 1]
    assert bad == []
