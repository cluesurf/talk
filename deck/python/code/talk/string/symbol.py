from __future__ import annotations

from .type import SymbolEntry


def build_symbols() -> list[SymbolEntry]:
    """Non-phonetic sounds carried through unchanged. The ``\\`` escape lets a
    literal symbol be written in talk (``\\.`` is a period), the same escape
    character every other notation uses for the job."""
    symbols = [
        SymbolEntry("\\.", ".", "."),
        SymbolEntry("\\?", "?", "?"),
        SymbolEntry("\\!", "!", "!"),
        SymbolEntry("\\+", "+", "+"),
        SymbolEntry("\\-", "-", "-"),
        SymbolEntry("\\*", "*", "*"),
        SymbolEntry("\\@", "@", "@"),
        SymbolEntry("\\$", "$", "$"),
        SymbolEntry("\\~", "~", "~"),
        SymbolEntry("\\_", "_", "_"),
        SymbolEntry("\\^", "^", "^"),
        SymbolEntry("\\\\", "\\", "\\"),
        SymbolEntry(" ", " ", " "),
    ]

    for n in range(10):
        digit = str(n)
        symbols.append(SymbolEntry(digit, digit, digit))

    return symbols
