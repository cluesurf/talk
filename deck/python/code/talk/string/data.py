"""The committed data, typed. This is the only place the JSON is loaded."""

from __future__ import annotations

import json
from importlib.resources import files
from typing import Any

from .type import Attaches, Modifier, Phone


def _load(name: str) -> Any:
    text = (files("talk") / "base" / name).read_text("utf-8")
    return json.loads(text)


def _phone(d: dict[str, Any]) -> Phone:
    return Phone(
        ipa=d["ipa"],
        talk=d["talk"],
        xsampa=d["xsampa"],
        simple=d["simple"],
        form=d["form"],
        place=d.get("place"),
        manner=d.get("manner"),
        voicing=d.get("voicing"),
        height=d.get("height"),
        backness=d.get("backness"),
        roundedness=d.get("roundedness"),
        provisional=d.get("provisional"),
    )


def _attaches(d: dict[str, Any] | None) -> Attaches | None:
    if d is None:
        return None

    return Attaches(
        place=d.get("place"),
        not_place=d.get("notPlace"),
        manner=d.get("manner"),
        voicing=d.get("voicing"),
    )


def _modifier(d: dict[str, Any]) -> Modifier:
    return Modifier(
        ipa=d["ipa"],
        talk=d["talk"],
        xsampa=d["xsampa"],
        simple=d["simple"],
        base=d["base"],
        feature=d["feature"],
        slot=d["slot"],
        order=d["order"],
        prefix=d.get("prefix"),
        attaches=_attaches(d.get("attaches")),
        detail=d.get("detail"),
    )


phones: list[Phone] = [_phone(d) for d in _load("phones.json")]
modifiers: list[Modifier] = [_modifier(d) for d in _load("modifiers.json")]
# `base/tokens.json` is gone. Codes used to be assigned there, 91,332 of
# them, which loaded 4.5MB for an answer the model can derive. `code_of`
# in `space.codec` computes them instead.
