import sys; sys.path.insert(0, 'code')
from talk import syllables
r = syllables("aiyu$'aK")
print('PY  ', [[f"{c.form}:{c.text}" for c in s.clusters] for s in r.syllables])
