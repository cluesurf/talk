//! The cluster whitelists, loaded from base/clusters/. The category files list
//! the cluster definitions; base/clusters/index.json holds one Chinese token
//! per atomic piece (each colon-split part and the colon-removed whole). A
//! cluster's code is the token of its whole (colon-removed) form.

use std::collections::HashMap;
use std::sync::OnceLock;

use serde::Deserialize;

#[derive(Deserialize)]
struct ClusterRecord {
  talk: String,
}

#[derive(Deserialize)]
struct PieceRecord {
  talk: String,
  token: String,
}

/// One category: the cluster spellings in declaration order, and the code each
/// one carries.
pub struct Category {
  pub talk: Vec<String>,
  pub code: HashMap<String, String>,
}

pub struct Clusters {
  pub consonants: Category,
  pub start_consonants: Category,
  pub end_consonants: Category,
  pub full_consonants: Category,
  pub vowels: Category,
}

pub fn clusters() -> &'static Clusters {
  static CELL: OnceLock<Clusters> = OnceLock::new();

  CELL.get_or_init(|| {
    let pieces: Vec<PieceRecord> = load(include_str!("../../base/clusters/index.json"));
    let token_of: HashMap<&str, &str> = pieces
      .iter()
      .map(|piece| (piece.talk.as_str(), piece.token.as_str()))
      .collect();

    let category = |raw: &str| -> Category {
      let list: Vec<ClusterRecord> = load(raw);
      let mut talk = Vec::new();
      let mut code = HashMap::new();

      for record in list {
        let whole = record.talk.replace(':', "");
        let token = token_of.get(whole.as_str()).copied().unwrap_or("");

        if code
          .insert(record.talk.clone(), token.to_string())
          .is_none()
        {
          talk.push(record.talk);
        }
      }

      Category { talk, code }
    };

    Clusters {
      consonants: category(include_str!("../../base/clusters/consonants/index.json")),
      start_consonants: category(include_str!("../../base/clusters/consonants/start.json")),
      end_consonants: category(include_str!("../../base/clusters/consonants/end.json")),
      full_consonants: category(include_str!("../../base/clusters/consonants/full.json")),
      vowels: category(include_str!("../../base/clusters/vowels/index.json")),
    }
  })
}

fn load<T: serde::de::DeserializeOwned>(raw: &str) -> Vec<T> {
  serde_json::from_str(raw).expect("cluster data is malformed")
}
