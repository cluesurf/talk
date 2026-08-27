//! Syllable parsing: split a talk word into syllables, each a sequence of
//! onset, nucleus, and coda clusters.

use std::cmp::Ordering;
use std::collections::HashMap;
use std::fmt;
use std::sync::OnceLock;

use serde::Deserialize;

use crate::string::types::Form;
use crate::syllable::clusters::{clusters, Category};
use crate::trie::{Trie, TrieBuilder};

// THE GENERATED SPELLING TABLE IS GONE. `read_segments` used to walk a trie
// built by crossing every base letter with every mark, which is what these
// axes fed. It tokenizes through `segment` now, the same scanner the rest of
// the library reads talk with, so a spelling can no longer be invented by
// the crossing that no phone table ever held.

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SegmentKind {
  Punctuation,
  Vowel,
  Consonant,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
pub enum Tone {
  #[serde(rename = "extra high")]
  ExtraHigh,
  #[serde(rename = "high")]
  High,
  #[serde(rename = "low")]
  Low,
  #[serde(rename = "extra low")]
  ExtraLow,
  #[serde(rename = "rising")]
  Rising,
  #[serde(rename = "rising 2")]
  Rising2,
  #[serde(rename = "falling")]
  Falling,
  #[serde(rename = "falling 2")]
  Falling2,
  #[serde(rename = "rising falling")]
  RisingFalling,
  #[serde(rename = "falling rising")]
  FallingRising,
}

impl Tone {
  fn as_talk(self) -> &'static str {
    match self {
      Tone::ExtraHigh => "++",
      Tone::High => "+",
      Tone::Low => "-",
      Tone::ExtraLow => "--",
      Tone::Rising => "/",
      Tone::Rising2 => "//",
      Tone::Falling => "\\",
      Tone::Falling2 => "\\\\",
      Tone::RisingFalling => "/\\",
      Tone::FallingRising => "\\/",
    }
  }
}

/// One parsed mark: a base sound plus the features stacked onto it.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Segment {
  /// Joined to the segment after it by a tie, so no cluster boundary may
  /// fall between them.
  pub bound: bool,
  /// The exact talk this segment was read from.
  ///
  /// WHY IT IS CARRIED RATHER THAN REBUILT. `serialize` used to spell a
  /// segment back out of its feature flags, which meant a cluster text was a
  /// RECONSTRUCTION and not the input. Any modifier the flag table did not
  /// name simply vanished, and the flags themselves still spelled in the old
  /// bare-sigil notation, so `k<wh>` came back as `k`. Carrying the text
  /// makes the split lossless by construction: the clusters run together are
  /// always the word they came from.
  pub talk: Option<String>,
  pub kind: Option<SegmentKind>,
  pub value: Option<String>,
  pub tone: Option<Tone>,
  pub aspiration: bool,
  pub click: bool,
  pub dentalization: bool,
  pub ejection: bool,
  pub elongation: bool,
  pub emphasis: bool,
  pub implosion: bool,
  pub labialization: bool,
  pub nasalization: bool,
  pub palatalization: bool,
  pub pharyngealization: bool,
  pub stop: bool,
  pub tense: bool,
  pub truncation: bool,
  pub velarization: bool,
  pub voicelessness: bool,
}

impl Segment {
  fn text(&self) -> &str {
    self.value.as_deref().unwrap_or("")
  }
}

// THE GENERATED SPELLING TABLE IS GONE, and with it the flag families, the
// punctuation and feature records, and the base-letter list that fed them.
// `read_segments` walked a trie built by crossing every base letter with
// every mark; it tokenizes through `segment` now, so none of that machinery
// has a caller. Kept out rather than kept dead: the TypeScript build is the
// reference if the old shape is ever wanted back.


// ─── fast cluster lookup ─────────────────────────────────────────────────────
//
// Instead of scanning every cluster at each position, each list becomes a trie
// keyed by the value string it spells out, so a lookup walks once to gather
// candidates. Each candidate is then verified with the exact same check the
// flat scan used (the next `count` sounds, joined, equal the cluster's value
// form), so this matches that logic sound for sound.

/// The collation the TypeScript build gets from `String.prototype.localeCompare`
/// under the root locale: letters compare case-insensitively first (their
/// primary weight), and case breaks the tie afterwards across the whole string
/// rather than character by character. The cluster alphabet is `:`, `'`, `$`
/// and ASCII letters, which sort in that order.
fn primary(character: char) -> u32 {
  match character {
    ':' => 0,
    '\'' => 1,
    '$' => 2,
    letter if letter.is_ascii_alphabetic() => {
      10 + (letter.to_ascii_lowercase() as u32 - 'a' as u32)
    }
    other => 1000 + other as u32,
  }
}

