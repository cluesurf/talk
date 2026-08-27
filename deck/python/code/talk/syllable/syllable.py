"""Syllabification: talk in, syllables out.

The same three steps as the TypeScript and Rust builds, which are the
reference for this one:

1. `read_segments` reads the string as sounds, each with the flags the
   grouper reasons about.
2. `group_segments_into_clusters` walks the sounds and matches them against
   the cluster whitelists, longest first.
3. `syllables` assembles the clusters into syllables.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from enum import Enum
from typing import Iterable

import re

from ..string.runtime import R
from ..string.sound import segment as segment_talk
from ..trie import Trie, TrieBuilder
from .clusters import CLUSTERS

#: A bound sound: letters, then a run whose last mark is the binder.
_TIE = re.compile(r"^(.*?)(<[^>]*B\d*>)$")


class ClusterKey(str, Enum):
    FULL_CONSONANT = "full-consonant"
    CONSONANT = "consonant"
    START_CONSONANT = "start-consonant"
    END_CONSONANT = "end-consonant"
    VOWEL = "vowel"
    PUNCTUATION = "punctuation"


#: The order the tables are tried in, matching `CLUSTER_MAP` below.
_CLUSTER_KEY = [
    ClusterKey.FULL_CONSONANT,
    ClusterKey.CONSONANT,
    ClusterKey.START_CONSONANT,
    ClusterKey.END_CONSONANT,
    ClusterKey.VOWEL,
    ClusterKey.PUNCTUATION,
]

_CLUSTER_MAP = [
    CLUSTERS.full_consonants,
    CLUSTERS.consonants,
    CLUSTERS.start_consonants,
    CLUSTERS.end_consonants,
    CLUSTERS.vowels,
]


@dataclass
class Segment:
    """One sound, as the grouper sees it.

    ``talk`` is the exact text it was read from. The spelling is carried
    rather than rebuilt from the flags: rebuilding made a cluster's text a
    RECONSTRUCTION, and any modifier the flag table did not name simply
    vanished from it.
    """

    talk: str | None = None
    #: Joined to the segment after it by a tie, so no cluster boundary may
    #: fall between them.
    bound: bool = False
    kind: str | None = None  # "consonant" | "vowel" | "punctuation"
    value: str | None = None
    emphasis: bool = False
    aspiration: bool = False
    dentalization: bool = False
    ejection: bool = False
    labialization: bool = False
    palatalization: bool = False
    pharyngealization: bool = False
    velarization: bool = False
    voicelessness: bool = False

    def text(self) -> str:
        return self.value or ""


@dataclass
class Cluster:
    form: ClusterKey
    text: str
    code: str
    emphasis: bool = False


@dataclass
class Syllable:
    clusters: list[Cluster] = field(default_factory=list)
    emphasis: bool = False


@dataclass
class Chunked:
    syllables: list[Syllable] = field(default_factory=list)


#: The eight features the grouper reads. EXACTLY the ones the reference
#: build maps: adding more looks harmless and is not, since `stress` is only
#: ever set from a folded `^`.
_FLAG_OF_FEATURE = {
    "aspirated": "aspiration",
    "ejective": "ejection",
    "dental": "dentalization",
    "labialized": "labialization",
    "palatalized": "palatalization",
    "pharyngealized": "pharyngealization",
    "velarized": "velarization",
    "voiceless": "voicelessness",
}


def _modifiers_longest_first():
    marks = list(R.consonant_modifiers) + list(R.vowel_modifiers)

    return sorted(marks, key=lambda one: -len(one.talk))


_MODIFIER_BY_TALK = _modifiers_longest_first()


def read_segments(text: str) -> list[Segment]:
    """Step 1: read the string as sounds.

    TOKENIZED, NOT PATTERN-MATCHED. The reference walked a table built by
    crossing every base letter with every mark, which produced spellings no
    phone table ever held. `segment` is the same scanner the rest of the
    library reads talk with, so the sounds come from it.
    """
    chunks: list[Segment] = []

    for sound in segment_talk(text):
        base = getattr(sound, "base", None)

        if base is None:
            # A BOUND SOUND IS A SOUND, NOT PUNCTUATION. A tie makes `t͡ʃ`
            # one segment, and the reader returns it raw because the binding
            # is a claim about its parts rather than a new phone. Filed as
            # punctuation it was SKIPPED by the assembler, so every tied
            # affricate vanished from the syllables.
            #
            # READ AS ITS PARTS, SPELLED AS ONE. The cluster tables count in
            # sounds, and `tx` is two, so one chunk valued `tx` matched
            # nothing. Each letter becomes a segment and the bracket run
            # rides on the last, so the clusters join back exactly.
            tie = _TIE.match(sound.talk)

            if tie:
                parts = segment_talk(tie.group(1) or "")

                for at, part in enumerate(parts):
                    last = at == len(parts) - 1
                    part_base = getattr(part, "base", None)

                    chunks.append(
                        Segment(
                            talk=part.talk + (tie.group(2) or "")
                            if last
                            else part.talk,
                            bound=not last,
                            kind=part_base.form if part_base else "consonant",
                            value=part_base.talk if part_base else part.talk,
                        )
                    )

                continue

            # STRESS BELONGS TO THE SOUND BEFORE IT. `^` is a mark, not a
            # sound, and the reader hands it back on its own because it has
            # no base. Filed as punctuation it would break the nucleus in
            # two and drop the mark from the cluster text.
            if sound.talk == "^" and chunks and chunks[-1].kind != "punctuation":
                chunks[-1].emphasis = True
                chunks[-1].talk = (chunks[-1].talk or "") + sound.talk
                continue

            chunks.append(
                Segment(talk=sound.talk, kind="punctuation", value=sound.talk)
            )
            continue

        # A DERIVED PHONE CARRIES ITS MARKS IN ITS OWN SPELLING. `m̥` is one
        # entry in the phone table spelled `m<v->`, so the reader hands it
        # back as a base rather than as `m` plus voiceless. The bracket is
        # opened here and its marks join the ones the sound already carries.
        at = base.talk.find("<")
        letter = base.talk if at == -1 else base.talk[:at]
        inside = "" if at == -1 else base.talk[at + 1 : -1]

        seg = Segment(talk=sound.talk, kind=base.form, value=letter)

        for one in list(sound.pre) + list(sound.modifiers):
            flag = _FLAG_OF_FEATURE.get(one.feature)

            if flag:
                setattr(seg, flag, True)

        # LONGEST FIRST, AND CONSUMED. `v-` is voiceless and `v` is voiced,
        # so scanning short-first matches `v` inside `v-`. Each match is
        # removed so one mark cannot be read twice.
        rest = inside

        for one in _MODIFIER_BY_TALK:
            if not one.talk:
                continue

            found = rest.find(one.talk)

            if found != -1:
                flag = _FLAG_OF_FEATURE.get(one.feature)

                if flag:
                    setattr(seg, flag, True)

                rest = rest[:found] + rest[found + len(one.talk) :]

        chunks.append(seg)

    return chunks


def serialize(mark: Segment) -> str:
    """One segment, spelled back out.

    The text it was read from, so a split is lossless by construction.
    """
    return mark.talk if mark.talk is not None else mark.text()


def _sort_length(cluster: str) -> tuple[int, str]:
    """Longest first, alphabetical within a length."""
    return (-len(cluster), cluster)


@dataclass(frozen=True)
class _ClusterCount:
    cluster: str
    count: int


def _build_cluster_trie(rows: Iterable[str], vowel: bool) -> Trie:
    """Group clusters by the value string they match.

    COUNTED IN SOUNDS, NOT CHARACTERS. `count` says how many chunks the
    cluster consumes, and a chunk is a sound. `$n` is three characters and
    two sounds, so counting characters asks for one chunk too many and never
    matches. `$`, `~` and `!` choose among a letter's variants and are not
    sounds of their own.
    """
    by_key: dict[str, list[_ClusterCount]] = {}

    for cluster in rows:
        key = cluster if vowel else cluster.replace(":", "")
        bare = key

        for mark in "$~!":
            bare = bare.replace(mark, "")

        by_key.setdefault(key, []).append(
            _ClusterCount(cluster=cluster, count=len(bare))
        )

    builder = TrieBuilder()

    for key, group in by_key.items():
        builder.add(key, group)

    return builder.build()


_FULL_CONSONANT_TRIE = _build_cluster_trie(CLUSTERS.full_consonants, False)
_CONSONANT_TRIE = _build_cluster_trie(CLUSTERS.consonants, False)
_START_CONSONANT_TRIE = _build_cluster_trie(CLUSTERS.start_consonants, False)
_END_CONSONANT_TRIE = _build_cluster_trie(CLUSTERS.end_consonants, False)
_VOWEL_TRIE = _build_cluster_trie(CLUSTERS.vowels, True)


@dataclass(frozen=True)
class _Frame:
    text: str
    offset_of_index: list[int]


def _frame_of(chunks: list[Segment]) -> _Frame:
    """The sound values of a word, joined, with each sound's offset."""
    offsets: list[int] = []
    text = ""

    for chunk in chunks:
        offsets.append(len(text))
        text += chunk.value or ""

    return _Frame(text=text, offset_of_index=offsets)


