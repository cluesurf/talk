// Generate base/clusters.json: one Hangul code point per onset, coda,
// full-consonant, plain-consonant, and vowel cluster. Append-only, so an
// assigned code point never changes.
//
//   npx tsx code/make/clusters.ts
//
// The cluster definitions below are copied verbatim from the v1
// `cluster-definitions.ts`. Only the lodash `uniq` was replaced with the
// local one here so this file has no dependencies.

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Dedupe, keeping first occurrence (same behaviour as lodash `uniq`),
// so this file stays dependency-free.
function uniq<T>(items: T[]): T[] {
  return [...new Set(items)]
}

export const sortLength = (a: string, b: string) => {
  const diff = b.length - a.length

  if (!diff) {
    return a.localeCompare(b)
  }

  return diff
}

const noDuplicateSounds = (s: string) => {
  if (!s.trim()) {
    return false
  }

  let i = 0

  while (i < s.length) {
    const a = s[i++]
    const b = s[i]

    if (!b) {
      return true
    }

    if (a === b) {
      return false
    }
  }
}

const consonantSuffix = (suffix: string, colon = '') => `b${suffix}
c${colon}${suffix}
C${colon}${suffix}
d${colon}${suffix}
f${colon}${suffix}
g${colon}${suffix}
h${colon}${suffix}
j${colon}${suffix}
k${colon}${suffix}
l${colon}${suffix}
m${colon}${suffix}
n${colon}${suffix}
p${colon}${suffix}
q${colon}${suffix}
r${colon}${suffix}
s${colon}${suffix}
t${colon}${suffix}
v${colon}${suffix}
w${colon}${suffix}
x${colon}${suffix}
y${colon}${suffix}
z${colon}${suffix}
G${colon}${suffix}
Q${colon}${suffix}
B${colon}${suffix}
D${colon}${suffix}
F${colon}${suffix}
H${colon}${suffix}
J${colon}${suffix}
K${colon}${suffix}
L${colon}${suffix}
N${colon}${suffix}
R${colon}${suffix}
S${colon}${suffix}
T${colon}${suffix}
V${colon}${suffix}
X${colon}${suffix}
Z${colon}${suffix}
dj${colon}${suffix}
dx${colon}${suffix}
tx${colon}${suffix}`

const sStart = (prefix = 's') => `${prefix}br
${prefix}b:w
${prefix}b:y
${prefix}:d
${prefix}d:y
${prefix}d:w
${prefix}dj:r
${prefix}d:r
${prefix}f:r
${prefix}f:y
${prefix}f:w
${prefix}g:r
${prefix}g:w
${prefix}g:y
${prefix}:c
${prefix}c:w
${prefix}c:y
${prefix}:k
${prefix}k:l
${prefix}k:r
${prefix}k:w
${prefix}k:y
${prefix}:l
${prefix}l:w
${prefix}:m
${prefix}m:y
${prefix}m:w
${prefix}m:r
${prefix}m:l
${prefix}:n
${prefix}n:y
${prefix}n:w
${prefix}n:r
${prefix}:p
${prefix}p:l
${prefix}p:r
${prefix}p:w
${prefix}:t
${prefix}t:y
${prefix}t:w
${prefix}t:r
${prefix}tx:r
${prefix}t:x
${prefix}d:j
${prefix}D:J
${prefix}:w
${prefix}:j
`

export const startConsonants = uniq(
  `u$
'
dj:r
bl
bj
bz
bs
br
bw
by
cl
cr
cw
cy
Cl
Cr
Cw
Cy
dj
dl
dr
dw
dy
dz
fl
fr
fw
fy
fs
fv
fm
fn
fc
fC
gl
gr
gw
gy
gz
gs
gj
gC
h:r
h:l
h:w
h:y
h:m
h:n
jr
jl
jm
jn
kl
kr
kw
ky
kx
kc
kC
ks
mr
mw
ml
my
nr
nw
nl
ny
pl
pr
pw
py
pj
px
ps
pz
pc
pC
qr
q:l
qw
qy
tr
ts
tz
tz:w
tz:y
tw
tx
tj
vl
vr
vw
vy
wr
xw
xl
zl
zr
zw
zm
zn
zk
zg
zv
zb
zp
zt
zd
xp
xt
xr
xk
xb
xd
xg
jw
djz
txc
txs
st
str
sk
skr
skw
sp
spr
spl
spw
sl
sr
sn
snw
sm
smw
sw
${consonantSuffix('h')}
${consonantSuffix('y')}
${sStart('s')}
${sStart('z')}
${sStart('x')}
${sStart('j')}
`
    .trim()
    .split(/\n+/)
    .filter(noDuplicateSounds)
    .sort(sortLength),
)

