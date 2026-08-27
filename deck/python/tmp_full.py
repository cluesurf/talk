import json, io, sys
sys.path.insert(0, 'code')
from talk import syllables

path = '../typescript/tmp/parity-full.json'
cases = json.load(io.open(path, encoding='utf-8'))['syllables']
ok = skipped = bad = 0
examples = []

for case in cases:
    if case.get('lossy') or not case.get('ok', True):
        skipped += 1
        continue
    want = [[f"{c['form']}:{c['text']}" for c in s['clusters']] for s in case.get('syllables', [])]
    try:
        r = syllables(case['input'])
        got = [[f"{c.form.value}:{c.text}" for c in s.clusters] for s in r.syllables]
    except Exception as e:
        bad += 1
        if len(examples) < 5: examples.append(f"{case['input']!r}: raised {e}")
        continue
    if got == want:
        ok += 1
    else:
        bad += 1
        if len(examples) < 5: examples.append(f"{case['input']!r}: got {got} want {want}")

print(f'total={len(cases)} ok={ok} differ={bad} skipped={skipped}')
for e in examples: print(' ', e)
