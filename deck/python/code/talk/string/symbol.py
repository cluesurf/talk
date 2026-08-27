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
        # THE LINK, which ``normalize_ipa`` used to delete. U+203F says two
        # words were spoken as one, which the writer chose to state, so it
        # survives the normalizer and needs a talk spelling to come back
        # through.
        #
        # THE TIE IS NOT HERE. U+0361 says the letters either side of it are
        # ONE segment, which is a claim about them rather than a character
        # standing between them. Carried as a symbol it round-tripped but
        # could not say how far the binding reached, so it is folded into the
        # ``<B>`` binder by ``_bind_ties`` instead. Leaving an entry here
        # would match it first and that fold would never run.
        SymbolEntry("\\&", "\u203f", "\u203f"),
    ]

    for n in range(10):
        digit = str(n)
        symbols.append(SymbolEntry(digit, digit, digit))

    return symbols