const mEnd = (prefix: string) => `${prefix}bf
${prefix}b:F
${prefix}b:v
${prefix}b:V
${prefix}b:z
${prefix}b:Z
${prefix}b:s
${prefix}b:S
${prefix}b:x
${prefix}b:X
${prefix}b:j
${prefix}b:J
${prefix}b:c
${prefix}bc:t
${prefix}bc:T
${prefix}bc:k
${prefix}bc:K
${prefix}b:C
${prefix}bC:d
${prefix}bC:k
${prefix}bC:K
${prefix}:v
${prefix}:V
${prefix}:f
${prefix}:F
${prefix}:z
${prefix}:Z
${prefix}:s
${prefix}:S
${prefix}:x
${prefix}:X
${prefix}:j
${prefix}:J
${prefix}:c
${prefix}c:t
${prefix}c:T
${prefix}c:k
${prefix}c:K
${prefix}:C
${prefix}C:d
${prefix}C:D
${prefix}C:k
${prefix}C:K`

const bEnd = (prefix: string) => `${prefix}v
${prefix}:f
${prefix}:v
${prefix}:z
${prefix}:s
${prefix}:x
${prefix}:j
${prefix}:V
${prefix}:F
${prefix}:V
${prefix}:Z
${prefix}:S
${prefix}:X
${prefix}:J
${prefix}:c
${prefix}c:t
${prefix}c:k
${prefix}c:T
${prefix}c:K
${prefix}:C
${prefix}C:d
${prefix}C:k
${prefix}C:D
${prefix}C:K
${prefix}:'`

const gEnd = (prefix: string) => `${prefix}j
${prefix}:x
${prefix}j:d
${prefix}j:g
${prefix}j:k
${prefix}j:t
${prefix}x:k
${prefix}x:t
${prefix}:J
${prefix}:X
${prefix}J:D
${prefix}J:g
${prefix}J:k
${prefix}J:K
${prefix}J:T
${prefix}X:k
${prefix}X:K
${prefix}X:T
${prefix}:b
${prefix}:p
${prefix}:d
${prefix}:t
${prefix}:f
${prefix}:v
${prefix}:s
${prefix}:z
${prefix}:d
${prefix}:T
${prefix}:F
${prefix}:V
${prefix}:S
${prefix}:Z
${prefix}:H`

const kEnd = (prefix: string) => `${prefix}j
${prefix}:x
${prefix}x:k
${prefix}x:t
${prefix}:J
${prefix}:X
${prefix}X:k
${prefix}X:t
${prefix}X:K
${prefix}X:T
${prefix}x:K
${prefix}x:T
${prefix}:p
${prefix}:t
${prefix}:f
${prefix}:s
${prefix}:T
${prefix}:F
${prefix}:S
${prefix}:H
${prefix}:z
${prefix}:j`

const fEnd = (prefix: string) => `${prefix}x
${prefix}:s
${prefix}s:k
${prefix}s:t
${prefix}:k
${prefix}k:s
${prefix}k:x
${prefix}:t
${prefix}t:s
${prefix}t:x
${prefix}:p
${prefix}p:s
${prefix}p:x
${prefix}:c
${prefix}c:s
${prefix}c:x
${prefix}:'`

const vEnd = (prefix: string) => `${prefix}j
${prefix}:z
${prefix}:s
${prefix}:k
${prefix}k:s
${prefix}k:x
${prefix}:g
${prefix}g:z
${prefix}g:j
${prefix}:t
${prefix}t:s
${prefix}t:x
${prefix}:d
${prefix}d:s
${prefix}d:z
${prefix}:dj
${prefix}:p
${prefix}p:s
${prefix}:b
${prefix}b:z
${prefix}:c
${prefix}c:s
${prefix}c:x
${prefix}:C
${prefix}C:z
${prefix}C:j`

const glottalFull = (prefix = "'") => `${prefix}b
${prefix}c
${prefix}C
${prefix}d
${prefix}f
${prefix}g
${prefix}h
${prefix}j
${prefix}k
${prefix}l
${prefix}m
${prefix}n
${prefix}p
${prefix}q
${prefix}r
${prefix}s
${prefix}t
${prefix}v
${prefix}w
${prefix}x
${prefix}y
${prefix}z
${prefix}B
${prefix}D
${prefix}F
${prefix}H
${prefix}J
${prefix}K
${prefix}L
${prefix}N
${prefix}R
${prefix}S
${prefix}T
${prefix}V
${prefix}X
${prefix}Z
${prefix}dj
${prefix}dx
${prefix}tx`

export const consonants = `b
c
C
d
f
g
h
j
k
l
m
n
p
q
r
s
t
v
w
x
y
z
G
Q
B
D
F
H
J
K
L
N
R
S
T
V
X
Z
dj
dx
tx`
  .split(/\n+/)
  .sort(sortLength)

