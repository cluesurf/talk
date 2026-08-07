"""talk: a phonetic encoding. IPA <-> talk (ascii) <-> simple (readable)
<-> token (one Hangul code point per sound).

Everything is derived from three data files (in base/) and a double-array
trie scan. No runtime dependencies.

    import talk

    talk.ipa_to_talk("tʰa")   # -> "th~a"
    talk.talk_to_ipa("th~a")  # -> "tʰa"
    talk.readable("th~a")     # -> "tʰa"
    talk.machine("th~a")      # -> one 24-bit integer per sound
"""

from __future__ import annotations

from .string.combine import combine
from .space import (
    CAPACITY,
    Composition,
    SpaceReport,
    byte_width,
    bytes_for,
    count_attested,
    count_space,
    decode_unit,
    encode_unit,
    model_for,
    pack,
    report_space,
    size_of,
    unit_for,
    unpack,
)
from .string.normalize import normalize_ipa
from .space import machine, machine_bytes, machine_text
from .string.convert import (
    IpaUnit,
    ipa_to_talk,
    parse_ipa,
    readable,
    talk_to_ipa,
    tokenize,
)
from .string.enumerate import enumerate_sounds
from .string.sound import segment
from .string.type import (
    Attaches,
    Kind,
    Modifier,
    Phone,
    Sound,
    SoundInfo,
    SymbolEntry,
    Unit,
)

__version__ = "2.0.0"

__all__ = [
    "combine",
    "IpaUnit",
    "ipa_to_talk",
    "parse_ipa",
    "talk_to_ipa",
    "tokenize",
    "readable",
    "machine",
    "machine_bytes",
    "machine_codes",
    "machine_text",
    "machine_text_codes",
    "CAPACITY",
    "Composition",
    "SpaceReport",
    "byte_width",
    "bytes_for",
    "count_attested",
    "count_space",
    "decode_unit",
    "encode_unit",
    "model_for",
    "normalize_ipa",
    "pack",
    "report_space",
    "size_of",
    "unit_for",
    "unpack",
    "segment",
    "enumerate_sounds",
    "Attaches",
    "Kind",
    "Modifier",
    "Phone",
    "Sound",
    "SoundInfo",
    "SymbolEntry",
    "Unit",
]
