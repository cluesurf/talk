// Copy the shared top-level base/ data into this crate's base/, so the
// `include_str!` calls resolve and `cargo package` ships the data. The single
// source of truth is the repo-root base/; this copy is generated and
// gitignored. When the crate is built from a published .crate archive the
// repo-root base/ is absent and the vendored copy is used as-is.

use std::fs;
use std::path::Path;

/// Only what the crate reads. The rest of the shared base/ (the Chinese symbol
/// tables above all) belongs to other tools and would dwarf the package.
const WANTED: [&str; 6] = [
  "phones.json",
  "modifiers.json",
  "tokens.json",
  "talk",
  "clusters",
  "ipa",
];

fn main() {
  let crate_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
  let source = crate_dir.join("../../base");
  let target = crate_dir.join("base");

  println!("cargo:rerun-if-changed=build.rs");
  // Watch the copy itself, so deleting it (a `git clean`, say) recopies
  // rather than failing the next build. A missing path counts as changed.
  // Nothing here rewrites an unchanged file, so this cannot loop.
  println!("cargo:rerun-if-changed=base");

  if !source.is_dir() {
    assert!(
      target.is_dir(),
      "neither {} nor the vendored {} exists",
      source.display(),
      target.display()
    );

    return;
  }

  println!("cargo:rerun-if-changed={}", source.display());

  for name in WANTED {
    let from = source.join(name);
    let to = target.join(name);

    if from.is_dir() {
      copy_dir(&from, &to);
      continue;
    }

    fs::create_dir_all(&target).expect("create target directory");

    if changed(&from, &to) {
      fs::copy(&from, &to).expect("copy data file");
    }
  }
}

fn copy_dir(source: &Path, target: &Path) {
  fs::create_dir_all(target).expect("create target directory");

  for entry in fs::read_dir(source).expect("read source directory") {
    let entry = entry.expect("read directory entry");
    let from = entry.path();
    let to = target.join(entry.file_name());

    if from.is_dir() {
      copy_dir(&from, &to);
    } else if changed(&from, &to) {
      fs::copy(&from, &to).expect("copy data file");
    }
  }
}

// Only rewrite a file whose contents differ, so an unchanged build does not
// keep bumping mtimes and retriggering itself.
fn changed(from: &Path, to: &Path) -> bool {
  match (fs::read(from), fs::read(to)) {
    (Ok(a), Ok(b)) => a != b,
    _ => true,
  }
}
