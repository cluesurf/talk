//! Talk to sounds.

use crate::space::codec::code_of;
use crate::space::model::{Notation, Tier};
use crate::string::combine::combine;
use crate::string::runtime::{modifier_attaches, pick_modifier, runtime};
use crate::string::types::{NO_CODE, Form, Kind, Modifier, Phone, Sound, SymbolEntry, Unit};

pub fn make_sound(
  base: &'static Phone,
  mods: Vec<&'static Modifier>,
  pre: Vec<&'static Modifier>,
) -> Sound {
  let talk = combine(&base.talk, &mods, &pre);

  let mut ordered = mods;

  ordered.sort_by_key(|modifier| modifier.order);

  let mut leading = pre;

  leading.sort_by_key(|modifier| std::cmp::Reverse(modifier.order));

  let lead = |of: fn(&Modifier) -> &str| -> String {
    leading.iter().map(|modifier| of(modifier)).collect()
  };

  let spell = |pick: fn(&Modifier) -> bool, of: fn(&Modifier) -> &str| -> String {
    ordered
      .iter()
      .filter(|modifier| pick(modifier))
      .map(|modifier| of(modifier))
      .collect()
  };

  let is_prefix: fn(&Modifier) -> bool = |modifier| modifier.prefix;
  let is_suffix: fn(&Modifier) -> bool = |modifier| !modifier.prefix;

  let ipa = format!(
    "{}{}{}{}",
    lead(|m| &m.ipa),
    spell(is_prefix, |m| &m.ipa),
    base.ipa,
    spell(is_suffix, |m| &m.ipa)
  );

  let simple = format!(
    "{}{}{}{}",
    lead(|m| &m.simple),
    spell(is_prefix, |m| &m.simple),
    base.simple,
    spell(is_suffix, |m| &m.simple)
  );

  Sound {
    machine: code_of(base, &ordered, TONE, MESH),
    talk,
    ipa,
    simple,
    kind: base.form.into(),
    base: Some(base),
    modifiers: ordered,
    pre: leading,
    raw: false,
  }
}

fn raw_sound(entry: &SymbolEntry) -> Sound {
  Sound {
    talk: entry.talk.clone(),
    ipa: entry.ipa.clone(),
    simple: entry.simple.clone(),
    // A passthrough symbol is not a sound, so it has no code.
    machine: NO_CODE,
    kind: Kind::Symbol,
    base: None,
    modifiers: Vec::new(),
    pre: Vec::new(),
    raw: true,
  }
}

/// `machine()` reports the tone notation at full detail, which is what the
/// flat code always meant.
const TONE: Notation = Notation::Tone;
const MESH: Tier = Tier::Mesh;

/// The modifiers inside one pair of brackets, or `None` when the contents are
/// not a clean run of them.
///
/// ORDER IS FREE ON THE WAY IN. `combine` writes the canonical order, so a
/// stored sound has one spelling, but a person typing `k<hw>` and a person
/// typing `k<wh>` mean the same thing and both should parse.
///
/// `base` is the phone the run FOLLOWS, and is given only in that position. A
/// run written after a base is claiming those marks belong to it, and a mark
/// whose `attaches` rule rules that out means the claim is wrong: the run is
/// really the leading run of whatever comes next.
///
/// LOOSE IS THE LAST READING BEFORE GIVING UP. The encoder writes marks that
/// have no reading for their base's form: `iʲ` comes back as `i<y^>` and
/// palatalization is spelled for a consonant. Refusing left the bracket to
/// leak out one raw character at a time, which is strictly worse than reading
/// it as what it plainly says.
fn read_run(
  run: &str,
  form: Form,
  base: Option<&'static Phone>,
  loose: bool,
) -> Option<Vec<&'static Modifier>> {
  if run.is_empty() {
    return None;
  }

  let state = runtime();
  let mut out: Vec<&'static Modifier> = Vec::new();
  let mut at = 0;

  while at < run.len() {
    let (options, length) = state.talk_modifier.match_at(run, at)?;

    let one = match pick_modifier(options, form) {
      Some(one) => Some(one),
      None if loose => options.first().copied(),
      None => None,
    }?;

    if let Some(phone) = base {
      if !modifier_attaches(phone, one) {
        return None;
      }
    }

    out.push(one);
    at += length;
  }

  if out.is_empty() { None } else { Some(out) }
}

