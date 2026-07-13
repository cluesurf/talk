"""Build the distributable wheel + sdist into host/, from a clean slate.

host/ is cleared first: uv build only adds files, it never removes stale
ones, and uv publish uploads exactly the files it is handed (there is no
"latest" logic). So a leftover artifact from an old version or name would
be re-uploaded. Clearing first guarantees host/ holds only this version.

    python code/make/build.py
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PACKAGE = HERE.parents[1]  # code/make -> code -> python
HOST = PACKAGE / "host"

# 1. clean host/ so only this build's artifacts remain
if HOST.exists():
    shutil.rmtree(HOST)

# 2. copy the shared base/ data into the package
subprocess.run([sys.executable, str(HERE / "copy_base.py")], check=True)

# 3. build the wheel + sdist into host/
subprocess.run(
    ["uv", "build", "--out-dir", str(HOST), "--no-sources"],
    check=True,
    cwd=str(PACKAGE),
)

print("\nbuilt into host/:")
for artifact in sorted(HOST.glob("*")):
    print(f"  {artifact.name}")
