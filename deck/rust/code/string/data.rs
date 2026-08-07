//! The committed data, typed. This is the only place the JSON is loaded.

use std::sync::OnceLock;

use crate::string::types::{Modifier, Phone};

macro_rules! dataset {
  ($name:ident, $item:ty, $file:literal) => {
    pub fn $name() -> &'static [$item] {
      static CELL: OnceLock<Vec<$item>> = OnceLock::new();

      CELL.get_or_init(|| {
        serde_json::from_str(include_str!(concat!("../../base/", $file)))
          .unwrap_or_else(|error| panic!("base/{} is malformed: {error}", $file))
      })
    }
  };
}

dataset!(phones, Phone, "phones.json");
dataset!(modifiers, Modifier, "modifiers.json");
