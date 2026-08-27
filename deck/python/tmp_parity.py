import json, sys, io
sys.path.insert(0, 'code')
from talk import ipa_to_talk
cases = json.load(io.open('../typescript/test/fixture/pronunciation-sample.json', encoding='utf-8'))
out = {}
for c in cases:
    try:
        out[c['ipa']] = ipa_to_talk(c['ipa'])
    except Exception as e:
        out[c['ipa']] = f'!ERR {e}'
io.open('tmp_parity.json','w',encoding='utf-8').write(json.dumps(out, ensure_ascii=False))
print(len(out), 'converted')