export const endConsonants = uniq(
  `y:g
w:g
y:k
w:k
t:s
t:z
y:d
w:d
y:t
w:t
y:b
w:b
y:p
w:p
y:z
y:s
w:z
w:s
y:j
y:x
w:j
w:x
y:C
y:c
w:r
w:C
w:c
w:l
tx:s
s:tx
xk:z
x:k

fs:t
vs:t
zs:t
z:t

t:l
t:r

${consonantSuffix('y', ':')}
${consonantSuffix('h', ':')}
${consonantSuffix('w', ':')}

${bEnd('b')}
${bEnd('p')}
${bEnd('rb')}
${bEnd('rp')}
${bEnd('lp')}
${bEnd('lb')}
${bEnd('v')}
${bEnd('lv')}
${bEnd('rv')}
${bEnd('f')}
${bEnd('lf')}
${bEnd('rf')}
${bEnd('ln')}
${bEnd('rm')}
${bEnd('lm')}

s:t
s:k
s:p

l:f
lfs:z
lf:s
lfs:t
lfs:k
lfs:z
lfs:p
lfs:b
lfs:d
lfs:g
f:s
fs:z

${mEnd('m')}
${mEnd('rm')}
r:m
${mEnd('n')}
${mEnd('rn')}
r:n
${mEnd('r')}
${mEnd('l')}
${mEnd('lm')}
l:m
${mEnd('ln')}
l:n

${gEnd('g')}
${gEnd('rg')}
r:g
${gEnd('lg')}
l:g

${kEnd('k')}
${kEnd('rk')}
${kEnd('lk')}

${kEnd('mk')}
m:k
${kEnd('nk')}
n:k
${kEnd('qk')}
q:k

${fEnd('f')}
${fEnd('rf')}
${fEnd('lf')}

${vEnd('v')}
${vEnd('rv')}
${vEnd('lv')}

b:b
c:c
C:C
d:d
f:f
g:g
j:j
k:k
l:l
d:dj
dj:dj
m:m
n:n
p:p
q:q
r:r
s:s
t:t
v:v
w:w
x:x
yy
z:z
D:D
F:F
G:G
J:J
K:K
L:L
D:DJ
DJ:DJ
N:N
Q:Q
R:R
S:S
T:T
V:V
W:W
X:X
Y:Y
Z:Z
c:c
C:C
d:d
f:f
g:g
h:h
j:j
k:k
l:l
m:m
n:n
p:p
q:q
r:r
s:s
t:t
v:v
w:w
x:x
y:y
z:z
G:G
Q:Q
B:B
D:D
F:F
H:H
J:J
K:K
L:L
N:N
R:R
S:S
T:T
V:V
X:X
Z:Z

l:kt
l:tx
l:txc
l:txs
l:dj
l:djz
l:t
l:p
l:z
l:s
ls:t
ls:p
ls:f
ls:c
lz:v
m:f
mf:t
m:H
mj:k
mj:t
rm:j
rm:s
rm:x
rn:j
rn:s
rn:x
m:p
mp:f
mpf:t
mp:f
mp:H
mp:k
mp:s
mp:sk
mp:st
mp:t
m:s
ms:k
ms:t
m:t
m:v
mv:t
mx:k
mx:t
m:z
mz:k
mz:t
n:d
nd:k
nd:p
nd:t
ng:d
ng:st
n:sk
n:st
n:t
n:z
nz:d
rm:p
rn:t
sj
sj:d
sn:j
sn:d
nj:d
nj:t
n:j
mj:d
mj:t
m:j
n:xt
n:x
m:xt
sn:t
l:b
l:d
l:g
l:f
l:m
l:n
l:p
l:s
l:v
m:s
m:v
m:x
m:z
r:b
r:f
s:j
`
    .trim()
    .split(/\n+/)
    .filter(noDuplicateSounds)
    .sort(sortLength),
)

export const fullConsonants = uniq(
  `'l:s
'l:p
'l:z
'l:n
'l:m
'l:t
'l:d
'l:dj
'l:x
'l:c
'l:C
'l:v
'l:f
'l

${glottalFull("'")}
txm
txn
txq
spldj
sprdj
sprdjd
spldjd
spldjt
spltxt
spltxp
brn
brq
brm
prn
prq
prm
krn
krq
krm
trn
trq
trm
brv
brvz
brvzd
brvzt
brvs
brvc
brvC
brvsts
brvst
brvsk
prv
prvz
prvzd
prvzt
prvs
prvt
prvc
prvC
prvsts
prvst
prvsks
prvsk
'r
'l
'w
'y
`
    .trim()
    .split(/\n+/)
    .filter(noDuplicateSounds)
    .sort(sortLength),
)

