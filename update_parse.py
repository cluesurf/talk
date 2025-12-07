import re

# Expected outputs based on the logs
expected = {
    "ayu$ve^ydU": "a - yu$ - ve^y - dU",
    "kUba^llU": "kU - ba^l - lU",
    "fOla^sOfi": "fO - la^ - sO - fi",
    "fOla^sOfirmja": "fO - la^ - sO - firm - ja",
    "'lKadami": "'l - Ka - da - mi",
    "'ldjaryu": "'l - djar - yu",
    "'lttazalludju": "'l - t - ta - zal - lu - dju",
    "'l'alw'hh~i": "'l - 'alw - 'hh~ - i",
    "sUfI^stUkeItEdanjdxwa": "sU - fI^s - tU - keI - tE - danjd - xwa",
    "AmplIfaydrai": "Amp - lI - fayd - rai",
    "briqketzwaqlOmptzwa": "briq - ketz - wa - qlOmpt - zwa",
    "A&_^mplIfaydzoltxahasntayCwa": "A&_^mp - lI - fayd - zol - txa - hasn - tayC - wa",
    "'lddarr'dj'ti": "'l - d - darr - 'dj - 't - i",
    "'lK'Qida_ti": "'l - K - 'Qi - da_ - ti",
    "'lGu_lfu": "'l - Gu_l - fu",
    "galf'u": "galf - 'u",
    "galf'u'": "galf - 'u'",
    "galf'u'l": "galf - 'u - 'l",
    "gaialfsz": "gai - alfsz",
    "gaiaoilfst": "gai - ao - ilfst",
    "greIdAotxs": "greI - dAotxs",
    "prvst": "prvst",
    "'uHtQ~ubu_tQ~": "'uH - tQ~u - bu_tQ~",
    "kahru_dQ~aw'iyy": "ka - hru_ - dQ~aw - 'iyy",
    "kahru_manziliyy": "ka - hru_ - man - zi - liyy",
    "ladjdja": "ladj - dja",
    "ko_nsarva_tuwa_r": "ko_n - sar - va_ - tu - wa_r",
    "marciya": "mar - ci - ya",
    "masQ~sQ~a_sQ~": "masQ~ - sQ~a_sQ~",
    "mudjrim": "mu - djrim",
    "maHh~alliyy": "ma - Hh~al - liyy",
    "kIt~a_^b": "kI - t~a_^b",
    "KusQ~rumill": "Ku - sQ~ru - mill",
    "KasQ~riyya": "Ka - sQ~riy - ya",
    "KantQ~u_r": "Kan - tQ~u_r",
    "Qidjrim": "Qi - djrim",
    "mawrid": "maw - rid",
    "'lssamaka_tu 'lbuhh~ayri_a_tu": "'l - s - sa - ma - ka_ - tu - 'l - bu - hh~ay - ri_ - a_ - tu",
    "'lliK'hh~u": "'l - liK - 'hh~ - u",
    "'lQi_'da_tu": "'l - Qi_ - 'd - a_ - tu",
    "u$U^nIq": "u$U^ - nIq",
    "bu$U^nIq": "bu$U^ - nIq",
    "bou$U^nIq": "bou$ - U^ - nIq",
    "sa^kOu$": "sa^ - kOu$",
    "xakiu$U": "xa - kiu$ - U",
    "ske^ytbou$dIq": "ske^yt - bou$ - dIq",
    "paieia": "pai - ei - a",
    "txhaqkz": "txhaqkz",
    "djrawl": "djrawl",
    "twstxqkzlnkmplzstk": "twstx - qkz - ln - kmp - lz - stk"
}

with open('test.ts', 'r') as f:
    content = f.read()

# First handle the array joins
content = re.sub(r"parse\(\['ka', 'hru_', 'dQ~a', \"w'\", 'i', 'yy'\]\.join\(''\)\)", 
                 "parse(['ka', 'hru_', 'dQ~a', \"w'\", 'i', 'yy'].join(''), 'ka - hru_ - dQ~aw - \\'iyy')", content)
content = re.sub(r"parse\(\['ka', 'hru_', 'manz', 'i', 'li', 'yy'\]\.join\(''\)\)",
                 "parse(['ka', 'hru_', 'manz', 'i', 'li', 'yy'].join(''), 'ka - hru_ - man - zi - liyy')", content)
content = re.sub(r"parse\(\['la', 'djd', 'ja'\]\.join\(''\)\)",
                 "parse(['la', 'djd', 'ja'].join(''), 'ladj - dja')", content)
content = re.sub(r"parse\(\['ko_ns', 'arv', 'a_', 'tu', 'wa_r'\]\.join\(''\)\)",
                 "parse(['ko_ns', 'arv', 'a_', 'tu', 'wa_r'].join(''), 'ko_n - sar - va_ - tu - wa_r')", content)
content = re.sub(r"parse\(\['marc', 'i', 'ya'\]\.join\(''\)\)",
                 "parse(['marc', 'i', 'ya'].join(''), 'mar - ci - ya')", content)
content = re.sub(r"parse\(\['ma', 'sQ~', 'sQ~a_sQ~'\]\.join\(''\)\)",
                 "parse(['ma', 'sQ~', 'sQ~a_sQ~'].join(''), 'masQ~ - sQ~a_sQ~')", content)
content = re.sub(r"parse\(\['mu', 'dj', 'rim'\]\.join\(''\)\)",
                 "parse(['mu', 'dj', 'rim'].join(''), 'mu - djrim')", content)
content = re.sub(r"parse\(\['ma', 'Hh~al', 'li', 'yy'\]\.join\(''\)\)",
                 "parse(['ma', 'Hh~al', 'li', 'yy'].join(''), 'ma - Hh~al - liyy')", content)
content = re.sub(r"parse\(\['Ku', 'sQ~', 'ru', 'mill'\]\.join\(''\)\)",
                 "parse(['Ku', 'sQ~', 'ru', 'mill'].join(''), 'Ku - sQ~ru - mill')", content)
content = re.sub(r"parse\(\['Ka', 'sQ~', 'riy', 'ya'\]\.join\(''\)\)",
                 "parse(['Ka', 'sQ~', 'riy', 'ya'].join(''), 'Ka - sQ~riy - ya')", content)
content = re.sub(r"parse\(\['KantQ~', 'u_r'\]\.join\(''\)\)",
                 "parse(['KantQ~', 'u_r'].join(''), 'Kan - tQ~u_r')", content)
content = re.sub(r"parse\(\['Qidj', 'rim'\]\.join\(''\)\)",
                 "parse(['Qidj', 'rim'].join(''), 'Qi - djrim')", content)
content = re.sub(r"parse\(\['ma', 'wrid'\]\.join\(''\)\)",
                 "parse(['ma', 'wrid'].join(''), 'maw - rid')", content)

# Now handle regular parse calls
for word, expected_output in expected.items():
    # Skip the ones already done (with expected values)
    if f"parse('{word}', " in content or f'parse("{word}", ' in content or f'parse(`{word}`, ' in content:
        continue
    
    # Handle different quote types
    patterns = [
        (f"parse('{word}')", f"parse('{word}', '{expected_output}')"),
        (f'parse("{word}")', f'parse("{word}", "{expected_output}")'),
        (f'parse(`{word}`)', f'parse(`{word}`, `{expected_output}`)'),
    ]
    
    for pattern, replacement in patterns:
        if pattern in content:
            content = content.replace(pattern, replacement)
            break

with open('test.ts', 'w') as f:
    f.write(content)

print("Updated test.ts with expected outputs")
