-- supabase/seed/rss_feeds.sql
-- Seed for public.rss_feeds. Idempotent via ON CONFLICT (url).
-- Apply against linked prod with:
--   supabase db query --linked --file supabase/seed/rss_feeds.sql
-- NOT a migration — data, not schema.
--
-- Probe history (2026-04-27): 10 of original 29 candidates returned 403 (WAF block)
-- or 404 (RSS retired). See backlog: replacement regional + sector + funding feeds needed.
-- Real Business requires feedparser-style User-Agent (Cloudflare browser-UA block) —
-- handled by news-ingest-rss default UA, not at the row level.

INSERT INTO public.rss_feeds (name, source_name, url, homepage_url, category, fetch_interval_minutes)
VALUES
-- general: national & wire business news
('BBC Business',           'BBC',             'https://feeds.bbci.co.uk/news/business/rss.xml',                              'https://www.bbc.co.uk/news/business',                                     'general',     30),
('Guardian Business',      'The Guardian',    'https://www.theguardian.com/uk/business/rss',                                 'https://www.theguardian.com/uk/business',                                 'general',     30),
('Sky News Business',      'Sky News',        'https://feeds.skynews.com/feeds/rss/business.xml',                            'https://news.sky.com/business',                                           'general',     30),
('City AM',                'City AM',         'https://www.cityam.com/feed/',                                                'https://www.cityam.com',                                                  'general',     60),

-- scaleup: founder / growth / scale-up coverage (BF core beat)
('Sifted',                 'Sifted',          'https://sifted.eu/feed',                                                      'https://sifted.eu',                                                       'scaleup',     30),
('UKTN',                   'UKTN',            'https://www.uktech.news/feed',                                                'https://www.uktech.news',                                                 'scaleup',     60),
('Tech.eu',                'Tech.eu',         'https://tech.eu/feed/',                                                       'https://tech.eu',                                                         'scaleup',     60),
('Growth Business',        'Growth Business', 'https://www.growthbusiness.co.uk/feed/',                                      'https://www.growthbusiness.co.uk',                                        'scaleup',     60),
('Business Matters',       'Business Matters','https://bmmagazine.co.uk/feed/',                                              'https://bmmagazine.co.uk',                                                'scaleup',     60),
('Real Business',          'Real Business',   'https://realbusiness.co.uk/feed/',                                            'https://realbusiness.co.uk',                                              'scaleup',    120),

-- regional: thin — only BusinessCloud survives current probe
('BusinessCloud',          'BusinessCloud',   'https://businesscloud.co.uk/feed/',                                           'https://businesscloud.co.uk',                                             'regional',    60),

-- sector: thin — only Marketing Week + Accountancy Age survive
('Marketing Week',         'Marketing Week',  'https://www.marketingweek.com/feed/',                                         'https://www.marketingweek.com',                                           'sector',     120),
('Accountancy Age',        'Accountancy Age', 'https://www.accountancyage.com/feed/',                                        'https://www.accountancyage.com',                                          'sector',     120),

-- funding: thin — only Beauhurst survives
('Beauhurst',              'Beauhurst',       'https://www.beauhurst.com/feed/',                                             'https://www.beauhurst.com',                                               'funding',    120),

-- regulation: government & regulators (intact)
('HMRC',                   'HMRC',            'https://www.gov.uk/government/organisations/hm-revenue-customs.atom',         'https://www.gov.uk/government/organisations/hm-revenue-customs',          'regulation', 240),
('Department for Business and Trade','DBT',   'https://www.gov.uk/government/organisations/department-for-business-and-trade.atom', 'https://www.gov.uk/government/organisations/department-for-business-and-trade', 'regulation', 240),
('FCA',                    'FCA',             'https://www.fca.org.uk/news/rss.xml',                                         'https://www.fca.org.uk/news',                                             'regulation', 120),
('Bank of England',        'Bank of England', 'https://www.bankofengland.co.uk/rss/news',                                    'https://www.bankofengland.co.uk/news',                                    'regulation', 240),
('Companies House',        'Companies House', 'https://www.gov.uk/government/organisations/companies-house.atom',            'https://www.gov.uk/government/organisations/companies-house',             'regulation', 240)
ON CONFLICT (url) DO NOTHING;
