#!/usr/bin/env bash
#
# Set the version on the talk libraries.
#
#   ./task/molt.sh                 all three, bumped
#   ./task/molt.sh 5.0.0           all three, set
#   ./task/molt.sh ts              typescript, bumped
#   ./task/molt.sh ts 4.0.4        typescript, set
#   ./task/molt.sh py rs 4.2.0     python and rust, set
#
# Names are the short form or the long one: ts/typescript, py/python,
# rs/rust. With no name every library is touched.
#
# A BUMP LANDS ON AN EVEN PATCH, which is the house rule: 4.0.0 goes to
# 4.0.2, and an odd 4.0.3 goes up to 4.0.4 rather than 4.0.5. Each library
# is bumped from its OWN current version, so they can sit apart if they
# already do.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TYPESCRIPT="$ROOT/deck/typescript/package.json"
PYTHON="$ROOT/deck/python/pyproject.toml"
RUST="$ROOT/deck/rust/Cargo.toml"

read_version() {
  case "$1" in
    typescript)
      sed -n 's/^  "version": "\([^"]*\)".*/\1/p' "$TYPESCRIPT" | head -1
      ;;
    python)
      sed -n 's/^version = "\([^"]*\)".*/\1/p' "$PYTHON" | head -1
      ;;
    rust)
      sed -n 's/^version = "\([^"]*\)".*/\1/p' "$RUST" | head -1
      ;;
  esac
}

write_version() {
  local name="$1" version="$2" file

  case "$name" in
    typescript) file="$TYPESCRIPT" ;;
    python) file="$PYTHON" ;;
    rust) file="$RUST" ;;
  esac

  # Only the FIRST match, and only at the top level, so a dependency
  # pinned to the same string is left alone.
  case "$name" in
    typescript)
      perl -0pi -e 's/^(  "version": ")[^"]*(")/${1}'"$version"'${2}/m' "$file"
      ;;
    *)
      perl -0pi -e 's/^(version = ")[^"]*(")/${1}'"$version"'${2}/m' "$file"
      ;;
  esac
}

# The next even patch: 4.0.0 to 4.0.2, and an odd 4.0.3 up to 4.0.4.
next_version() {
  local current="$1"
  local major minor patch

  IFS=. read -r major minor patch <<<"$current"

  if [ $((patch % 2)) -eq 0 ]; then
    patch=$((patch + 2))
  else
    patch=$((patch + 1))
  fi

  echo "$major.$minor.$patch"
}

resolve() {
  case "$1" in
    ts | typescript) echo typescript ;;
    py | python) echo python ;;
    rs | rust) echo rust ;;
    *)
      echo "molt: unknown library '$1', expected ts, py or rs" >&2
      exit 1
      ;;
  esac
}

main() {
  local wanted=() version=''

  for one in "$@"; do
    if [[ "$one" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      version="$one"
    else
      wanted+=("$(resolve "$one")")
    fi
  done

  if [ "${#wanted[@]}" -eq 0 ]; then
    wanted=(typescript python rust)
  fi

  for one in "${wanted[@]}"; do
    local was next
    was="$(read_version "$one")"

    if [ -n "$version" ]; then
      next="$version"
    else
      next="$(next_version "$was")"
    fi

    write_version "$one" "$next"
    echo "$one: $was -> $next"
  done
}

main "$@"
