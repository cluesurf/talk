import { m } from '~/make/constants'

// TODO: this only works for tune lang so far.
export default function make(text: string) {
  const parts = [...text]
  const out: string[] = []
  let i = 0
  while (i < parts.length) {
    const part = parts[i++]
    const next = parts[i]
    switch (part) {
      case '-':
        if (next === '-') {
          i++
          out.push('˩')
        } else {
          out.push('˨')
        }
        break
      case '+':
        if (next === '+') {
          i++
          out.push('˥')
        } else {
          out.push('˦')
        }
        break
      case '/':
        if (next === '/') {
          i++
          out.push('˩˥')
        } else if (next === '\\') {
          i++
          out.push('˩˥˩')
        } else {
          out.push('˧˥')
        }
        break
      case '\\':
        if (next === '\\') {
          i++
          out.push('˥˩')
        } else if (next === '/') {
          i++
          out.push('˥˩˥')
        } else {
          out.push('˥˧')
        }
        break
      case '^':
        out[out.length - 1] = `ˈ${out[out.length - 1]}`
        break
      case '&':
        out[out.length - 1] = `${out[out.length - 1]}${m.d.tilde}`
        break
      case '!': {
        const last = out[out.length - 1]
        if (last === 'h') {
          out.pop()
          out[out.length - 1] = `${out[out.length - 1]}${m.d.ring}`
        } else {
          out.push('ʼ')
        }
        break
      }
      case 'a':
        if (next === '$') {
          i++
          out.push('œ')
        } else {
          out.push('a')
        }
        captureAllTones()
        break
      case 'A':
        out.push('æ')
        captureAllTones()
        break
      case 'b':
        if (next === '?') {
          i++
          out.push('ɓ')
        } else {
          out.push('b')
        }
        break
      case 'c':
        out.push('θ')
        break
      case 'C':
        if (next === '~') {
          i++
          // TODO: better handle this?
          out.push('ð')
        } else {
          out.push('ð')
        }
        break
      case 'd':
        if (next === '?') {
          i++
          // TODO: better handle this?
          out.push('ɗ')
        } else if (next === '*') {
          i++
          out.push('ǂ')
        } else {
          out.push('d')
        }
        break
      case 'D':
        out.push('ɖ')
        break
      case '.': // stop
        out.push('̚')
        break
      case '~': // stop
        out.push('\u032A')
        break
      case '@': // tense
        out.push('͈')
        break
      case 'L':
        out.push('ɭ')
        break
      case 'J':
        out.push('ʐ')
        break
      case 'G':
        if (next === '~') {
          i++
          out[out.length - 1] = `${out[out.length - 1]}ˠ`
        } else {
          out.push('ʁ')
        }
        break
      case "'":
        out.push('ʔ')
        break
      case 'X':
        out.push('ʂ')
        break
      case 'T':
        out.push('ʈ')
        break
      case 'V':
        out.push('ʋ')
        break
      case 'N':
        out.push('ɳ')
        break
      case 'Q':
        if (next === '~') {
          i++
          out[out.length - 1] = `${out[out.length - 1]}ˤ`
        } else {
          out.push('ʕ')
        }
        break
      case 'S':
        out.push('ɬ')
        break
      case 'E':
        out.push('ɛ')
        captureAllTones()
        break
      case 'e':
        if (next === '$') {
          i++
          out.push('ø')
        } else {
          out.push('e')
        }
        captureAllTones()
        break
      case 'f':
        out.push('f')
        break
      case 'g':
        if (next === '?') {
          i++
          out.push(`ɠ`)
        } else {
          out.push('g')
        }
        break
      case 'h':
        if (next === '~') {
          i++
          out.push(`ʰ`)
        } else {
          out.push('h')
        }
        break
      case 'H':
        out.push('χ')
        break
      case 'I':
        out.push('ɪ')
        captureAllTones()
        break
      case 'i':
        if (next === '$') {
          i++
          out.push('ɨ')
        } else {
          out.push('i')
        }
        captureAllTones()
        break
      case 'j':
        out.push('ʒ')
        break
      case 'k':
        if (next === '*') {
          i++
          out.push('ǃ')
        } else {
          out.push('k')
        }
        break
      case 'K':
        out.push('q')
        break
      case 'l':
        if (next === '*') {
          i++
          out.push('ǁ')
        } else {
          out.push('l')
        }
        break
      case 'm':
        out.push('m')
        break
      case 'n':
        out.push('n')
        break
      case 'O':
        out.push('ʊ')
        captureAllTones()
        break
      case 'o':
        if (next === '$') {
          i++
          out.push('ɔ')
        } else {
          out.push('o')
        }
        captureAllTones()
        break
      case 'p':
        if (next === '*') {
          i++
          out.push('ʘ')
        } else {
          out.push('p')
        }
        break
      case 'F':
        out.push('ɸ')
        break
      case 'W':
        out.push('ɰ')
        break
      case 'Z':
        out.push('ɮ')
        break
      case 'q':
        out.push('ŋ')
        break
      case 'r':
        out.push('r')
        break
      case 'R':
        out.push('ɽ')
        break
      case 's':
        out.push('s')
        break
      case 't':
        if (next === '*') {
          i++
          out.push('ǀ')
        } else {
          out.push('t')
        }
        break
      case 'U':
        out.push('ə')
        captureAllTones()
        break
      case 'u':
        if (next === '$') {
          i++
          out.push('ɹ')
        } else {
          out.push('u')
        }
        captureAllTones()
        break
      case 'v':
        out.push('v')
        break
      case 'w':
        if (next === '~') {
          i++
          out.push(`ʷ`)
        } else {
          out.push('w')
        }
        break
      case 'x':
        out.push('ʃ')
        break
      case 'y':
        if (next === '~') {
          i++
          out.push(`ʲ`)
        } else {
          out.push('j')
        }
        break
      case 'z':
        out.push('z')
        break
      case '_':
        out.push('ː')
        break
      default:
        throw new Error(`Error with part: ${part}`)
    }

    function captureAllTones() {
      let next = parts[i]
      if (next?.startsWith('&')) {
        out[out.length - 1] = `${out[out.length - 1]}${m.d.tilde}`
        i++
        next = parts[i]
      }

      if (next?.startsWith('-')) {
        ;/^(\-+)/.exec(text.slice(i))
        const size = RegExp.$1.length
        i += size

        if (size === 1) {
          out.push('˨')
        } else {
          out.push('˩')
        }
      } else if (next?.startsWith('+')) {
        ;/^(\++)/.exec(text.slice(i))
        const size = RegExp.$1.length
        i += size

        if (size === 1) {
          out.push('˦')
        } else {
          out.push('˥')
        }
      }
    }
  }
  return out.join('')
}
