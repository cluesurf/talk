"""Copy the shared top-level base/ data into the importable package
(code/talk/base), so the wheel ships the data and importlib.resources can
load it at runtime. The single source of truth is the repo-root base/; this
copy is generated and gitignored.

Only the files this port actually loads are copied, so the wheel stays lean
(the TypeScript build likewise inlines just the imported JSON, never the
CSV source data).

    python code/make/copy_base.py
"""

from __future__ import annotations

import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parents[3] / "base"  # code/make -> code -> python -> deck -> repo root
TARGET = HERE.parent / "talk" / "base"  # code/make -> code -> code/talk/base

NEEDED = ("phones.json", "modifiers.json")

#: Directories copied whole. The syllable layer reads the cluster
#: whitelists, which are a tree of category files rather than one blob.
NEEDED_TREES = ("clusters",)

if TARGET.exists():
    shutil.rmtree(TARGET)

TARGET.mkdir(parents=True)

for name in NEEDED:
    shutil.copy2(SOURCE / name, TARGET / name)

for name in NEEDED_TREES:
    shutil.copytree(SOURCE / name, TARGET / name)

print(
    f"copied {len(NEEDED)} data files and {len(NEEDED_TREES)} trees: "
    f"{SOURCE} -> {TARGET}"
)