/// The body and end of a bracketed modifier run starting at `at`.
///
/// A SCAN, NOT A SEARCH. Searching for the next `>` finds a closing bracket
/// anywhere ahead, so a stray `<` with its match far downstream would swallow
/// every sound between them. Walking forward stops at the first character that
/// cannot be inside a run, so an unclosed `<` fails here and is carried through
/// as an ordinary character.
///
/// Runs do not nest. A `<` inside one is malformed, not a sub-run.
fn run_span(text: &str, at: usize) -> Option<(String, usize)> {
  if text.as_bytes().get(at) != Some(&b'<') {
    return None;
  }

  let mut index = at + 1;

  while index < text.len() {
    match text.as_bytes()[index] {
      b'>' => {
        return if index == at + 1 {
          None
        } else {
          Some((text[at + 1..index].to_string(), index + 1))
        };
      }
      b'<' => return None,
      _ => index += 1,
    }
  }

  None
}

/// How many sounds a binder joins, or `None` when the run is not a binder.
///
/// WHY IT COUNTS BACKWARD. A tie in IPA sits BETWEEN the letters it joins, so
/// `t͡ʃ` says nothing about how far the binding reaches. Naming the count
/// instead makes a doubly-articulated `k͡p` and a three-part cluster equally
/// sayable, and puts the binder after its material.
fn binder_reach(run: &str) -> Option<usize> {
  let (_, rest) = binder_split(run)?;

  let reach = if rest.is_empty() {
    2
  } else {
    rest.parse::<usize>().ok()?
  };

  if reach >= 2 { Some(reach) } else { None }
}

/// A binder run split into the marks before its `B` and the count after it.
///
/// `tx<B>` is a bare affricate and `ts<hB>` an aspirated one, where the `h`
/// belongs to the whole group. The binder is written last because it acts on
/// everything before it.
fn binder_split(run: &str) -> Option<(&str, &str)> {
  let at = run.rfind('B')?;
  let count = &run[at + 1..];

  if !count.chars().all(|one| one.is_ascii_digit()) {
    return None;
  }

  Some((&run[..at], count))
}

/// The marks a binder run carries before its `B`.
fn binder_marks(run: &str) -> &str {
  binder_split(run).map(|(marks, _)| marks).unwrap_or("")
}

/// Several sounds joined into one, as a tie does.
///
/// THE TIE BINDS THE BASES AND THE MARKS HOIST OUT. `t<h>x<B>` is an aspirated
/// affricate and comes back `t͡ʃʰ`, not `tʰ͡ʃ`. A tie says two LETTERS are one
/// segment, so a mark between them breaks the thing it is asserting.
fn bind_sounds(parts: &[Sound]) -> Sound {
  let talk: String = parts.iter().map(|one| one.talk.as_str()).collect();
  let simple: String = parts.iter().map(|one| one.simple.as_str()).collect();

  let bases: Vec<String> = parts
    .iter()
    .map(|one| match one.base {
      Some(base) => base.ipa.clone(),
      None => one.ipa.clone(),
    })
    .collect();

  let marks: String = parts
    .iter()
    .flat_map(|one| one.modifiers.iter().map(|mark| mark.ipa.as_str()))
    .collect();

  let pre: String = parts
    .iter()
    .flat_map(|one| one.pre.iter().map(|mark| mark.ipa.as_str()))
    .collect();

  let ipa = format!("{}{}{}", pre, bases.join("\u{0361}"), marks);
  let count = if parts.len() > 2 {
    parts.len().to_string()
  } else {
    String::new()
  };

  // ONE PAIR OF BRACKETS PER BASE, the same rule the modifiers follow. The
  // binder used to open its own pair, so an aspirated affricate came back
  // `ts<h><B>` with two runs on one sound. It joins the run that is already
  // there instead: `ts<hB>`.
  let bound = if talk.ends_with('>') {
    format!("{}B{count}>", &talk[..talk.len() - 1])
  } else {
    format!("{talk}<B{count}>")
  };

  raw_sound(&SymbolEntry {
    talk: bound,
    ipa,
    simple,
  })
}