def _cluster_matches(
    trie: Trie, frame: _Frame, chunks: list[Segment], i: int
) -> list[_ClusterCount]:
    """Clusters matching at sound `i`, longest first."""
    if i >= len(frame.offset_of_index):
        return []

    offset = frame.offset_of_index[i]
    out: list[_ClusterCount] = []

    for hit in trie.match_all_at(frame.text, offset):
        key = frame.text[offset : offset + hit.length]

        for candidate in hit.value:
            joined = "".join(
                one.value or "" for one in chunks[i : i + candidate.count]
            )

            # A MATCH MAY NOT END INSIDE A TIE. The last sound it takes
            # must not be joined to the one after it, or the cluster
            # boundary would fall in the middle of a segment the writer
            # said was one.
            end = i + candidate.count - 1
            cut = end < len(chunks) and chunks[end].bound

            if joined == key and not cut:
                out.append(candidate)

    out.sort(key=lambda one: _sort_length(one.cluster))

    return out


@dataclass
class _Span:
    form: int
    chunk: list[Segment]
    match: str


_FULL_CONSONANT = 0
_CONSONANT = 1
_START_CONSONANT = 2
_END_CONSONANT = 3
_VOWEL = 4
_PUNCTUATION = 5

_START_STRIPPED = {one.replace(":", "") for one in CLUSTERS.start_consonants}


