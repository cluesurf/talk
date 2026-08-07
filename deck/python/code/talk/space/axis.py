"""The IPA articulatory axes, and where each mark can attach.

talk's own modifiers carry ``attaches`` rules in ``modifiers.json``. IPA's
diacritics have no such data anywhere, so the rules are written out here
and follow the same shape, which is what makes the two notations countable
by one model.

An AXIS is a dimension a sound varies along. A sound takes at most one
mark per axis, so ``̟`` advanced and ``̠`` retracted are alternatives rather
than a pair that can co-occur. That single constraint is what makes the
space finite.

Mirrors ``code/space/axis.ts`` in the TypeScript port.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, Protocol


class HasFeatures(Protocol):
    form: str
    place: Optional[str]
    manner: Optional[str]
    voicing: Optional[str]


@dataclass(frozen=True)
class Attachment:
    """Where a mark may attach. An absent field means no restriction."""

    place: Optional[list[str]] = None
    not_place: Optional[list[str]] = None
    manner: Optional[list[str]] = None
    not_manner: Optional[list[str]] = None
    voicing: Optional[list[str]] = None
    form: Optional[str] = None


@dataclass(frozen=True)
class MarkGroup:
    """A set of marks sharing one attachment rule, within an axis."""

    marks: list[str]
    rule: Attachment = field(default_factory=Attachment)


CORONAL = ["dental", "alveolar", "postalveolar", "retroflex"]

OBSTRUENT = [
    "plosive",
    "fricative",
    "sibilant-fricative",
    "non-sibilant-fricative",
    "lateral-fricative",
    "affricate",
]

SONORANT = [
    "nasal",
    "approximant",
    "fricative-approximant",
    "trill",
    "tap-flap",
    "lateral-approximant",
    "lateral-tap-flap",
]

#: Places behind the oral cavity, where most secondary articulation fails.
BACK_PLACES = ["pharyngeal-epiglottal", "glottal"]

#: Axes that describe the SYLLABLE rather than the segment. The ``band``
#: tier excludes these; ``mesh`` includes them.
SUPRASEGMENTAL = frozenset(["duration", "syllabicity", "stress", "tone"])

#: Every IPA diacritic, by axis.
#:
#: Rules mirror talk's ``attaches`` where the mark exists there, and are
#: stated here where talk has no equivalent because it drops the feature.
#: Each is a claim about articulation, so each is arguable: a reader who
#: disagrees should change the rule rather than the count.
IPA_AXES: dict[str, list[MarkGroup]] = {
    "dentality": [
        MarkGroup(["̪"], Attachment(place=["dental", "alveolar"])),
        MarkGroup(["̼"], Attachment(place=["bilabial", "alveolar"])),
    ],
    # Apical and laminal say where the coronal closure is made, so they
    # mean nothing off the coronal region.
    "tongue-shape": [
        MarkGroup(["̺", "̻"], Attachment(place=CORONAL)),
    ],
    "tongue-position": [MarkGroup(["̟", "̠"])],
    "height": [MarkGroup(["̝", "̞"])],
    "centrality": [
        MarkGroup(["̈", "̽"], Attachment(form="vowel")),
    ],
    "tongue-root": [
        MarkGroup(["̘", "̙"], Attachment(form="vowel")),
    ],
    "tongue-body": [
        MarkGroup(["ʲ"], Attachment(not_place=["palatal"] + BACK_PLACES)),
        MarkGroup(
            ["ˠ", "ˤ"], Attachment(not_place=["velar"] + BACK_PLACES)
        ),
        MarkGroup(
            ["ᶣ"],
            Attachment(
                not_place=[
                    "bilabial",
                    "palatal",
                    "labial-velar",
                    "labial-palatal",
                ]
                + BACK_PLACES
            ),
        ),
    ],
    "labial": [
        MarkGroup(
            ["ʷ"],
            Attachment(
                not_place=["bilabial", "labiodental"] + BACK_PLACES
            ),
        ),
        # Degree of rounding only means something on a rounded
        # articulation.
        MarkGroup(["̹", "̜"], Attachment(form="vowel")),
    ],
    "laryngeal": [
        # Aspirated fricatives are attested in 41 phoible entries (Burmese
        # `sʰ`, Tibetan `ɕʰ` `xʰ` `ʂʰ`, Karen), so this is not
        # plosive-only.
        MarkGroup(
            ["ʰ", "ʱ"],
            Attachment(manner=OBSTRUENT, not_place=["glottal"]),
        ),
        MarkGroup(
            ["ʼ"],
            Attachment(
                manner=OBSTRUENT,
                voicing=["voiceless"],
                not_place=["glottal"],
            ),
        ),
        MarkGroup(["ˀ"], Attachment(not_place=["glottal"])),
    ],
    "phonation": [
        MarkGroup(
            ["̥"],
            Attachment(manner=SONORANT, voicing=["voiced"]),
        ),
        MarkGroup(["̬"], Attachment(voicing=["voiceless"])),
        # Breathy and creaky are kinds of voicing, so they need voicing.
        MarkGroup(["̤", "̰"], Attachment(voicing=["voiced"])),
    ],
    "tension": [
        MarkGroup(["͈", "͉"], Attachment(form="consonant")),
    ],
    "frication": [
        MarkGroup(["͓"], Attachment(form="consonant")),
        MarkGroup(["͇"], Attachment(place=CORONAL)),
    ],
    # A release is what follows a stop closure, so it needs a stop. A nasal
    # cannot have a nasal release, nor a lateral a lateral one.
    "release": [
        MarkGroup(
            ["ⁿ"], Attachment(manner=["plosive"], not_manner=["nasal"])
        ),
        MarkGroup(
            ["ˡ"], Attachment(manner=["plosive"], place=CORONAL)
        ),
        MarkGroup(["̚"], Attachment(manner=["plosive"])),
    ],
    "rhoticity": [MarkGroup(["˞"], Attachment(form="vowel"))],
    "nasality": [MarkGroup(["̃"], Attachment(not_manner=["nasal"]))],
    "duration": [MarkGroup(["ː", "ˑ", "̆"])],
    "syllabicity": [
        MarkGroup(
            ["̩"], Attachment(form="consonant", manner=SONORANT)
        ),
        MarkGroup(["̯"], Attachment(form="vowel")),
    ],
    "stress": [MarkGroup(["́", "̀"])],
    "tone": [MarkGroup(["˥", "˦", "˧", "˨", "˩"], Attachment(form="vowel"))],
}


def attaches(base: HasFeatures, rule: Attachment) -> bool:
    """Whether a base with these features can take a mark under this rule."""
    if rule.form is not None and base.form != rule.form:
        return False
    if rule.place is not None and (base.place or "") not in rule.place:
        return False
    if rule.not_place is not None and (base.place or "") in rule.not_place:
        return False
    if rule.manner is not None and (base.manner or "") not in rule.manner:
        return False
    if rule.not_manner is not None and (base.manner or "") in rule.not_manner:
        return False
    if rule.voicing is not None and (base.voicing or "") not in rule.voicing:
        return False

    return True
