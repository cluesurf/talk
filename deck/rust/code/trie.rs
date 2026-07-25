//! A double-array trie for static longest-prefix matching.
//!
//! Build once from a fixed set of keys, then scan. This is the base/check
//! integer-array representation used by production tokenizers: a transition is
//! one array index, with no per-node allocation and no allocation per match.
//! It is the standard "best structure for static longest-match".
//!
//! State `s` transitions on a character with dense code `c` to state
//! `base[s] + c`, valid only when `check[base[s] + c] == s`. A state carries a
//! value when the prefix that reaches it is itself a key.
//!
//! Each character is mapped to its dense code through a small map. The alphabet
//! is sparse and high (astral IPA symbols sit far above the BMP), so a map of
//! the ~150 real characters is far smaller than a flat array spanning the whole
//! scalar range, and just as fast in practice.
//!
//! Offsets and match lengths are byte offsets into the `&str`, the Rust
//! convention. The TypeScript build counts UTF-16 code units instead, so an
//! astral key reports 4 here and 2 there; both mean "the whole character".

use std::collections::{BTreeMap, HashMap, VecDeque};

/// A temporary node used only while building, then discarded.
struct BuildNode<T> {
  children: BTreeMap<u32, BuildNode<T>>,
  value: Option<T>,
}

impl<T> Default for BuildNode<T> {
  fn default() -> Self {
    BuildNode {
      children: BTreeMap::new(),
      value: None,
    }
  }
}

pub struct TrieBuilder<T> {
  char_to_code: HashMap<char, u32>,
  next_code: u32,
  root: BuildNode<T>,
}

impl<T> Default for TrieBuilder<T> {
  fn default() -> Self {
    TrieBuilder::new()
  }
}

impl<T> TrieBuilder<T> {
  pub fn new() -> Self {
    TrieBuilder {
      char_to_code: HashMap::new(),
      next_code: 1,
      root: BuildNode::default(),
    }
  }

  pub fn add(&mut self, key: &str, value: T) {
    if key.is_empty() {
      return;
    }

    let mut node = &mut self.root;

    for character in key.chars() {
      // Remap sparse character codes to a dense 1.. alphabet so base
      // offsets stay small.
      let next_code = &mut self.next_code;
      let code = *self.char_to_code.entry(character).or_insert_with(|| {
        let code = *next_code;

        *next_code += 1;

        code
      });

      node = node.children.entry(code).or_default();
    }

    // First key wins, matching the data's declaration order.
    if node.value.is_none() {
      node.value = Some(value);
    }
  }

  pub fn build(self) -> Trie<T> {
    // Index 0 is unused, state 1 is the root.
    let mut root = self.root;
    let mut base = vec![0usize, 0];
    let mut check = vec![0usize, 0];
    let mut value: Vec<Option<T>> = Vec::new();

    value.push(None);
    value.push(root.value.take());

    let mut taken = vec![true, true];
    let mut queue: VecDeque<(BuildNode<T>, usize)> = VecDeque::new();

    queue.push_back((root, 1));

    let mut first_free = 2;

    while let Some((node, state)) = queue.pop_front() {
      if node.children.is_empty() {
        continue;
      }

      let codes: Vec<u32> = node.children.keys().copied().collect();
      let least = *codes.iter().min().expect("non-empty children") as isize;

      // Find a base `b` so every child slot `b + code` is free.
      let mut b = std::cmp::max(1, first_free as isize - least) as usize;

      loop {
        let mut fits = true;

        for &code in &codes {
          let slot = b + code as usize;

          grow(&mut base, &mut check, &mut value, &mut taken, slot);

          if taken[slot] {
            fits = false;
            break;
          }
        }

        if fits {
          break;
        }

        b += 1;
      }

      base[state] = b;

      for (code, mut child) in node.children {
        let slot = b + code as usize;

        taken[slot] = true;
        check[slot] = state;
        value[slot] = child.value.take();

        queue.push_back((child, slot));
      }

      while first_free < taken.len() && taken[first_free] {
        first_free += 1;
      }
    }

    Trie {
      char_to_code: self.char_to_code,
      base,
      check,
      value,
    }
  }
}

fn grow<T>(
  base: &mut Vec<usize>,
  check: &mut Vec<usize>,
  value: &mut Vec<Option<T>>,
  taken: &mut Vec<bool>,
  upto: usize,
) {
  while base.len() <= upto {
    base.push(0);
    check.push(0);
    value.push(None);
    taken.push(false);
  }
}

pub struct Trie<T> {
  char_to_code: HashMap<char, u32>,
  base: Vec<usize>,
  check: Vec<usize>,
  value: Vec<Option<T>>,
}

impl<T> Trie<T> {
  /// Every key that is a prefix of `text` at byte offset `at`, paired with
  /// its byte length, from shortest to longest.
  pub fn walk<'trie, 'text>(&'trie self, text: &'text str, at: usize) -> Walk<'trie, 'text, T> {
    Walk {
      trie: self,
      characters: text[at..].char_indices(),
      state: 1,
      done: false,
    }
  }

  /// The value of the longest key that is a prefix of `text` at `at`, with
  /// its byte length, or `None` if no key matches.
  pub fn match_at(&self, text: &str, at: usize) -> Option<(&T, usize)> {
    self.walk(text, at).last()
  }

  /// Every key that is a prefix of `text` at `at`, shortest first.
  pub fn match_all_at(&self, text: &str, at: usize) -> Vec<(&T, usize)> {
    self.walk(text, at).collect()
  }
}

pub struct Walk<'trie, 'text, T> {
  trie: &'trie Trie<T>,
  characters: std::str::CharIndices<'text>,
  state: usize,
  done: bool,
}

impl<'trie, T> Iterator for Walk<'trie, '_, T> {
  type Item = (&'trie T, usize);

  fn next(&mut self) -> Option<Self::Item> {
    while !self.done {
      let Some((offset, character)) = self.characters.next() else {
        self.done = true;
        break;
      };

      let Some(&code) = self.trie.char_to_code.get(&character) else {
        self.done = true;
        break;
      };

      let next = self.trie.base[self.state] + code as usize;

      if next >= self.trie.check.len() || self.trie.check[next] != self.state {
        self.done = true;
        break;
      }

      self.state = next;

      if let Some(hit) = &self.trie.value[self.state] {
        return Some((hit, offset + character.len_utf8()));
      }
    }

    None
  }
}

pub fn build_trie<'a, T, I>(entries: I) -> Trie<T>
where
  I: IntoIterator<Item = (&'a str, T)>,
{
  let mut builder = TrieBuilder::new();

  for (key, value) in entries {
    builder.add(key, value);
  }

  builder.build()
}