fn tertiary(character: char) -> u8 {
  character.is_ascii_uppercase() as u8
}

fn collate(a: &str, b: &str) -> Ordering {
  a.chars()
    .map(primary)
    .cmp(b.chars().map(primary))
    .then_with(|| a.chars().map(tertiary).cmp(b.chars().map(tertiary)))
}

/// Longest first, alphabetical within a length.
fn sort_length(a: &str, b: &str) -> Ordering {
  b.chars()
    .count()
    .cmp(&a.chars().count())
    .then_with(|| collate(a, b))
}

/// A cluster and how many sounds it spans.
#[derive(Debug, Clone)]
struct ClusterCount {
  cluster: String,
  count: usize,
}

/// Group clusters by the value string they match. Consonant clusters carry only
/// colons (split markers, dropped for matching), so the value string is the
/// colon-stripped form and the span is its length. Vowel clusters carry `$`
/// variant marks, which are part of the sound value, so the value string keeps
/// them and the span is the base-vowel count.
fn build_cluster_trie(list: &[String], vowel: bool) -> Trie<Vec<ClusterCount>> {
  let mut order: Vec<String> = Vec::new();
  let mut by_key: HashMap<String, Vec<ClusterCount>> = HashMap::new();

  for cluster in list {
    let key = if vowel {
      cluster.clone()
    } else {
      cluster.replace(':', "")
    };
    // COUNTED IN SOUNDS, NOT CHARACTERS. `count` says how many chunks the
    // cluster consumes, and a chunk is a sound. This was the character
    // length, which held only while every sound was one letter. It is not:
    // `$'` is the pharyngeal fricative written two characters, and counting
    // it as two made the grouper ask for two chunks where the word had one,
    // so no candidate ever matched and `aiyu$'aK` failed outright.
    //
    // `$`, `~` and `!` are variant markers on the letter that follows or
    // precedes them, never sounds of their own, so they come out first.
    let count = if vowel {
      cluster.replace('$', "").chars().count()
    } else {
      cluster
        .replace(':', "")
        .replace(['$', '~', '!'], "")
        .chars()
        .count()
    };

    by_key
      .entry(key.clone())
      .or_insert_with(|| {
        order.push(key);
        Vec::new()
      })
      .push(ClusterCount {
        cluster: cluster.clone(),
        count,
      });
  }

  let mut builder = TrieBuilder::new();

  for key in &order {
    builder.add(key, by_key.remove(key).expect("grouped key"));
  }

  builder.build()
}

struct Lookup {
  full_consonant: Trie<Vec<ClusterCount>>,
  start_consonant: Trie<Vec<ClusterCount>>,
  end_consonant: Trie<Vec<ClusterCount>>,
  consonant: Trie<Vec<ClusterCount>>,
  vowel: Trie<Vec<ClusterCount>>,
  start_consonant_stripped: Vec<String>,
}

fn lookup() -> &'static Lookup {
  static CELL: OnceLock<Lookup> = OnceLock::new();

  CELL.get_or_init(|| {
    let all = clusters();
    // Longest first, so the trie groups are built in the same order the
    // flat scan visited them.
    let by_length = |category: &Category| -> Vec<String> {
      let mut list = category.talk.clone();

      list.sort_by_key(|cluster| std::cmp::Reverse(cluster.chars().count()));
      list
    };

    let start = by_length(&all.start_consonants);

    Lookup {
      full_consonant: build_cluster_trie(&by_length(&all.full_consonants), false),
      start_consonant: build_cluster_trie(&start, false),
      end_consonant: build_cluster_trie(&by_length(&all.end_consonants), false),
      consonant: build_cluster_trie(&by_length(&all.consonants), false),
      vowel: build_cluster_trie(&by_length(&all.vowels), true),
      start_consonant_stripped: start
        .iter()
        .map(|cluster| cluster.replace(':', ""))
        .collect(),
    }
  })
}

/// The sound values of a word, joined, with the character offset each sound
/// starts at.
struct Frame {
  text: String,
  offset_of_index: Vec<usize>,
}

fn frame_of(chunks: &[Segment]) -> Frame {
  let mut offset_of_index = Vec::with_capacity(chunks.len());
  let mut text = String::new();

  for chunk in chunks {
    offset_of_index.push(text.len());
    text.push_str(chunk.text());
  }

  Frame {
    text,
    offset_of_index,
  }
}

#[derive(Debug, Clone)]
struct ClusterMatch {
  cluster: String,
  count: usize,
}

/// The sounds `chunks[i..i + count]` spell out, joined.
fn joined(chunks: &[Segment], i: usize, count: usize) -> String {
  let end = (i + count).min(chunks.len());

  chunks[i..end].iter().map(Segment::text).collect()
}

