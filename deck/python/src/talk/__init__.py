"""talk: a phonetic encoding. IPA <-> talk (ascii) <-> simple (readable)
<-> token (one Hangul code point per sound).

Everything is derived from three data files (in base/) and a double-array
trie scan. No runtime dependencies.

    import talk

    talk.ipa_to_talk("tʰa")   # -> "th~a"
    talk.talk_to_ipa("th~a")  # -> "tʰa"
    talk.readable("th~a")     # -> "tʰa"
    talk.machine("th~a")      # -> one Hangul code point per sound
"""

from __future__ import annotations

from .string.combine import combine
from .string.convert import (
    ipa_to_talk,
    machine,
    machine_outputs,
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
    TokenEntry,
    Unit,
)

__version__ = "2.0.0"

__all__ = [
    "combine",
    "ipa_to_talk",
    "talk_to_ipa",
    "tokenize",
    "readable",
    "machine",
    "machine_outputs",
    "segment",
    "enumerate_sounds",
    "Attaches",
    "Kind",
    "Modifier",
    "Phone",
    "Sound",
    "SoundInfo",
    "SymbolEntry",
    "TokenEntry",
    "Unit",
]