def _is_dense(stripped: str) -> bool:
    """A cluster spelling of two or more sounds that is not a glottal onset.

    The bare `l`, `r`, `w` and `y` are excluded, which a spelling of two or
    more sounds can never be anyway.
    """
    return (
        len(stripped) >= 2
        and not stripped.startswith("'")
        and stripped not in ("l", "r", "w", "y")
    )


def group_segments_into_clusters(chunks: list[Segment]) -> list[Cluster]:
    """Step 2: group the sounds into clusters."""
    rows: list[list[_Span]] = []
    frame = _frame_of(chunks)
    i = 0

    while i < len(chunks):
        span: list[_Span] = []
        chunk = chunks[i]

        if chunk.kind == "punctuation":
            rows.append(
                [_Span(form=_PUNCTUATION, chunk=[chunk], match=chunk.value or "")]
            )
            i += 1
            continue

        # Standalone full consonants first, which take priority.
        for candidate in _cluster_matches(_FULL_CONSONANT_TRIE, frame, chunks, i):
            bare = candidate.cluster.replace(":", "")
            held = chunks[i : i + candidate.count]

            if _is_dense(bare):
                continue

            if ":" in candidate.cluster:
                after = i + candidate.count

                if after < len(chunks):
                    following = chunks[after]

                    # Only split when a vowel follows.
                    if following.kind != "vowel":
                        parts = candidate.cluster.split(":")

                        if len(parts) == 2:
                            # `'l:d` before `j` could be `'l` + `dj`, so the
                            # match is skipped to allow the better split.
                            if parts[1] + (following.value or "") in _START_STRIPPED:
                                continue

                        span.append(
                            _Span(
                                form=_FULL_CONSONANT,
                                chunk=held,
                                match=candidate.cluster,
                            )
                        )
                        i += candidate.count
                        break
                    # A vowel follows: skip, to allow splitting later.
                else:
                    span.append(
                        _Span(
                            form=_FULL_CONSONANT, chunk=held, match=candidate.cluster
                        )
                    )
                    i += candidate.count
                    break
            else:
                span.append(
                    _Span(form=_FULL_CONSONANT, chunk=held, match=candidate.cluster)
                )
                i += candidate.count
                break

        if span:
            rows.append(span)
            continue

        for candidate in _cluster_matches(_START_CONSONANT_TRIE, frame, chunks, i):
            span.append(
                _Span(
                    form=_START_CONSONANT,
                    chunk=chunks[i : i + candidate.count],
                    match=candidate.cluster,
                )
            )
            i += candidate.count
            break

        for candidate in _cluster_matches(_VOWEL_TRIE, frame, chunks, i):
            span.append(
                _Span(
                    form=_VOWEL,
                    chunk=chunks[i : i + candidate.count],
                    match=candidate.cluster,
                )
            )
            i += candidate.count
            break

        matched = False
        dense: tuple[list[Segment], str, int] | None = None

        for candidate in _cluster_matches(_FULL_CONSONANT_TRIE, frame, chunks, i):
            if _is_dense(candidate.cluster.replace(":", "")):
                if dense is None or candidate.count > dense[2]:
                    dense = (
                        chunks[i : i + candidate.count],
                        candidate.cluster,
                        candidate.count,
                    )

        ending: tuple[list[Segment], str, int] | None = None

        for candidate in _cluster_matches(_END_CONSONANT_TRIE, frame, chunks, i):
            if ending is None or candidate.count > ending[2]:
                ending = (
                    chunks[i : i + candidate.count],
                    candidate.cluster,
                    candidate.count,
                )

        # The longer of the two wins.
        pick: tuple[list[Segment], str, int, int] | None = None

        if dense and ending:
            pick = (
                (*dense, _FULL_CONSONANT)
                if dense[2] > ending[2]
                else (*ending, _END_CONSONANT)
            )
        elif dense:
            pick = (*dense, _FULL_CONSONANT)
        elif ending:
            pick = (*ending, _END_CONSONANT)

        if pick:
            span.append(_Span(form=pick[3], chunk=pick[0], match=pick[1]))
            i += pick[2]
            matched = True

        if not matched and not span:
            for candidate in _cluster_matches(_CONSONANT_TRIE, frame, chunks, i):
                span.append(
                    _Span(
                        form=_CONSONANT,
                        chunk=chunks[i : i + candidate.count],
                        match=candidate.cluster,
                    )
                )
                i += candidate.count
                break

        if not span:
            for candidate in _cluster_matches(
                _FULL_CONSONANT_TRIE, frame, chunks, i
            ):
                if _is_dense(candidate.cluster.replace(":", "")):
                    span.append(
                        _Span(
                            form=_FULL_CONSONANT,
                            chunk=chunks[i : i + candidate.count],
                            match=candidate.cluster,
                        )
                    )
                    i += candidate.count
                    break

        if not span:
            text = "".join(one.value or "" for one in chunks[i:])
            raise ValueError(f"No match found for {text}")

        rows.append(list(span))

    _split_colons(rows)
    _carry_across_rows(rows)

    return _to_clusters(rows)