/// Clusters that match at sound `i`, verified exactly as the flat scan did
/// (`chunks[i..i + count]` joined equals the cluster's value form), ordered
/// longest first with alphabetical ties.
fn cluster_matches(
  trie: &Trie<Vec<ClusterCount>>,
  frame: &Frame,
  chunks: &[Segment],
  i: usize,
) -> Vec<ClusterMatch> {
  // Past the last sound there is nothing to match.
  let Some(&offset) = frame.offset_of_index.get(i) else {
    return Vec::new();
  };

  let mut out: Vec<ClusterMatch> = Vec::new();

  for (group, length) in trie.match_all_at(&frame.text, offset) {
    let key = &frame.text[offset..offset + length];

    for candidate in group {
      // A MATCH MAY NOT END INSIDE A TIE. The last sound it takes must not
      // be joined to the one after it, or the cluster boundary would fall
      // in the middle of a segment the writer said was one.
      let cut = chunks
        .get(i + candidate.count - 1)
        .is_some_and(|one| one.bound);

      if !cut && joined(chunks, i, candidate.count) == key {
        out.push(ClusterMatch {
          cluster: candidate.cluster.clone(),
          count: candidate.count,
        });
      }
    }
  }

  out.sort_by(|a, b| sort_length(&a.cluster, &b.cluster));

  out
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ClusterKey {
  FullConsonant,
  Consonant,
  StartConsonant,
  EndConsonant,
  Vowel,
  Punctuation,
}

impl ClusterKey {
  pub fn as_str(self) -> &'static str {
    match self {
      ClusterKey::FullConsonant => "full-consonant",
      ClusterKey::Consonant => "consonant",
      ClusterKey::StartConsonant => "start-consonant",
      ClusterKey::EndConsonant => "end-consonant",
      ClusterKey::Vowel => "vowel",
      ClusterKey::Punctuation => "punctuation",
    }
  }

  /// The code table this cluster form draws its token from. Punctuation
  /// carries its own spelling instead of a table code.
  fn codes(self) -> Option<&'static HashMap<String, String>> {
    let all = clusters();

    match self {
      ClusterKey::FullConsonant => Some(&all.full_consonants.code),
      ClusterKey::Consonant => Some(&all.consonants.code),
      ClusterKey::StartConsonant => Some(&all.start_consonants.code),
      ClusterKey::EndConsonant => Some(&all.end_consonants.code),
      ClusterKey::Vowel => Some(&all.vowels.code),
      ClusterKey::Punctuation => None,
    }
  }
}

impl fmt::Display for ClusterKey {
  fn fmt(&self, out: &mut fmt::Formatter<'_>) -> fmt::Result {
    out.write_str(self.as_str())
  }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Cluster {
  pub form: ClusterKey,
  pub text: String,
  pub code: String,
  /// Primary stress marker, true if this cluster carries the primary stress.
  pub emphasis: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Syllable {
  pub clusters: Vec<Cluster>,
  /// Primary stress marker, true if this syllable contains the primary
  /// stress.
  pub emphasis: bool,
}

/// Every stage of the parse, for callers that want the intermediate forms.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Chunked {
  pub marks: Vec<Segment>,
  pub syllables: Vec<Syllable>,
  pub clusters: Vec<Cluster>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
  /// The input has a run that no segment spelling matches.
  InvalidCharacters { input: String, rest: String },
  /// The sounds parsed, but no cluster covers them.
  NoClusterMatch { text: String },
}

impl fmt::Display for Error {
  fn fmt(&self, out: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      Error::InvalidCharacters { input, rest } => {
        write!(out, "invalid characters found in {input:?} at {rest:?}")
      }
      Error::NoClusterMatch { text } => write!(out, "no match found for {text}"),
    }
  }
}

impl std::error::Error for Error {}

