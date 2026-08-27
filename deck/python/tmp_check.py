import sys, io
sys.path.insert(0, 'code')
from talk import ipa_to_talk
print('python:', repr(ipa_to_talk('ˈ˷̩')))