def _split_colons(rows: list[list[_Span]]) -> None:
    """First pass: split a colon cluster when a vowel follows it.

    A colon marks where a cluster MAY break across a syllable boundary. It
    only actually breaks when an end consonant is followed by a nucleus.
    """
    i = 0

    while i < len(rows):
        node = rows[i]
        j = 0

        while j < len(node):
            span = node[j]

            if ":" in span.match:
                after = (
                    node[j + 1]
                    if j + 1 < len(node)
                    else (rows[i + 1][0] if i + 1 < len(rows) and rows[i + 1] else None)
                )

                if (
                    span.form == _END_CONSONANT
                    and after is not None
                    and after.form == _VOWEL
                ):
                    left_part, right_part = span.match.split(":", 1)
                    left: list[Segment] = []
                    right: list[Segment] = []
                    text = ""
                    array = left

                    for mark in span.chunk:
                        text += mark.value or ""
                        array.append(mark)

                        if text == left_part and not right:
                            array = right

                    # A COLON MAY NOT CUT A TIE. `t:s` says the cluster may
                    # break between `t` and `s`, but when those two are the
                    # halves of one affricate the break would split a segment
                    # the writer bound together.
                    if right and left and left[-1].bound:
                        right = []

                    if right:
                        node[j : j + 1] = [
                            _Span(form=_END_CONSONANT, chunk=left, match=left_part),
                            _Span(form=_CONSONANT, chunk=right, match=right_part),
                        ]
                        j += 1

            j += 1

        i += 1