/// Step 1: parse a string into marks (basic tokens).
///
/// TOKENIZED BY THE READER, NOT BY A TABLE OF SPELLINGS. This walked a trie
/// of every mark spelling, which held while a mark was a bare sigil and broke
/// the moment they moved inside brackets: `<` and `>` are in no entry, so a
/// modified sound could not be matched at all. `segment` already knows how to
/// read one, so the marks come from it and the table is gone.
pub fn read_segments(text: &str) -> Result<Vec<Segment>, Error> {
  let mut chunks: Vec<Segment> = Vec::new();

  for sound in crate::string::sound::segment(text) {
    let Some(base) = sound.base else {
      // A BOUND SOUND IS A SOUND, NOT PUNCTUATION. A tie makes `t͡ʃ` one
      // segment, and the reader returns it raw because the binding is a
      // claim about its parts rather than a new phone. Filed as punctuation
      // it was SKIPPED by the assembler, so every tied affricate vanished.
      //
      // READ AS ITS PARTS, SPELLED AS ONE. The cluster tables count in
      // sounds, and `tx` is two, so one chunk valued `tx` matched nothing.
      // Each letter becomes a segment and the bracket run rides on the last.
      if let Some((letters, run)) = split_tie(&sound.talk) {
        let parts = crate::string::sound::segment(letters);
        let total = parts.len();

        for (at, part) in parts.iter().enumerate() {
          let last = at + 1 == total;

          chunks.push(Segment {
            talk: Some(if last {
              format!("{}{}", part.talk, run)
            } else {
              part.talk.clone()
            }),
            bound: !last,
            kind: Some(match part.base.map(|one| one.form) {
              Some(Form::Vowel) => SegmentKind::Vowel,
              _ => SegmentKind::Consonant,
            }),
            value: Some(match part.base {
              Some(one) => one.talk.clone(),
              None => part.talk.clone(),
            }),
            ..Segment::default()
          });
        }

        continue;
      }

      // STRESS BELONGS TO THE SOUND BEFORE IT. `^` is a mark, not a sound,
      // and the reader hands it back on its own because it has no base.
      // Filed as punctuation it would break the nucleus in two and drop the
      // mark from the cluster text, so it is folded onto the segment it
      // modifies instead.
      if sound.talk == "^" {
        if let Some(last) = chunks.last_mut() {
          if last.kind != Some(SegmentKind::Punctuation) {
            last.emphasis = true;
            last.talk = Some(format!(
              "{}{}",
              last.talk.clone().unwrap_or_default(),
              sound.talk
            ));
            continue;
          }
        }
      }

      // A passthrough: punctuation, a space, a digit. Carried with its own
      // text so nothing is dropped, and typed so the grouper skips it.
      chunks.push(Segment {
        talk: Some(sound.talk.clone()),
        kind: Some(SegmentKind::Punctuation),
        value: Some(sound.talk),
        ..Segment::default()
      });

      continue;
    };

    // A DERIVED PHONE CARRIES ITS MARKS IN ITS OWN SPELLING. `m̥` is one
    // entry in the phone table spelled `m<v->`, so the reader hands it back
    // as a base rather than as `m` plus voiceless. The grouper reasons about
    // a LETTER and a set of flags, so the bracket is opened here and its
    // marks join the ones the sound already carries.
    let letter = match base.talk.find('<') {
      Some(at) => base.talk[..at].to_string(),
      None => base.talk.clone(),
    };

    let inside = match base.talk.find('<') {
      Some(at) => base.talk[at + 1..base.talk.len() - 1].to_string(),
      None => String::new(),
    };

    let mut seg = Segment {
      talk: Some(sound.talk.clone()),
      kind: Some(match base.form {
        Form::Vowel => SegmentKind::Vowel,
        _ => SegmentKind::Consonant,
      }),
      value: Some(letter),
      ..Segment::default()
    };

    for one in sound.pre.iter().chain(sound.modifiers.iter()) {
      set_flag(&mut seg, &one.feature);
    }

    // LONGEST FIRST, AND CONSUMED. `v-` is voiceless and `v` is voiced, so
    // scanning short-first matches `v` inside `v-` and sets the opposite
    // feature. Each match is removed from the body so one mark cannot be
    // read twice, which is what put a stray `stress` on `m<v->`.
    let mut rest = inside.clone();
    let state = crate::string::runtime::runtime();
    let mut known: Vec<&crate::string::types::Modifier> = state
      .consonant_modifiers
      .iter()
      .chain(state.vowel_modifiers.iter())
      .copied()
      .collect();

    known.sort_by_key(|one| std::cmp::Reverse(one.talk.len()));

    for one in known {
      if one.talk.is_empty() {
        continue;
      }

      if let Some(at) = rest.find(one.talk.as_str()) {
        set_flag(&mut seg, &one.feature);
        rest.replace_range(at..at + one.talk.len(), "");
      }
    }

    chunks.push(seg);
  }

  Ok(chunks)
}

/// A bound sound split into its letters and the bracket run holding the
/// binder, or `None` when the talk is not a bound sound.
fn split_tie(talk: &str) -> Option<(&str, &str)> {
  let open = talk.rfind('<')?;

  if !talk.ends_with('>') {
    return None;
  }

  let body = &talk[open + 1..talk.len() - 1];
  let at = body.rfind('B')?;

  if !body[at + 1..].chars().all(|one| one.is_ascii_digit()) {
    return None;
  }

  Some((&talk[..open], &talk[open..]))
}

