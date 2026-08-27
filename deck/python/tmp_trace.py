import sys
sys.path.insert(0, 'code')
from talk.string.convert import parse_ipa
from talk.string.normalize import normalize_ipa
t = 'ˈ˷̩'
print('normalized codepoints:', [hex(ord(c)) for c in normalize_ipa(t)])
for u in parse_ipa(t):
    print(' role=', u.role, '| base=', u.base.talk if u.base else None,
          '| mods=', [m.talk for m in u.modifiers], '| pre=', [m.talk for m in u.pre])