def _carry_across_rows(rows: list[list[_Span]]) -> None:
    """Second pass: carry the right half of a colon cluster onto the nucleus
    that follows it, when the break lands between two rows."""
    for i in range(1, len(rows)):
        last = rows[i - 1]
        node = rows[i]

        if not last or not node:
            continue

        last_span = last[-1]
        node_span = node[0]

        if ":" in last_span.match and node_span.form == _VOWEL:
            head = last_span.match.split(":", 1)[0]
            left: list[Segment] = []
            right: list[Segment] = []
            text = ""
            array = left

            for mark in last_span.chunk:
                text += mark.value or ""
                array.append(mark)

                if text == head and not right:
                    array = right

            # Same rule across rows: a tie is not a place to break.
            if right and left and left[-1].bound:
                right = []

            if right:
                node_span.chunk[0:0] = right
                last_span.chunk = left


def _to_clusters(rows: list[list[_Span]]) -> list[Cluster]:
    out: list[Cluster] = []

    for node in rows:
        for span in node:
            emphasis = any(mark.emphasis for mark in span.chunk)
            text = "".join(serialize(mark) for mark in span.chunk)

            if span.form == _PUNCTUATION:
                out.append(
                    Cluster(
                        form=ClusterKey.PUNCTUATION,
                        text=text,
                        code=span.match,
                        emphasis=emphasis,
                    )
                )
                continue

            out.append(
                Cluster(
                    form=_CLUSTER_KEY[span.form],
                    text=text,
                    code=_CLUSTER_MAP[span.form].get(span.match, ""),
                    emphasis=emphasis,
                )
            )

    return out


