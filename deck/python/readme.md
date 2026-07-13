# talk

A phonetic encoding. Convert between:

- **IPA**: the International Phonetic Alphabet (`tʰa`)
- **talk**: a plain-ASCII spelling of the same sounds (`th~a`)
- **simple**: a readable, human-facing rendering
- **token**: one Hangul code point per sound, for fixed-width machine
  use

Everything is derived from three data files and a double-array trie
scan. **Zero runtime dependencies.**

This is the Python port of
[`@cluesurf/talk`](https://github.com/cluesurf/talk). Both ports share
one source of truth for the phonetic data.

## Install

```bash
pip install cluesurf-talk
# or
uv add cluesurf-talk
```

## Use

```python
import talk

talk.ipa_to_talk("tʰa")    # "th~a"
talk.talk_to_ipa("th~a")   # "tʰa"
talk.readable("th~a")      # "tʰa"
talk.machine("th~a")       # one Hangul code point per sound

# Break a talk string into sounds with their features.
for sound in talk.segment("th~a"):
    print(sound.talk, sound.kind, sound.base and sound.base.talk,
          [m.feature for m in sound.modifiers])

# The full canonical inventory.
talk.enumerate_sounds()
```

## API

| Function                           | Description                                |
| ---------------------------------- | ------------------------------------------ |
| `ipa_to_talk(text)`                | IPA → talk                                 |
| `talk_to_ipa(text)`                | talk → IPA                                 |
| `readable(text)`                   | talk → simple readable form                |
| `machine(text)`                    | talk → one Hangul code point per sound     |
| `machine_outputs(text)`            | talk → list of per-sound code points       |
| `segment(text)` / `tokenize(text)` | talk → list of `Sound`                     |
| `enumerate_sounds()`               | the full canonical sound inventory         |
| `combine(base_talk, mods)`         | base + modifiers → canonical talk spelling |

## License

MIT

## ClueSurf

Part of the [ClueSurf](https://clue.surf) toolset.