// The list below includes the falling-diphthong spellings ending in the
// carrier vowels I / O / U (aO oO OI aU oU eU IU uU joined 2026-08-08):
// eI was always one cluster while oU and aU split into two, so "brown"
// and "program" chunked their nucleus as two vowels, and the
// syllabifier then placed the offglide in the NEXT syllable
// (pr.r.o | U.gr). One inventory entry fixes both.
export const vowels = uniq(
  `u$i
u$e
u$a
u$o
u$u
u$I
u$E
u$A
u$O
u$U
iu$
eu$
au$
ou$
uu$
Iu$
Eu$
Au$
Ou$
Uu$
i
e
a
o
u
I
E
A
O
U
i$
e$
a$
o$
u$
o$u
o$i
o$a
ai
au
ei
oi
ou
iu
ui
Ii
Ei
Ee
Eo
Eu
Ai
Ae
Aa
Ao
Au
OU
Oa
Oe
Oi
UE
Ua
ae
ao
oa
io
ua
uo
ea
eo
oe
e$i
Iu
Ui
AI
aI
eI
aO
oO
OI
aU
oU
eU
IU
uU`
    .trim()
    .split(/\n+/)
    .filter(noDuplicateSounds)
    .sort(sortLength),
)

// ─── build base/clusters/ ────────────────────────────────────────────
//
// The five category files list the cluster definitions as { talk } only.
// A cluster may contain a `:`, which splits a coda (the part before) from
// an onset (the part after). Word-final it can instead be one unit with
// the colon removed. So the atomic pieces of a cluster are each colon-split
// part, plus the whole with the colon removed. Those unique pieces are
// collected into clusters/index.json and given one Chinese character each
// (the token). Append-only: a piece keeps its token once assigned.

type Piece = { talk: string; token: string }
type Cluster = { talk: string }

const HERE = dirname(fileURLToPath(import.meta.url))
const DIR = resolve(HERE, '../../../../base/clusters')
const INDEX = resolve(DIR, 'index.json')

// The Chinese character set to draw tokens from, at the repository root.
const CHINESE = resolve(
  HERE,
  '../../../../base/symbol/chinese/common/combined.csv',
)

// file (relative to DIR) -> the defined cluster list
const SOURCES: [string, string[]][] = [
  ['consonants/index.json', consonants],
  ['consonants/start.json', startConsonants],
  ['consonants/end.json', endConsonants],
  ['consonants/full.json', fullConsonants],
  ['vowels/index.json', vowels],
]

// The atomic pieces of a cluster: each colon-split part, plus the whole
// with the colons removed.
function piecesOf(cluster: string): string[] {
  const parts = cluster.split(':')

  return [...parts, parts.join('')]
}

// The `character` column of combined.csv, in file order.
function chineseCharacters(): string[] {
  const text = readFileSync(CHINESE, 'utf8').trim()

  return text
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.split(',')[2])
    .filter(Boolean)
}

function build(): void {
  // Every unique piece across every cluster.
  const pieces = new Set<string>()

  for (const [, items] of SOURCES) {
    for (const cluster of items) {
      for (const piece of piecesOf(cluster)) {
        pieces.add(piece)
      }
    }
  }

  // Keep existing tokens (append-only) and mark them used.
  const existing: Piece[] = existsSync(INDEX)
    ? (JSON.parse(readFileSync(INDEX, 'utf8')) as Piece[])
    : []
  const tokenOf = new Map(existing.map(e => [e.talk, e.token]))
  const used = new Set(existing.map(e => e.token))

  // Draw the next unused Chinese character for each new piece.
  const chinese = chineseCharacters()

  let cursor = 0

  const nextToken = (): string => {
    while (cursor < chinese.length && used.has(chinese[cursor])) {
      cursor++
    }

    if (cursor >= chinese.length) {
      throw new Error('ran out of Chinese characters')
    }

    const token = chinese[cursor++]

    used.add(token)

    return token
  }

  let added = 0

  for (const piece of [...pieces].sort(sortLength)) {
    if (!tokenOf.has(piece)) {
      tokenOf.set(piece, nextToken())
      added++
    }
  }

  const indexOut: Piece[] = [...pieces]
    .sort(sortLength)
    .map(talk => ({ talk, token: tokenOf.get(talk)! }))

  mkdirSync(DIR, { recursive: true })
  writeFileSync(INDEX, JSON.stringify(indexOut, null, 2) + '\n')

  // The category files: cluster definitions only, no token.
  for (const [rel, items] of SOURCES) {
    const out: Cluster[] = [...items]
      .sort(sortLength)
      .map(talk => ({ talk }))
    const file = resolve(DIR, rel)

    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(out, null, 2) + '\n')
    console.log(`  ${rel}: ${out.length}`)
  }

  console.log(`[clusters] wrote ${DIR}`)
  console.log(
    `  index pieces: ${indexOut.length} (newly added ${added})`,
  )
}

build()