def group_clusters_into_syllables(clusters: list[Cluster]) -> list[Syllable]:
    """Step 3: assemble the clusters into syllables.

    A WORD BREAK IS NOT A SYLLABLE BREAK. Spoken French runs a coda onto the
    next word: `ʃu də bʁy.sɛl` is `xu.dUb.$G$i.sEl`, with the `b` of
    Bruxelles closing the syllable that starts in `de`. That is enchaînement,
    so punctuation is stepped over rather than ending a gather.
    """
    out: list[Syllable] = []
    i = 0

    while i < len(clusters):
        cluster = clusters[i]

        # Punctuation does not belong inside a syllable.
        if cluster.form == ClusterKey.PUNCTUATION:
            i += 1
            continue

        syllable = Syllable(clusters=[])

        if cluster.form == ClusterKey.VOWEL:
            syllable.clusters.append(cluster)
            i += 1

            while i < len(clusters):
                nxt = clusters[i]

                if nxt.form == ClusterKey.PUNCTUATION:
                    i += 1
                    continue

                if nxt.form == ClusterKey.VOWEL:
                    break

                if nxt.form == ClusterKey.END_CONSONANT:
                    syllable.clusters.append(nxt)
                    i += 1
                    break

                after = clusters[i + 1] if i + 1 < len(clusters) else None

                if after is not None and after.form == ClusterKey.VOWEL:
                    # Whatever it is, a consonant before a vowel opens the
                    # next syllable rather than closing this one.
                    break

                if nxt.form == ClusterKey.FULL_CONSONANT:
                    break

                syllable.clusters.append(nxt)
                i += 1

        elif cluster.form == ClusterKey.FULL_CONSONANT:
            # A complete syllable by itself.
            syllable.clusters.append(cluster)
            i += 1

        elif cluster.form == ClusterKey.END_CONSONANT:
            # Always ends a syllable; never gathers what follows.
            syllable.clusters.append(cluster)
            i += 1

        else:  # CONSONANT or START_CONSONANT
            syllable.clusters.append(cluster)
            i += 1

            while i < len(clusters) and clusters[i].form != ClusterKey.VOWEL:
                nxt = clusters[i]

                if nxt.form == ClusterKey.PUNCTUATION:
                    i += 1
                    continue

                # Each start consonant opens its own syllable.
                if nxt.form == ClusterKey.START_CONSONANT and syllable.clusters:
                    break

                if nxt.form == ClusterKey.END_CONSONANT:
                    only_single = all(
                        one.form == ClusterKey.CONSONANT
                        for one in syllable.clusters
                    )

                    if only_single and len(syllable.clusters) >= 2:
                        break

                    syllable.clusters.append(nxt)
                    i += 1

                    upcoming = any(
                        clusters[j].form == ClusterKey.VOWEL
                        for j in range(i, min(len(clusters), i + 3))
                    )

                    if not upcoming:
                        break

                    continue

                syllable.clusters.append(nxt)
                i += 1

                # A start consonant plus one single consonant, with two or
                # more consonants still ahead, breaks here.
                if (
                    len(syllable.clusters) == 2
                    and syllable.clusters[0].form == ClusterKey.START_CONSONANT
                    and syllable.clusters[-1].form == ClusterKey.CONSONANT
                    and i < len(clusters)
                    and clusters[i].form
                    not in (ClusterKey.VOWEL, ClusterKey.PUNCTUATION)
                ):
                    count = 0

                    for j in range(i, min(len(clusters), i + 4)):
                        future = clusters[j]

                        if future.form == ClusterKey.PUNCTUATION:
                            continue

                        if future.form == ClusterKey.VOWEL:
                            break

                        count += 1

                    if count >= 2:
                        break

                # A start consonant with two single consonants is full.
                if len(syllable.clusters) >= 3:
                    singles = sum(
                        1
                        for one in syllable.clusters
                        if one.form == ClusterKey.CONSONANT
                    )
                    has_start = any(
                        one.form == ClusterKey.START_CONSONANT
                        for one in syllable.clusters
                    )

                    if has_start and singles >= 2:
                        syllable.clusters.pop()
                        i -= 1
                        break

                # A glottal stop after a start consonant makes those two a
                # syllable of their own.
                if nxt.text == "'" and len(syllable.clusters) >= 2:
                    before = syllable.clusters[-2]

                    if before.form == ClusterKey.START_CONSONANT:
                        syllable.clusters.pop()
                        i -= 1
                        start = syllable.clusters.pop()

                        if syllable.clusters:
                            syllable.emphasis = any(
                                one.emphasis for one in syllable.clusters
                            )
                            out.append(syllable)

                        pair = Syllable(clusters=[start, nxt])
                        pair.emphasis = start.emphasis or nxt.emphasis
                        out.append(pair)
                        i += 1
                        syllable = Syllable(clusters=[])
                        break

                if (
                    len(syllable.clusters) > 1
                    and i < len(clusters)
                    and clusters[i].form != ClusterKey.VOWEL
                ):
                    break

            if i < len(clusters) and clusters[i].form == ClusterKey.VOWEL:
                syllable.clusters.append(clusters[i])
                i += 1

                while i < len(clusters):
                    nxt = clusters[i]

                    if nxt.form == ClusterKey.PUNCTUATION:
                        i += 1
                        continue

                    if nxt.form == ClusterKey.VOWEL:
                        break

                    if nxt.form == ClusterKey.END_CONSONANT:
                        syllable.clusters.append(nxt)
                        i += 1
                        break

                    after = clusters[i + 1] if i + 1 < len(clusters) else None

                    if after is not None and after.form == ClusterKey.VOWEL:
                        break

                    if nxt.form == ClusterKey.FULL_CONSONANT:
                        break

                    syllable.clusters.append(nxt)
                    i += 1

        if syllable.clusters:
            syllable.emphasis = any(one.emphasis for one in syllable.clusters)
            out.append(syllable)

    return out


def chunk(text: str) -> Chunked:
    """The whole process: sounds, then clusters, then syllables."""
    marks = read_segments(text)
    clusters = group_segments_into_clusters(marks)

    return Chunked(syllables=group_clusters_into_syllables(clusters))


def syllables(text: str) -> Chunked:
    """Split a talk word into its syllables and clusters."""
    return chunk(text)


def cluster(text: str) -> list[Cluster]:
    return group_segments_into_clusters(read_segments(text))