/// Turn a feature name into the flag the grouper reads.
///
/// EXACTLY THE EIGHT THE TYPESCRIPT BUILD MAPS. Adding more looks harmless
/// and is not: `stress` set `emphasis` here, which the reference build only
/// ever sets from a folded `^`, so every voiceless nasal came back carrying a
/// stress it was never written with.
fn set_flag(seg: &mut Segment, feature: &str) {
  match feature {
    "aspirated" => seg.aspiration = true,
    "ejective" => seg.ejection = true,
    "dental" => seg.dentalization = true,
    "labialized" => seg.labialization = true,
    "palatalized" => seg.palatalization = true,
    "pharyngealized" => seg.pharyngealization = true,
    "velarized" => seg.velarization = true,
    "voiceless" => seg.voicelessness = true,
    _ => {}
  }
}

#[derive(Debug, Clone)]
struct Span {
  form: ClusterKey,
  chunk: Vec<Segment>,
  matched: String,
}

/// A cluster spelling is "dense" when it is more than one sound and does not
/// start with a glottal stop. Those are handled after the standalone forms.
fn is_dense(stripped: &str) -> bool {
  // The TypeScript build also excludes a bare `l`, `r`, `w` or `y` here,
  // which a spelling of two or more sounds can never be.
  stripped.chars().count() >= 2 && !stripped.starts_with('\'')
}

/// Step 2: group marks into clusters.
pub fn group_segments_into_clusters(chunks: &[Segment]) -> Result<Vec<Cluster>, Error> {
  let tries = lookup();
  let frame = frame_of(chunks);
  let mut list: Vec<Vec<Span>> = Vec::new();
  let mut i = 0;

  let slice = |from: usize, count: usize| -> Vec<Segment> {
    let end = (from + count).min(chunks.len());

    chunks[from..end].to_vec()
  };

  while i < chunks.len() {
    let mut span: Vec<Span> = Vec::new();
    let chunk = &chunks[i];

    if chunk.kind == Some(SegmentKind::Punctuation) {
      list.push(vec![Span {
        chunk: vec![chunk.clone()],
        matched: chunk.text().to_string(),
        form: ClusterKey::Punctuation,
      }]);
      i += 1;
      continue;
    }

    // First check for standalone full consonants (high priority).
    for candidate in cluster_matches(&tries.full_consonant, &frame, chunks, i) {
      let stripped = candidate.cluster.replace(':', "");

      // Only match standalone consonants (single characters or glottal
      // plus consonant). Skip dense clusters like `gm` or `kn`.
      if is_dense(&stripped) {
        continue;
      }

      let take = Span {
        chunk: slice(i, candidate.count),
        matched: candidate.cluster.clone(),
        form: ClusterKey::FullConsonant,
      };

      if !candidate.cluster.contains(':') {
        // No colon, normal match.
        span.push(take);
        i += candidate.count;
        break;
      }

      // A colon pattern. Look ahead to see what follows.
      let Some(next_chunk) = chunks.get(i + candidate.count) else {
        // At end of word, do not split.
        span.push(take);
        i += candidate.count;
        break;
      };

      // Only split if next is a vowel, so if it is, skip this full
      // consonant match to allow potential splitting later.
      if next_chunk.kind == Some(SegmentKind::Vowel) {
        continue;
      }

      // Check if splitting would allow a better match. For example,
      // `'l:d` followed by `j` could be `'l` plus `dj`.
      let parts: Vec<&str> = candidate.cluster.split(':').collect();

      if parts.len() == 2 {
        let potential = format!("{}{}", parts[1], next_chunk.text());

        // Skip this match to allow splitting into a start consonant.
        if tries.start_consonant_stripped.contains(&potential) {
          continue;
        }
      }

      // Do not split, treat as full consonant.
      span.push(take);
      i += candidate.count;
      break;
    }

    if !span.is_empty() {
      list.push(span);
      continue;
    }

    if let Some(candidate) = cluster_matches(&tries.start_consonant, &frame, chunks, i).first() {
      span.push(Span {
        chunk: slice(i, candidate.count),
        matched: candidate.cluster.clone(),
        form: ClusterKey::StartConsonant,
      });
      i += candidate.count;
    }

    if let Some(candidate) = cluster_matches(&tries.vowel, &frame, chunks, i).first() {
      span.push(Span {
        chunk: slice(i, candidate.count),
        matched: candidate.cluster.clone(),
        form: ClusterKey::Vowel,
      });
      i += candidate.count;
    }

    // Check if any dense full consonant would match before trying end
    // consonants, and prefer whichever match is longer.
    let mut dense: Option<ClusterMatch> = None;

    for candidate in cluster_matches(&tries.full_consonant, &frame, chunks, i) {
      if !is_dense(&candidate.cluster.replace(':', "")) {
        continue;
      }

      if dense
        .as_ref()
        .map_or(true, |best| candidate.count > best.count)
      {
        dense = Some(candidate);
      }
    }

    let mut end: Option<ClusterMatch> = None;

    for candidate in cluster_matches(&tries.end_consonant, &frame, chunks, i) {
      if end
        .as_ref()
        .map_or(true, |best| candidate.count > best.count)
      {
        end = Some(candidate);
      }
    }

    let chosen = match (&dense, &end) {
      (Some(dense), Some(end)) if dense.count > end.count => {
        Some((dense, ClusterKey::FullConsonant))
      }
      (Some(_), Some(end)) => Some((end, ClusterKey::EndConsonant)),
      (Some(dense), None) => Some((dense, ClusterKey::FullConsonant)),
      (None, Some(end)) => Some((end, ClusterKey::EndConsonant)),
      (None, None) => None,
    };

    let matched = chosen.is_some();

    if let Some((candidate, form)) = chosen {
      span.push(Span {
        chunk: slice(i, candidate.count),
        matched: candidate.cluster.clone(),
        form,
      });
      i += candidate.count;
    }

    // Only process single consonants if the span is still empty, so the
    // current span is completed before a new one starts.
    if !matched && span.is_empty() {
      if let Some(candidate) = cluster_matches(&tries.consonant, &frame, chunks, i).first() {
        span.push(Span {
          chunk: slice(i, candidate.count),
          matched: candidate.cluster.clone(),
          form: ClusterKey::Consonant,
        });
        i += candidate.count;
      }
    }

    // If no matches were found yet, try dense consonant clusters as a
    // fallback.
    if span.is_empty() {
      for candidate in cluster_matches(&tries.full_consonant, &frame, chunks, i) {
        if !is_dense(&candidate.cluster.replace(':', "")) {
          continue;
        }

        span.push(Span {
          chunk: slice(i, candidate.count),
          matched: candidate.cluster.clone(),
          form: ClusterKey::FullConsonant,
        });
        i += candidate.count;
        break;
      }
    }

    if span.is_empty() {
      return Err(Error::NoClusterMatch {
        text: chunks[i..].iter().map(Segment::text).collect(),
      });
    }

    list.push(span);
  }

  split_colon_spans(&mut list);
  lean_colon_spans_onto_vowels(&mut list);

  Ok(
    list
      .into_iter()
      .flatten()
      .map(|span| {
        let emphasis = span.chunk.iter().any(|mark| mark.emphasis);
        let code = match span.form.codes() {
          Some(codes) => codes.get(&span.matched).cloned().unwrap_or_default(),
          None => span.matched.clone(),
        };

        Cluster {
          form: span.form,
          text: span.chunk.iter().map(serialize).collect(),
          code,
          emphasis,
        }
      })
      .collect(),
  )
}

