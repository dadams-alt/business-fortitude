import re, os, sys
d = os.path.dirname(os.path.abspath(__file__))
os.chdir(d)
files = sorted(f for f in os.listdir('.') if f.endswith('.html'))
tags = ['div','section','article','ul','ol','nav','header','footer','main','aside',
        'form','button','h1','h2','h3','h4','script','style','p','span','figure',
        'figcaption','table','thead','tbody','tr','dl','blockquote','details','summary','dd','dt']
any_bad = False
for f in files:
    with open(f) as fh:
        content = fh.read()
    bad = []
    for t in tags:
        opens = len(re.findall(r'<' + t + r'[\s>]', content))
        closes = len(re.findall(r'</' + t + r'>', content))
        if opens - closes:
            bad.append(t + '(o=' + str(opens) + ',c=' + str(closes) + ')')
    status = 'OK' if not bad else 'MISMATCH: ' + ' '.join(bad)
    if bad:
        any_bad = True
    print(('%-38s ' % f) + status)
print('\nALL OK' if not any_bad else '\nissues found')
