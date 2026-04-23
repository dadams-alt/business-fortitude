import re, os, sys
d = os.path.dirname(os.path.abspath(__file__))
os.chdir(d)
files = [
  '02-modern-business-tech.html',
  'article-01.html',
  'category-markets.html',
  'company-games-workshop.html',
  'ticker-ftse250.html',
  'person-ashley-steel.html',
  'sector-consumer.html',
]
pat = re.compile(r'<!-- Top ticker -->.*?<!-- Header -->', re.S)
for f in files:
    with open(f) as fh:
        s = fh.read()
    s2 = pat.sub('<!-- Header -->', s, count=1)
    same = (s == s2)
    with open(f, 'w') as fh:
        fh.write(s2)
    print(f, 'unchanged' if same else 'stripped')