/// Split a talk string into sounds. A single starter lookup gives the base (or
/// a symbol); a base then swallows the modifiers that follow it, and the sound
/// is re-emitted in canonical order.
pub fn segment(text: &str) -> Vec<Sound> {
  let state = runtime();
  let mut sounds = Vec::new();
  // Modifiers seen before a base, which modify what FOLLOWS: `h~k` is
  // pre-aspirated, `n~d` prenasalized.
  let mut leading: Vec<&'static Modifier> = Vec::new();

  let mut i = 0;

  while i < text.len() {
    let start_length = state
      .talk_starter
      .match_at(text, i)
      .map(|(_, length)| length)
      .unwrap_or(0);

    // A BRACKETED RUN BEFORE A BASE is the pre-modifiers, `<h>k` for
    // pre-aspirated. Read whole, so the scan below never sees a bracket.
    if start_length == 0 {
      if let Some((body, end)) = run_span(text, i) {
        // A BINDER TIES WHAT CAME BEFORE IT, so it is read here rather than
        // as a modifier on a following base: `tx<B>` is one affricate, and
        // there is no base after the bracket to carry it.
        if let Some(reach) = binder_reach(&body) {
          if sounds.len() >= reach {
            let held: Vec<Sound> = sounds.split_off(sounds.len() - reach);

            sounds.push(bind_sounds(&held));
            i = end;
            continue;
          }
        }

        if let Some((Unit::Phone(next), _)) = state.talk_starter.match_at(text, end)
        {
          let held = read_run(&body, next.form, None, false)
            .or_else(|| read_run(&body, next.form, None, true));

          if let Some(held) = held {
            leading.extend(held);
            i = end;
            continue;
          }
        }
      }
    }

    let Some((&start, length)) = state.talk_starter.match_at(text, i) else {
      // Unknown character: carry it through so nothing is silently
      // dropped.
      let character = text[i..].chars().next().expect("in-bounds character");

      i += character.len_utf8();

      let character = character.to_string();

      sounds.push(raw_sound(&SymbolEntry {
        talk: character.clone(),
        ipa: character.clone(),
        simple: character,
      }));

      continue;
    };

    i += length;

    match start {
      Unit::Phone(phone) => {
        // A BINDER SHARING THE RUN. `ts<hB>` is an aspirated affricate: the
        // marks belong to the base they follow and the `B` ties it to what
        // came before. `bind_sounds` hoists the marks onto the group, so
        // reading them here and binding after gives the same sound.
        if let Some((body, end)) = run_span(text, i) {
          if let Some(reach) = binder_reach(&body) {
            let marks = binder_marks(&body);
            let held = if marks.is_empty() {
              Some(Vec::new())
            } else {
              read_run(marks, phone.form, None, false)
                .or_else(|| read_run(marks, phone.form, None, true))
            };

            if let Some(held) = held {
              sounds.push(make_sound(phone, held, std::mem::take(&mut leading)));

              if sounds.len() >= reach {
                let parts: Vec<Sound> = sounds.split_off(sounds.len() - reach);

                sounds.push(bind_sounds(&parts));
              }

              i = end;
              continue;
            }
          }
        }

        // A BRACKETED RUN AFTER A BASE carries every modifier on it, in one
        // pair. `k<wh>` is labialized and aspirated. The contents are
        // uniquely decodable, so no separator is needed inside.
        if let Some((body, end)) = run_span(text, i) {
          // WHOSE MARK IS IT. A run after a base usually belongs to it, and
          // `attaches` settles the cases where it might not. But the rule
          // alone is too strong: the encoder spells b̥ as `b<v->` and kǃʰ as
          // `k!<h>`, and neither mark attaches to those bases by rule, so
          // refusing outright meant the tokenizer could not read back what
          // its own encoder writes and the brackets spilled out as raw
          // characters.
          //
          // A mark is only handed on when there is somewhere for it to GO:
          // the next sound has to be a phone that accepts the whole run.
          let fits = read_run(&body, phone.form, Some(phone), false);
          let held = fits.clone().or_else(|| {
            read_run(&body, phone.form, None, false)
              .or_else(|| read_run(&body, phone.form, None, true))
          });

          let hand_on = if held.is_some() && fits.is_none() {
            matches!(
              state.talk_starter.match_at(text, end),
              Some((Unit::Phone(next), _))
                if read_run(&body, next.form, Some(next), false).is_some()
            )
          } else {
            false
          };

          if let Some(held) = held {
            if !hand_on {
              sounds.push(make_sound(phone, held, std::mem::take(&mut leading)));
              i = end;
              continue;
            }
          }
        }

        let mods = Vec::new();

        sounds.push(make_sound(phone, mods, std::mem::take(&mut leading)));
      }
      Unit::Symbol(symbol) => sounds.push(raw_sound(symbol)),
      // The starter trie only holds phones and symbols.
      Unit::Modifier(_) => {}
    }
  }

  // A pre-modifier with nothing after it modifies nothing. Carry the
  // spelling through rather than dropping it, so a caller sees the input
  // was incomplete instead of losing it.
  for modifier in leading {
    sounds.push(raw_sound(&SymbolEntry {
      talk: modifier.talk.clone(),
      ipa: modifier.ipa.clone(),
      simple: modifier.simple.clone(),
    }));
  }

  sounds
}
