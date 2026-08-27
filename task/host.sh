#!/usr/bin/env bash
#
# Publish the talk libraries.
#
#   ./task/host.sh            all three
#   ./task/host.sh ts         typescript only
#   ./task/host.sh py rs      python and rust
#
# Names are the short form or the long one: ts/typescript, py/python,
# rs/rust. With no argument every library is published.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

typescript() {
  echo "==> typescript"
  cd "$ROOT/deck/typescript"
  pnpm build
  npm publish --access public
}

python() {
  echo "==> python"
  cd "$ROOT/deck/python"
  uv build
  uv publish
}

rust() {
  echo "==> rust"
  cd "$ROOT/deck/rust"
  cargo publish
}

# One name to one function, so `ts` and `typescript` reach the same place.
resolve() {
  case "$1" in
    ts | typescript) echo typescript ;;
    py | python) echo python ;;
    rs | rust) echo rust ;;
    *)
      echo "host: unknown library '$1', expected ts, py or rs" >&2
      exit 1
      ;;
  esac
}

main() {
  local wanted=()

  if [ "$#" -eq 0 ]; then
    wanted=(typescript python rust)
  else
    for one in "$@"; do
      wanted+=("$(resolve "$one")")
    done
  fi

  # RESOLVED BEFORE ANY PUBLISH RUNS. A bad name should stop the whole run
  # rather than surface after one library is already out, since a publish
  # cannot be taken back.
  for one in "${wanted[@]}"; do
    "$one"
  done

  echo "published: ${wanted[*]}"
}

main "$@"