/// Divide `chunk` at the point where its sounds spell `left`, so the colon in a
/// cluster spelling becomes a real boundary.
///
/// A COLON MAY NOT CUT A TIE. `t:s` says the cluster may break between `t` and
/// `s`, but when those two are the halves of one affricate the break would
/// split a segment the writer bound together, so the chunk comes back whole.
fn divide(chunk: &[Segment], left: &str) -> (Vec<Segment>, Vec<Segment>) {
  let mut before: Vec<Segment> = Vec::new();
  let mut after: Vec<Segment> = Vec::new();
  let mut text = String::new();
  let mut past = false;

  for mark in chunk {
    text.push_str(mark.text());

    if past {
      after.push(mark.clone());
    } else {
      before.push(mark.clone());
    }

    if text == left && after.is_empty() {
      past = true;
    }
  }

  if !after.is_empty() && before.last().is_some_and(|one| one.bound) {
    return (chunk.to_vec(), Vec::new());
  }

  (before, after)
}

/// First pass: split clusters with colons when appropriate.
fn split_colon_spans(list: &mut [Vec<Span>]) {
  for i in 0..list.len() {
    let mut j = 0;

    while j < list[i].len() {
      let span = list[i][j].clone();

      if !span.matched.contains(':') {
        j += 1;
        continue;
      }

      // Split an end consonant that is followed by a vowel.
      let next_form = match list[i].get(j + 1) {
        Some(next) => Some(next.form),
        None => list
          .get(i + 1)
          .and_then(|node| node.first())
          .map(|s| s.form),
      };

      if span.form != ClusterKey::EndConsonant || next_form != Some(ClusterKey::Vowel) {
        j += 1;
        continue;
      }

      let parts: Vec<&str> = span.matched.split(':').collect();
      let left_part = parts.first().copied().unwrap_or_default().to_string();
      let right_part = parts.get(1).copied().unwrap_or_default().to_string();
      let (left, right) = divide(&span.chunk, &left_part);

      if right.is_empty() {
        j += 1;
        continue;
      }

      // Replace the original span with two new spans.
      list[i].splice(
        j..j + 1,
        [
          Span {
            chunk: left,
            matched: left_part,
            form: ClusterKey::EndConsonant,
          },
          Span {
            chunk: right,
            matched: right_part,
            form: ClusterKey::Consonant,
          },
        ],
      );

      // Skip the newly inserted span.
      j += 2;
    }
  }
}

