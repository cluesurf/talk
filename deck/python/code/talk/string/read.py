"""Read a string as whichever notation it is written in.

The two scanners return different shapes: ``parse_ipa`` gives units that
may be symbols or unknown text, ``segment`` gives Sounds. This flattens
both to the one thing an encoder needs, a base with its modifiers.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from .convert import parse_ipa
from .sound import segment
from .type import Modifier, Phone


@dataclass(frozen=True)
class ReadSound:
    base: Optional[Phone] = None
    modifiers: list[Modifier] = field(default_factory=list)


def read_sounds(*, text: str, type: str) -> list[ReadSound]:
    if type == "tone":
        return [
            ReadSound(base=sound.base, modifiers=list(sound.modifiers))
            for sound in segment(text)
        ]

    return [
        ReadSound(base=unit.base, modifiers=list(unit.modifiers))
        if unit.role == "phone"
        else ReadSound()
        for unit in parse_ipa(text)
    ]
