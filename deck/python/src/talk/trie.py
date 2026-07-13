"""A double-array trie for static longest-prefix matching.

Build once from a fixed set of keys, then scan. This is the base/check
integer-array representation used by production tokenizers: a transition is
one array index, with no per-node objects and no allocation per match.

State ``s`` transitions on a character with dense code ``c`` to state
``base[s] + c``, valid only when ``check[base[s] + c] == s``. A state carries
a value when the prefix that reaches it is itself a key.

Each character is mapped to its dense code through a small dict. Unlike the
TypeScript port (which scans UTF-16 code units), this scans Python code
points, so a match length is in code points. The matched *values* and the
resulting conversions are identical either way, since output is built from
whole matched keys, never from raw index arithmetic.
"""

from __future__ import annotations

from typing import Generic, NamedTuple, TypeVar

T = TypeVar("T")


class Match(Generic[T], NamedTuple):
    """A matched value and the number of code points it spanned."""

    value: T
    length: int


class _BuildNode(Generic[T]):
    __slots__ = ("children", "value")

    def __init__(self) -> None:
        self.children: dict[int, _BuildNode[T]] = {}
        self.value: T | None = None


class TrieBuilder(Generic[T]):
    def __init__(self) -> None:
        self._char_to_code: dict[int, int] = {}
        self._next_code = 1
        self._root: _BuildNode[T] = _BuildNode()

    def add(self, key: str, value: T) -> None:
        if not key:
            return

        node = self._root

        for char in key:
            code_point = ord(char)

            # Remap sparse character codes to a dense 1.. alphabet so base
            # offsets stay small.
            code = self._char_to_code.get(code_point)

            if code is None:
                code = self._next_code
                self._next_code += 1
                self._char_to_code[code_point] = code

            child = node.children.get(code)

            if child is None:
                child = _BuildNode()
                node.children[code] = child

            node = child

        # First key wins, matching the data's declaration order.
        if node.value is None:
            node.value = value

    def build(self) -> "Trie[T]":
        # Index 0 is unused, state 1 is the root.
        base = [0, 0]
        check = [0, 0]
        value: list[T | None] = [None, self._root.value]
        taken = [True, True]

        def grow(upto: int) -> None:
            while len(base) <= upto:
                base.append(0)
                check.append(0)
                value.append(None)
                taken.append(False)

        queue: list[tuple[_BuildNode[T], int]] = [(self._root, 1)]
        head = 0
        first_free = 2

        while head < len(queue):
            node, state = queue[head]
            head += 1

            if not node.children:
                continue

            codes = list(node.children.keys())
            least = min(codes)

            # Find a base b so every child slot b + code is free.
            b = max(1, first_free - least)

            while True:
                fits = True

                for code in codes:
                    grow(b + code)

                    if taken[b + code]:
                        fits = False
                        break

                if fits:
                    break

                b += 1

            base[state] = b

            for code, child in node.children.items():
                pos = b + code
                taken[pos] = True
                check[pos] = state
                value[pos] = child.value
                queue.append((child, pos))

            while first_free < len(taken) and taken[first_free]:
                first_free += 1

        return Trie(self._char_to_code, base, check, value)


class Trie(Generic[T]):
    def __init__(
        self,
        char_to_code: dict[int, int],
        base: list[int],
        check: list[int],
        value: list[T | None],
    ) -> None:
        self._char_to_code = char_to_code
        self._base = base
        self._check = check
        self._value = value
        # How many code points the last successful match_at consumed. Read it
        # right after a match_at that returned a value, before the next call.
        self.matched_length = 0

    def match_at(self, text: str, at: int) -> T | None:
        """The value of the longest key that is a prefix of ``text`` at ``at``,
        or ``None`` if none. On a hit, ``matched_length`` holds its length."""
        char_to_code = self._char_to_code
        base = self._base
        check = self._check
        value = self._value
        state_limit = len(check)

        state = 1
        best_value: T | None = None
        best_length = 0

        i = at
        length = len(text)

        while i < length:
            code = char_to_code.get(ord(text[i]))

            if code is None:
                break

            nxt = base[state] + code

            if nxt >= state_limit or check[nxt] != state:
                break

            state = nxt
            hit = value[state]

            if hit is not None:
                best_value = hit
                best_length = i - at + 1

            i += 1

        self.matched_length = best_length

        return best_value

    def match_all_at(self, text: str, at: int) -> list[Match[T]]:
        """Every key that is a prefix of ``text`` at ``at``, with its length,
        from shortest to longest."""
        char_to_code = self._char_to_code
        base = self._base
        check = self._check
        value = self._value
        state_limit = len(check)

        state = 1
        hits: list[Match[T]] = []

        i = at
        length = len(text)

        while i < length:
            code = char_to_code.get(ord(text[i]))

            if code is None:
                break

            nxt = base[state] + code

            if nxt >= state_limit or check[nxt] != state:
                break

            state = nxt
            hit = value[state]

            if hit is not None:
                hits.append(Match(hit, i - at + 1))

            i += 1

        return hits


def build_trie(entries: list[tuple[str, T]]) -> Trie[T]:
    builder: TrieBuilder[T] = TrieBuilder()

    for key, value in entries:
        builder.add(key, value)

    return builder.build()