/// Second pass: a colon span whose next node is a vowel hands its tail to that
/// vowel, so the boundary lands between syllables.
fn lean_colon_spans_onto_vowels(list: &mut [Vec<Span>]) {
  for i in 1..list.len() {
    let (before, from) = list.split_at_mut(i);
    let Some(last_span) = before[i - 1].last_mut() else {
      continue;
    };
    let Some(node_span) = from[0].first_mut() else {
      continue;
    };

    if !last_span.matched.contains(':') || node_span.form != ClusterKey::Vowel {
      continue;
    }

    let left_part = last_span
      .matched
      .split(':')
      .next()
      .unwrap_or_default()
      .to_string();
    let (left, right) = divide(&last_span.chunk, &left_part);

    if !right.is_empty() {
      node_span.chunk.splice(0..0, right);
    }

    last_span.chunk = left;
  }
}

/// Spell a mark back out in talk.
pub fn serialize(mark: &Segment) -> String {
  // The text it was read from, when there is one. The flag-based spelling
  // below is the fallback for a segment built by hand rather than by the
  // tokenizer, and it still writes the old bare-sigil suffixes.
  if let Some(talk) = &mark.talk {
    return talk.clone();
  }

  let mut text = String::new();

  text.push_str(mark.text());

  for (set, spelling) in [
    (mark.click, "*"),
    (mark.ejection, "!"),
    (mark.implosion, "?"),
    (mark.nasalization, "&"),
  ] {
    if set {
      text.push_str(spelling);
    }
  }

  if let Some(tone) = mark.tone {
    text.push_str(tone.as_talk());
  }

  for (set, spelling) in [
    (mark.elongation, "_"),
    (mark.truncation, "!"),
    (mark.emphasis, "^"),
    (mark.dentalization, "~"),
    (mark.pharyngealization, "Q~"),
    (mark.velarization, "G~"),
    (mark.palatalization, "y~"),
    (mark.labialization, "w~"),
    (mark.aspiration, "h~"),
    (mark.stop, "."),
    (mark.tense, "@"),
  ] {
    if set {
      text.push_str(spelling);
    }
  }

  text
}

/// Step 3: group clusters into syllables.
pub fn group_clusters_into_syllables(clusters: &[Cluster]) -> Vec<Syllable> {
  let mut syllables: Vec<Syllable> = Vec::new();
  let mut i = 0;

  while i < clusters.len() {
    let cluster = &clusters[i];

    // Skip punctuation (spaces and the like), it does not belong in a
    // syllable.
    if cluster.form == ClusterKey::Punctuation {
      i += 1;
      continue;
    }

    let mut syllable = Syllable::default();

    match cluster.form {
      ClusterKey::Vowel => {
        syllable.clusters.push(cluster.clone());
        i += 1;

        take_coda(clusters, &mut i, &mut syllable);
      }

      // A full consonant is a complete syllable by itself.
      ClusterKey::FullConsonant => {
        syllable.clusters.push(cluster.clone());
        i += 1;
      }

      ClusterKey::Consonant | ClusterKey::StartConsonant => {
        syllable.clusters.push(cluster.clone());
        i += 1;

        // Look for a vowel.
        while i < clusters.len() && clusters[i].form != ClusterKey::Vowel {
          let next = clusters[i].clone();

          if next.form == ClusterKey::Punctuation {
            i += 1;
            continue;
          }

          // Each start consonant begins its own syllable in a
          // consonant sequence.
          if next.form == ClusterKey::StartConsonant && !syllable.clusters.is_empty() {
            break;
          }

          if next.form == ClusterKey::EndConsonant {
            let only_single = syllable
              .clusters
              .iter()
              .all(|c| c.form == ClusterKey::Consonant);

            // Break before the end consonant to let it start its
            // own syllable.
            if only_single && syllable.clusters.len() >= 2 {
              break;
            }

            syllable.clusters.push(next);
            i += 1;

            let upcoming_vowel = clusters[i..]
              .iter()
              .take(3)
              .any(|c| c.form == ClusterKey::Vowel);

            // Always break after an end consonant in a
            // consonant-only sequence.
            if !upcoming_vowel {
              break;
            }

            continue;
          }

          syllable.clusters.push(next.clone());
          i += 1;

          if start_consonant_then_consonant(&syllable)
            && more_consonants_ahead(clusters, i)
            && syllable.clusters.len() == 2
          {
            break;
          }

          // A start consonant plus two single consonants is already
          // full, so do not take another.
          if syllable.clusters.len() >= 3 {
            let has_start = syllable
              .clusters
              .iter()
              .any(|c| c.form == ClusterKey::StartConsonant);
            let singles = syllable
              .clusters
              .iter()
              .filter(|c| c.form == ClusterKey::Consonant)
              .count();

            if has_start && singles >= 2 {
              // Put back the consonant just added.
              syllable.clusters.pop();
              i -= 1;
              break;
            }
          }

          if next.text != "'" {
            continue;
          }

          // A start consonant plus `'` is its own syllable, so close
          // out whatever came before it.
          let previous = syllable
            .clusters
            .len()
            .checked_sub(2)
            .map(|at| syllable.clusters[at].form);

          if previous == Some(ClusterKey::StartConsonant) {
            // Remove the `'` just added, then the start consonant.
            syllable.clusters.pop();
            i -= 1;

            let start = syllable.clusters.pop().expect("start consonant");

            if !syllable.clusters.is_empty() {
              syllable.emphasis = syllable.clusters.iter().any(|c| c.emphasis);
              syllables.push(std::mem::take(&mut syllable));
            }

            syllables.push(Syllable {
              emphasis: start.emphasis || next.emphasis,
              clusters: vec![start, next],
            });

            i += 1;
            syllable = Syllable::default();
            break;
          }

          // Otherwise a following consonant completes this syllable.
          if syllable.clusters.len() > 1
            && clusters.get(i).is_some_and(|c| c.form != ClusterKey::Vowel)
          {
            break;
          }
        }

        // Add the vowel if one was found, then its coda. With no vowel
        // the consonants collected so far are the whole syllable.
        if clusters.get(i).is_some_and(|c| c.form == ClusterKey::Vowel) {
          syllable.clusters.push(clusters[i].clone());
          i += 1;

          take_coda(clusters, &mut i, &mut syllable);
        }
      }

      // An end consonant always ends a syllable, never take following
      // consonants.
      ClusterKey::EndConsonant => {
        syllable.clusters.push(cluster.clone());
        i += 1;
      }

      ClusterKey::Punctuation => unreachable!("punctuation is skipped above"),
    }

    if !syllable.clusters.is_empty() {
      syllable.emphasis = syllable.clusters.iter().any(|c| c.emphasis);
      syllables.push(syllable);
    }
  }

  syllables
}

