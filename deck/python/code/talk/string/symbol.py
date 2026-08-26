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
        # THE TIE AND THE LINK, which ``normalize_ipa`` used to delete.
        #
        # ``t͡ʃ`` is one affricate where ``tʃ`` may be a stop meeting a
        # fricative across a boundary, and U+203F says two words were spoken
        # as one. Both state something the writer chose to state, so both
        # survive the normalizer now and both need a talk spelling to come
        # back through.
        SymbolEntry("\\=", "\u0361", "\u0361"),
        SymbolEntry("\\&", "\u203f", "\u203f"),
    ]

    for n in range(10):
        digit = str(n)
        symbols.append(SymbolEntry(digit, digit, digit))

    return symbols