/// The syllable is a start consonant followed by a single consonant.
fn start_consonant_then_consonant(syllable: &Syllable) -> bool {
  syllable.clusters.len() >= 2
    && syllable.clusters[0].form == ClusterKey::StartConsonant
    && syllable.clusters[syllable.clusters.len() - 1].form == ClusterKey::Consonant
}

/// Two or more consonants come before the next vowel, so the current syllable
/// should close rather than absorb them.
fn more_consonants_ahead(clusters: &[Cluster], i: usize) -> bool {
  let Some(upcoming) = clusters.get(i) else {
    return false;
  };

  if upcoming.form == ClusterKey::Vowel || upcoming.form == ClusterKey::Punctuation {
    return false;
  }

  let mut consonants = 0;

  for future in clusters[i..].iter().take(4) {
    if future.form == ClusterKey::Punctuation {
      continue;
    }

    if future.form == ClusterKey::Vowel {
      break;
    }

    consonants += 1;
  }

  consonants >= 2
}

/// Take the consonants that close a syllable after its vowel.
fn take_coda(clusters: &[Cluster], i: &mut usize, syllable: &mut Syllable) {
  while *i < clusters.len() {
    let next = &clusters[*i];

    if next.form == ClusterKey::Punctuation {
      *i += 1;
      continue;
    }

    // A vowel starts a new syllable.
    if next.form == ClusterKey::Vowel {
      break;
    }

    // An end consonant closes this one.
    if next.form == ClusterKey::EndConsonant {
      syllable.clusters.push(next.clone());
      *i += 1;
      break;
    }

    // A consonant with a vowel after it belongs to the next syllable, and a
    // full consonant always starts its own.
    if clusters
      .get(*i + 1)
      .is_some_and(|c| c.form == ClusterKey::Vowel)
      || next.form == ClusterKey::FullConsonant
    {
      break;
    }

    syllable.clusters.push(next.clone());
    *i += 1;
  }
}

/// Parse a talk word through all three stages.
pub fn chunk(text: &str) -> Result<Chunked, Error> {
  let marks = read_segments(text)?;
  let clusters = group_segments_into_clusters(&marks)?;
  let syllables = group_clusters_into_syllables(&clusters);

  Ok(Chunked {
    marks,
    syllables,
    clusters,
  })
}

/// The clusters of a talk word, without the syllable grouping.
pub fn cluster(text: &str) -> Result<Vec<Cluster>, Error> {
  Ok(chunk(text)?.clusters)
}
