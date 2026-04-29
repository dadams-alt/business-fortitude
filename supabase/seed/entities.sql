-- supabase/seed/entities.sql
-- Curated entity seed: sectors, companies, tickers, executives, plus
-- backfill of suggested_* arrays on the 9 already-published articles.
--
-- Editorial frame: BF is for UK entrepreneurs and scale-ups on the
-- unicorn track. UK names are the bulk; FTSE 100 is a sprinkle; the
-- US giants are seeded only insofar as UK businesses interact with
-- their cloud / AI / contracting layers.
--
-- Idempotent: ON CONFLICT (slug) DO NOTHING on every insert; UPDATEs
-- guard with WHERE … IS NULL or explicit slug filters. Re-running is
-- safe.
--
-- Apply: supabase db query --linked --file supabase/seed/entities.sql
-- Order is FK-forced: sectors → companies → tickers
--                  → UPDATE companies.primary_ticker_id
--                  → executives
--                  → article backfill.

-- =====================================================================
-- 1. SECTORS
-- =====================================================================

INSERT INTO sectors (name, slug, aliases, description) VALUES
  ('Fintech',          'fintech',         ARRAY['financial technology','financial-technology','fin-tech'],
                                          'Software and infrastructure reshaping payments, lending, banking, and capital markets.'),
  ('AI',               'ai',              ARRAY['artificial intelligence','machine learning','ai/ml','generative ai','genai','llms','foundation models'],
                                          'Applied artificial intelligence and machine learning across business operations.'),
  ('Climate Tech',     'climate-tech',    ARRAY['cleantech','clean tech','green tech','greentech','climatetech','energy transition'],
                                          'Energy transition, decarbonisation, and sustainability-focused technology and infrastructure.'),
  ('Health Tech',      'healthtech',      ARRAY['health tech','digital health','medtech','healthcare technology'],
                                          'Software, devices, and services applied to clinical care, payers, and patient experience.'),
  ('Biotech',          'biotech',         ARRAY['biotechnology','life sciences','pharma','pharmaceuticals','drug discovery'],
                                          'Therapeutics, diagnostics, and life-sciences research, including pharma and genomics.'),
  ('EdTech',           'edtech',          ARRAY['ed tech','education technology','learning technology'],
                                          'Software and services applied to schools, higher education, and professional learning.'),
  ('B2B SaaS',         'b2b-saas',        ARRAY['enterprise saas','b2b software','vertical saas','horizontal saas','enterprise software'],
                                          'Subscription software sold to businesses, from horizontal tools to vertical workflow systems.'),
  ('PropTech',         'prop-tech',       ARRAY['proptech','property tech','real estate tech','reaal estate technology'],
                                          'Technology applied to commercial and residential real estate, leasing, and asset management.'),
  ('Retail Tech',      'retail-tech',     ARRAY['retail technology','retailtech','commerce tech','store tech'],
                                          'Software, hardware, and operations technology serving retailers, supermarkets, and consumer brands.'),
  ('Deep Tech',        'deep-tech',       ARRAY['deeptech','frontier tech','hard tech','science-based startups'],
                                          'Companies built on science and engineering breakthroughs: chips, robotics, quantum, materials, novel compute.'),
  ('RegTech',          'regtech',         ARRAY['regulatory technology','compliance tech','financial crime tech','aml tech','kyc tech'],
                                          'Software for regulatory compliance, financial crime, KYC/AML, and supervisory reporting.'),
  ('InsurTech',        'insurtech',       ARRAY['insurance technology','insurance tech'],
                                          'Technology applied to underwriting, distribution, claims, and reinsurance across personal and commercial lines.'),
  ('Cybersecurity',    'cybersecurity',   ARRAY['cyber','infosec','information security','security software','cyber security'],
                                          'Defensive security software, identity, threat intelligence, and platform security tooling.'),
  ('E-commerce',       'e-commerce',      ARRAY['ecommerce','online commerce','online retail','dtc','direct-to-consumer'],
                                          'Online retail, marketplaces, and direct-to-consumer infrastructure.'),
  ('Gaming',           'gaming',          ARRAY['games','video games','interactive entertainment','esports'],
                                          'Game studios, publishing, gaming infrastructure, and adjacent interactive entertainment.'),
  ('Mobility',         'mobility',        ARRAY['transport','transportation','logistics','last mile','autonomous vehicles','mobility-as-a-service','maas'],
                                          'Movement of people and goods: ride-hailing, autonomous vehicles, last-mile delivery, freight tech.'),
  ('FoodTech',         'foodtech',        ARRAY['food tech','agritech','alternative protein','food technology'],
                                          'Technology applied to food production, distribution, and alternative protein and ingredient categories.'),
  ('AgriTech',         'agritech',        ARRAY['agri tech','agriculture technology','farmtech','farm tech','agtech'],
                                          'Software and hardware reshaping farming, supply-chain agriculture, and food production at source.'),
  ('MarTech',          'mar-tech',        ARRAY['martech','marketing technology','adtech','ad tech','marketing tech'],
                                          'Marketing, advertising, customer-data, and growth-tech infrastructure for B2C and B2B businesses.'),
  ('HR Tech',          'hr-tech',         ARRAY['hrtech','people tech','talent tech','workforce tech','peopleops'],
                                          'Software for hiring, payroll, performance, learning, and the broader people-operations stack.'),
  ('Marketplaces',     'marketplaces',    ARRAY['two-sided marketplace','marketplace platforms','peer-to-peer marketplaces'],
                                          'Two-sided digital marketplaces connecting buyers and sellers in both consumer and B2B categories.'),
  ('Venture Capital',  'venture',         ARRAY['vc','venture','venture capital','startup investing','early-stage investing'],
                                          'Venture capital firms backing private companies from pre-seed through to growth.')
ON CONFLICT (slug) DO NOTHING;


-- =====================================================================
-- 2. COMPANIES
-- =====================================================================

-- 2a. UK unicorns and notable scale-ups -------------------------------------

INSERT INTO companies (name, slug, aliases, description, website_url, hq_country, founded_year, is_public, sector_ids) VALUES
  ('Revolut', 'revolut',
    ARRAY['Revolut Ltd','Revolut Bank','Revolut Group'],
    'London-headquartered neobank and financial super-app offering retail accounts, business banking, FX, and a growing range of investment products.',
    'https://www.revolut.com', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Monzo', 'monzo',
    ARRAY['Monzo Bank','Monzo Bank Limited'],
    'UK challenger bank with a chat-led app, originally launched as a prepaid card before securing a full UK banking licence.',
    'https://monzo.com', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Starling Bank', 'starling-bank',
    ARRAY['Starling','Starling Bank Ltd'],
    'UK digital bank focused on personal and SME current accounts, founded by Anne Boden after she left Allied Irish Banks.',
    'https://www.starlingbank.com', 'GB', 2014, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Wise', 'wise',
    ARRAY['Wise plc','TransferWise','Transfer Wise'],
    'Cross-border money-transfer and multi-currency-account provider, dual-listed on the London Stock Exchange. Originally TransferWise.',
    'https://wise.com', 'GB', 2011, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Octopus Energy', 'octopus-energy',
    ARRAY['Octopus','Octopus Energy Group'],
    'UK retail energy supplier and technology platform. Operates Kraken, a software platform licensed to other utilities globally.',
    'https://octopus.energy', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('climate-tech'))),

  ('Checkout.com', 'checkout-com',
    ARRAY['Checkout','Checkout.com Group'],
    'Cross-border payments processor headquartered in London, focused on enterprise and global merchant customers.',
    'https://www.checkout.com', 'GB', 2012, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Deliveroo', 'deliveroo',
    ARRAY['Deliveroo plc','Roofoods'],
    'Food-delivery marketplace listed on the London Stock Exchange, operating across the UK, Europe, the Middle East, and Asia-Pacific.',
    'https://deliveroo.co.uk', 'GB', 2013, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('mobility','e-commerce','marketplaces'))),

  ('Ocado', 'ocado',
    ARRAY['Ocado Group','Ocado Retail','Ocado Technology'],
    'British online grocery retailer and technology company, with its core business shifted toward licensing its Ocado Smart Platform to global supermarkets.',
    'https://www.ocadogroup.com', 'GB', 2000, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('retail-tech','e-commerce'))),

  ('GoCardless', 'gocardless',
    ARRAY['Go Cardless','GoCardless Ltd'],
    'London-based recurring-payments platform built around bank debit, used by businesses to collect direct debits and bank-to-bank transfers.',
    'https://gocardless.com', 'GB', 2011, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Tide', 'tide',
    ARRAY['Tide Platform','Tide Bank'],
    'UK business-banking platform serving SMEs with current accounts, expense tools, and credit. Operates via partner banks rather than holding its own UK banking licence.',
    'https://www.tide.co', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Allica Bank', 'allica-bank',
    ARRAY['Allica'],
    'UK challenger bank focused on established SMEs, lending against commercial property and providing business savings products.',
    'https://www.allica.bank', 'GB', 2019, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Atom Bank', 'atom-bank',
    ARRAY['Atom'],
    'Durham-based UK challenger bank specialising in fixed-term savings and SME and residential lending, originally pitched as the UK''s first app-only bank.',
    'https://www.atombank.co.uk', 'GB', 2014, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('OakNorth', 'oaknorth',
    ARRAY['OakNorth Bank','OakNorth Holdings'],
    'UK SME lender focused on entrepreneur-led, mid-market debt, with a credit-analytics platform also licensed to other banks.',
    'https://www.oaknorth.co.uk', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Cleo', 'cleo',
    ARRAY['Cleo AI','Meet Cleo'],
    'AI-driven personal finance assistant aimed at younger consumers, headquartered in London with material US presence.',
    'https://web.meetcleo.com', 'GB', 2016, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech','ai'))),

  ('Curve', 'curve',
    ARRAY['Curve Card'],
    'Card-on-card aggregator that consolidates a user''s credit and debit cards into a single physical and virtual card.',
    'https://www.curve.com', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Marshmallow', 'marshmallow',
    ARRAY['Marshmallow Insurance'],
    'UK challenger motor insurer focused on customer segments traditionally underserved by incumbents, including UK newcomers.',
    'https://www.marshmallow.com', 'GB', 2017, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('insurtech'))),

  ('Pleo', 'pleo',
    ARRAY['Pleo Technologies'],
    'Copenhagen-headquartered company spend-management platform combining smart cards with expense automation, with a sizeable UK customer base.',
    'https://www.pleo.io', 'DK', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Multiverse', 'multiverse',
    ARRAY['Multiverse (formerly WhiteHat)','WhiteHat'],
    'UK apprenticeship and applied-learning platform, formerly WhiteHat, focused on alternative routes into knowledge-economy careers.',
    'https://www.multiverse.io', 'GB', 2016, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('edtech'))),

  ('Mews', 'mews',
    ARRAY['Mews Systems'],
    'Hospitality property-management software, headquartered in Prague with a large UK and European customer base.',
    'https://www.mews.com', 'CZ', 2012, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('b2b-saas','prop-tech'))),

  ('Improbable', 'improbable',
    ARRAY['Improbable Worlds'],
    'London-based technology company building large-scale simulation and metaverse infrastructure, with defence and entertainment business lines.',
    'https://www.improbable.io', 'GB', 2012, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('deep-tech','gaming'))),

  ('Snyk', 'snyk',
    ARRAY['Snyk Limited'],
    'Developer-first cloud-security platform for finding and fixing vulnerabilities in code, dependencies, and containers. Founded in London, now headquartered in Boston.',
    'https://snyk.io', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('cybersecurity','b2b-saas'))),

  ('Paddle', 'paddle',
    ARRAY['Paddle.com'],
    'Merchant-of-record payments and billing platform for SaaS companies, headquartered in London.',
    'https://www.paddle.com', 'GB', 2012, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('b2b-saas','fintech'))),

  ('Quantexa', 'quantexa',
    ARRAY['Quantexa Ltd'],
    'London-based decision-intelligence platform applying graph analytics and AI to financial-crime, KYC, and customer-intelligence problems for banks and governments.',
    'https://www.quantexa.com', 'GB', 2016, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('ai','regtech'))),

  ('Wayve', 'wayve',
    ARRAY['Wayve Technologies'],
    'London-based autonomous-driving company developing end-to-end machine-learning systems for self-driving vehicles.',
    'https://wayve.ai', 'GB', 2017, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('ai','mobility','deep-tech'))),

  ('Graphcore', 'graphcore',
    ARRAY['Graphcore Ltd'],
    'Bristol-based semiconductor company designing IPU processors for AI workloads. Acquired by SoftBank in 2024.',
    'https://www.graphcore.ai', 'GB', 2016, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('deep-tech','ai'))),

  ('Darktrace', 'darktrace',
    ARRAY['Darktrace plc'],
    'Cambridge-based cybersecurity company applying machine learning to enterprise threat detection. Taken private by Thoma Bravo in 2024.',
    'https://darktrace.com', 'GB', 2013, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('cybersecurity','ai'))),

  ('ARM Holdings', 'arm',
    ARRAY['Arm','Arm Holdings plc','Arm Ltd','ARM Ltd'],
    'Cambridge-based semiconductor IP company whose CPU architectures power most of the world''s mobile devices. Listed on NASDAQ in 2023.',
    'https://www.arm.com', 'GB', 1990, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('deep-tech'))),

  ('Thought Machine', 'thought-machine',
    ARRAY['ThoughtMachine'],
    'London-based core-banking software vendor whose Vault platform is used by Lloyds, Standard Chartered, and other tier-1 banks.',
    'https://www.thoughtmachine.net', 'GB', 2014, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech','b2b-saas'))),

  ('ClearBank', 'clearbank',
    ARRAY['Clear Bank','ClearBank Ltd'],
    'UK clearing bank built natively on cloud infrastructure, providing agency-banking and embedded-banking services to fintechs and financial institutions.',
    'https://www.clear.bank', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('TrueLayer', 'truelayer',
    ARRAY['True Layer','TrueLayer Ltd'],
    'London-based open-banking platform offering payments and data APIs to merchants and financial-services providers across Europe.',
    'https://truelayer.com', 'GB', 2016, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Funding Circle', 'funding-circle',
    ARRAY['Funding Circle Holdings','FundingCircle'],
    'UK SME-lending marketplace listed on the London Stock Exchange, originally a peer-to-peer lender that has since pivoted toward institutional funding.',
    'https://www.fundingcircle.com', 'GB', 2010, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

-- 2b. Growth-stage UK names BF will likely cover --------------------------

  ('Onfido', 'onfido',
    ARRAY['Onfido Ltd'],
    'London-based identity-verification provider using AI for document and biometric checks. Acquired by Entrust in 2024.',
    'https://onfido.com', 'GB', 2012, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('regtech','ai'))),

  ('ClearScore', 'clearscore',
    ARRAY['Clear Score'],
    'UK consumer credit-marketplace and free credit-score provider, with operations across the UK, South Africa, and Australia.',
    'https://www.clearscore.com', 'GB', 2014, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Lendable', 'lendable',
    ARRAY['Lendable Ltd'],
    'UK consumer-lending platform using AI underwriting, having expanded from personal loans into credit cards and car finance.',
    'https://www.lendable.co.uk', 'GB', 2014, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Capital on Tap', 'capital-on-tap',
    ARRAY['CapitalOnTap'],
    'UK SME credit-card and working-capital lender, with material US expansion since 2022.',
    'https://www.capitalontap.com', 'GB', 2012, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Modulr', 'modulr',
    ARRAY['Modulr Finance'],
    'UK payments-as-a-service platform providing accounts and embedded payments to other businesses.',
    'https://www.modulrfinance.com', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Soldo', 'soldo',
    ARRAY['Soldo Ltd'],
    'UK and Italy headquartered company spend-management platform combining cards with expense controls.',
    'https://www.soldo.com', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Tessian', 'tessian',
    ARRAY['Tessian Ltd'],
    'London-based email-security company applying machine learning to inbound and outbound threats. Acquired by Proofpoint in 2024.',
    'https://www.tessian.com', 'GB', 2013, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('cybersecurity'))),

  ('ComplyAdvantage', 'complyadvantage',
    ARRAY['Comply Advantage'],
    'London-based financial-crime risk-data and screening platform serving banks and fintechs.',
    'https://complyadvantage.com', 'GB', 2014, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('regtech'))),

  ('Form3', 'form3',
    ARRAY['Form3 Ltd'],
    'UK cloud-native payments platform providing payment-processing infrastructure to banks, including via partnerships with major UK clearing banks.',
    'https://www.form3.tech', 'GB', 2016, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Smarkets', 'smarkets',
    ARRAY['Smarkets Ltd'],
    'London-based betting-exchange operator combining markets infrastructure with consumer-facing brands.',
    'https://smarkets.com', 'GB', 2008, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech','gaming'))),

  ('Faculty', 'faculty-ai',
    ARRAY['Faculty AI','Faculty.ai'],
    'London-based applied-AI consultancy and platform, working extensively with the UK public sector and large enterprises.',
    'https://faculty.ai', 'GB', 2014, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('ai','b2b-saas'))),

  ('Hadean', 'hadean',
    ARRAY['Hadean Supercomputing'],
    'London-based distributed-compute company building infrastructure for simulation, defence, and enterprise workloads.',
    'https://hadean.com', 'GB', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('deep-tech'))),

  ('Builder.ai', 'builder-ai',
    ARRAY['Builder AI','Engineer.ai'],
    'AI-assisted software-development platform, originally founded as Engineer.ai. Headquartered in London.',
    'https://www.builder.ai', 'GB', 2016, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('ai','b2b-saas'))),

  ('Beauhurst', 'beauhurst',
    ARRAY['Beauhurst Ltd'],
    'London-based data platform tracking the UK''s high-growth private-company ecosystem, used heavily by investors and corporates.',
    'https://www.beauhurst.com', 'GB', 2010, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('b2b-saas'))),

  ('Sifted', 'sifted',
    ARRAY['Sifted EU'],
    'European startup-news publication originally backed by the Financial Times. Covers funding, founders, and policy across the European venture ecosystem.',
    'https://sifted.eu', 'GB', 2018, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('b2b-saas'))),

  ('UKTN', 'uktn',
    ARRAY['UK Tech News','UK Technology News'],
    'UK-focused technology and startups publication covering scale-ups, investment, and policy.',
    'https://www.uktech.news', 'GB', 2007, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('b2b-saas'))),

  ('Mumsnet', 'mumsnet',
    ARRAY['Mumsnet Ltd'],
    'UK parenting community and content platform, with a media business and political-influence reputation outsized for its scale.',
    'https://www.mumsnet.com', 'GB', 2000, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('marketplaces'))),

  ('3i Group', '3i-group',
    ARRAY['3i','3i plc'],
    'FTSE 100 international investment manager focused on private equity and infrastructure, listed on the London Stock Exchange.',
    'https://www.3i.com', 'GB', 1945, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('BenevolentAI', 'benevolentai',
    ARRAY['Benevolent AI','BenevolentAI Limited'],
    'AI-driven drug-discovery company focused on applying machine learning to target identification and clinical-stage research. Delisted from Euronext Amsterdam in 2024.',
    'https://www.benevolent.com', 'GB', 2013, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('biotech','ai'))),

  ('Oxford Nanopore', 'oxford-nanopore',
    ARRAY['Oxford Nanopore Technologies','ONT'],
    'Oxford-based genomics company building portable nanopore-based DNA and RNA sequencing devices. Listed on the London Stock Exchange.',
    'https://nanoporetech.com', 'GB', 2005, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('biotech','deep-tech'))),

-- 2c. FTSE 100 sprinkling -----------------------------------------------

  ('Tesco', 'tesco',
    ARRAY['Tesco PLC','Tesco plc'],
    'Britain''s largest grocery retailer by market share, with operations across UK, Ireland, and central Europe. Listed on the London Stock Exchange.',
    'https://www.tescoplc.com', 'GB', 1919, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('retail-tech','e-commerce'))),

  ('Sainsbury''s', 'sainsburys',
    ARRAY['J Sainsbury','J Sainsbury plc','Sainsbury''s PLC'],
    'UK supermarket group operating the Sainsbury''s, Argos, Habitat, and Nectar brands. Listed on the London Stock Exchange.',
    'https://www.about.sainsburys.co.uk', 'GB', 1869, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('retail-tech','e-commerce'))),

  ('Marks & Spencer', 'marks-and-spencer',
    ARRAY['M&S','Marks and Spencer','Marks & Spencer Group','M and S'],
    'British retailer of clothing, home, and food, with c. 1,000 stores and a substantial online business. Listed on the London Stock Exchange.',
    'https://corporate.marksandspencer.com', 'GB', 1884, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('retail-tech','e-commerce'))),

  ('BP', 'bp',
    ARRAY['British Petroleum','BP plc','BP p.l.c.'],
    'British multinational oil and gas company, dual-listed in London and New York, with stated ambitions to transition toward integrated energy.',
    'https://www.bp.com', 'GB', 1909, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('climate-tech'))),

  ('Shell', 'shell',
    ARRAY['Shell plc','Royal Dutch Shell'],
    'British oil and gas major, dual-listed in London and New York. One of the largest energy companies in the world by revenue.',
    'https://www.shell.com', 'GB', 1907, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('climate-tech'))),

  ('AstraZeneca', 'astrazeneca',
    ARRAY['AstraZeneca PLC','Astra Zeneca','AZN'],
    'Anglo-Swedish pharmaceutical company, dual-listed in London and New York. Major franchises in oncology, respiratory, and cardiovascular.',
    'https://www.astrazeneca.com', 'GB', 1999, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('biotech','healthtech'))),

  ('GSK', 'gsk',
    ARRAY['GlaxoSmithKline','GSK plc'],
    'British pharmaceutical and vaccine company, listed on the London Stock Exchange. Demerged its consumer business as Haleon in 2022.',
    'https://www.gsk.com', 'GB', 2000, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('biotech','healthtech'))),

  ('BAE Systems', 'bae-systems',
    ARRAY['BAE','BAE Systems plc'],
    'UK-headquartered defence, security, and aerospace prime contractor. Listed on the London Stock Exchange.',
    'https://www.baesystems.com', 'GB', 1999, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('deep-tech'))),

  ('Lloyds Banking Group', 'lloyds',
    ARRAY['Lloyds','Lloyds Bank','LBG'],
    'UK retail and commercial banking group, owner of the Lloyds, Halifax, Bank of Scotland, and Scottish Widows brands. Listed on the London Stock Exchange.',
    'https://www.lloydsbankinggroup.com', 'GB', 1995, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Barclays', 'barclays',
    ARRAY['Barclays plc','Barclays Bank'],
    'British universal bank, with major retail, corporate, and investment-banking franchises. Listed on the London Stock Exchange.',
    'https://home.barclays', 'GB', 1690, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('HSBC', 'hsbc',
    ARRAY['HSBC Holdings','HSBC Holdings plc','Hongkong and Shanghai Banking Corporation'],
    'London-headquartered global bank with a heavy weighting toward Asia. Listed on the London, Hong Kong, and New York exchanges.',
    'https://www.hsbc.com', 'GB', 1865, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('fintech'))),

  ('Vodafone', 'vodafone',
    ARRAY['Vodafone Group','Vodafone plc'],
    'British multinational telecommunications operator, listed on the London Stock Exchange. Telecoms is outside our seeded sector taxonomy for now.',
    'https://www.vodafone.com', 'GB', 1991, true,
    ARRAY[]::uuid[]),

-- 2d. US tech giants (UK-business-relevant) ------------------------------

  ('Apple', 'apple',
    ARRAY['Apple Inc.','Apple Inc'],
    'Cupertino-based hardware, software, and services company. Listed on NASDAQ.',
    'https://www.apple.com', 'US', 1976, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('retail-tech','deep-tech'))),

  ('Microsoft', 'microsoft',
    ARRAY['Microsoft Corporation','MSFT'],
    'Redmond-based software, cloud, and AI company. Listed on NASDAQ. Azure and Microsoft 365 are central to UK enterprise IT.',
    'https://www.microsoft.com', 'US', 1975, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('b2b-saas','ai','cybersecurity'))),

  ('Alphabet', 'alphabet',
    ARRAY['Google','Google LLC','Alphabet Inc.'],
    'Holding company for Google, YouTube, Google Cloud, and DeepMind. Listed on NASDAQ.',
    'https://abc.xyz', 'US', 2015, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('ai','b2b-saas','mar-tech'))),

  ('Meta', 'meta',
    ARRAY['Meta Platforms','Meta Platforms Inc.','Facebook','Facebook Inc.'],
    'Operator of Facebook, Instagram, WhatsApp, and Reality Labs. Listed on NASDAQ.',
    'https://about.meta.com', 'US', 2004, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('mar-tech','ai'))),

  ('Amazon', 'amazon',
    ARRAY['Amazon.com','Amazon.com Inc.','AWS'],
    'Seattle-based e-commerce and cloud company. Listed on NASDAQ. AWS is the dominant cloud provider for UK scale-ups.',
    'https://www.aboutamazon.com', 'US', 1994, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('e-commerce','b2b-saas','retail-tech'))),

  ('Nvidia', 'nvidia',
    ARRAY['NVIDIA','NVIDIA Corporation'],
    'Designer of GPUs, AI accelerators, and software, headquartered in Santa Clara. Listed on NASDAQ.',
    'https://www.nvidia.com', 'US', 1993, true,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('ai','deep-tech','gaming'))),

  ('OpenAI', 'openai',
    ARRAY['OpenAI Inc','OpenAI LP','OpenAI Global'],
    'San Francisco-based AI research and deployment company, developer of the GPT model series and ChatGPT. Privately held.',
    'https://openai.com', 'US', 2015, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('ai','deep-tech'))),

-- 2e. UK VC firms -------------------------------------------------------

  ('Atomico', 'atomico',
    ARRAY['Atomico Investment Holdings'],
    'London-based growth-stage venture firm founded by Niklas Zennström, focused on European technology companies.',
    'https://www.atomico.com', 'GB', 2006, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('Index Ventures', 'index-ventures',
    ARRAY['Index'],
    'European-American venture firm with offices in London, San Francisco, and New York. Backs early- and growth-stage technology companies.',
    'https://www.indexventures.com', 'GB', 1996, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('Balderton Capital', 'balderton-capital',
    ARRAY['Balderton'],
    'London-based early-stage venture firm investing in European founders, formerly Benchmark Europe.',
    'https://www.balderton.com', 'GB', 2000, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('Hoxton Ventures', 'hoxton-ventures',
    ARRAY['Hoxton'],
    'London-based seed-stage venture firm; early backer of Deliveroo, Babylon, and Darktrace.',
    'https://hoxtonventures.com', 'GB', 2013, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('LocalGlobe', 'localglobe',
    ARRAY['LocalGlobe Ventures','Phoenix Court'],
    'London-based seed-stage venture firm founded by Robin and Saul Klein; part of the Phoenix Court group.',
    'https://www.localglobe.vc', 'GB', 1999, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('Notion Capital', 'notion-capital',
    ARRAY['Notion'],
    'London-based early-stage venture firm focused on B2B SaaS and enterprise companies.',
    'https://notion.vc', 'GB', 2009, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('Octopus Ventures', 'octopus-ventures',
    ARRAY['Octopus VC'],
    'London-based early-stage venture firm and part of the broader Octopus Group.',
    'https://octopusventures.com', 'GB', 2008, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('Passion Capital', 'passion-capital',
    ARRAY['Passion'],
    'London-based seed-stage venture firm; early backer of Monzo, GoCardless, and Marshmallow.',
    'https://www.passioncapital.com', 'GB', 2011, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('Seedcamp', 'seedcamp',
    ARRAY['Seedcamp Ltd'],
    'London-based pre-seed and seed venture firm; early backer of Revolut, TransferWise, and UiPath.',
    'https://seedcamp.com', 'GB', 2007, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('Episode 1 Ventures', 'episode-1-ventures',
    ARRAY['Episode 1','Episode One'],
    'London-based seed-stage venture firm focused on UK B2B software companies.',
    'https://www.episode1.com', 'GB', 2013, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('Connect Ventures', 'connect-ventures',
    ARRAY['Connect'],
    'London-based seed-stage venture firm focused on European product-led companies.',
    'https://www.connectventures.co', 'GB', 2012, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

  ('Entrepreneur First', 'entrepreneur-first',
    ARRAY['EF','Entrepreneur First Ltd'],
    'Talent-investor model, supporting individuals to find co-founders and form companies. Headquartered in London with a global cohort presence.',
    'https://www.joinef.com', 'GB', 2011, false,
    ARRAY(SELECT id FROM sectors WHERE slug IN ('venture'))),

-- 2f. UK government and regulators --------------------------------------

  ('HM Revenue and Customs', 'hmrc',
    ARRAY['HMRC','HM Revenue & Customs','Inland Revenue'],
    'UK tax authority, responsible for the collection of taxes and the administration of certain regulatory regimes.',
    'https://www.gov.uk/government/organisations/hm-revenue-customs', 'GB', 2005, false,
    ARRAY[]::uuid[]),

  ('Financial Conduct Authority', 'fca',
    ARRAY['FCA'],
    'UK financial-services regulator, overseeing conduct in retail and wholesale financial markets and the consumer-credit regime.',
    'https://www.fca.org.uk', 'GB', 2013, false,
    ARRAY[]::uuid[]),

  ('Bank of England', 'bank-of-england',
    ARRAY['BoE','Old Lady of Threadneedle Street'],
    'The UK''s central bank, responsible for monetary policy, financial stability, and prudential regulation.',
    'https://www.bankofengland.co.uk', 'GB', 1694, false,
    ARRAY[]::uuid[]),

  ('Department for Business and Trade', 'dbt',
    ARRAY['DBT','Department for Business','BEIS'],
    'UK government department responsible for business policy, international trade, and industrial strategy.',
    'https://www.gov.uk/government/organisations/department-for-business-and-trade', 'GB', 2023, false,
    ARRAY[]::uuid[]),

  ('Companies House', 'companies-house',
    ARRAY['CH'],
    'UK registrar of companies, responsible for the incorporation, dissolution, and maintenance of statutory company information.',
    'https://www.gov.uk/government/organisations/companies-house', 'GB', 1844, false,
    ARRAY[]::uuid[]),

  ('British Business Bank', 'british-business-bank',
    ARRAY['BBB','British Business Bank plc'],
    'State-owned UK economic-development bank, deploying capital to support SME finance through wholesale and direct programmes.',
    'https://www.british-business-bank.co.uk', 'GB', 2014, false,
    ARRAY[]::uuid[]),

  ('Innovate UK', 'innovate-uk',
    ARRAY['Technology Strategy Board','TSB'],
    'UK government''s national innovation agency, part of UKRI, providing grants and programmes to support business R&D.',
    'https://www.ukri.org/councils/innovate-uk', 'GB', 2007, false,
    ARRAY[]::uuid[]),

  ('Competition and Markets Authority', 'cma',
    ARRAY['CMA','Competition Commission'],
    'UK competition regulator, responsible for merger control, market investigations, and consumer-protection enforcement.',
    'https://www.gov.uk/government/organisations/competition-and-markets-authority', 'GB', 2014, false,
    ARRAY[]::uuid[])

ON CONFLICT (slug) DO NOTHING;


-- =====================================================================
-- 3. TICKERS
-- =====================================================================

INSERT INTO tickers (name, slug, aliases, symbol, exchange, company_id, currency, is_active) VALUES
  ('Tesco',                       'lse-tsco',  ARRAY[]::text[], 'TSCO',  'LSE',    (SELECT id FROM companies WHERE slug='tesco'),             'GBP', true),
  ('Sainsbury''s',                'lse-sbry',  ARRAY[]::text[], 'SBRY',  'LSE',    (SELECT id FROM companies WHERE slug='sainsburys'),        'GBP', true),
  ('Marks & Spencer',             'lse-mks',   ARRAY[]::text[], 'MKS',   'LSE',    (SELECT id FROM companies WHERE slug='marks-and-spencer'), 'GBP', true),
  ('BP',                          'lse-bp',    ARRAY[]::text[], 'BP',    'LSE',    (SELECT id FROM companies WHERE slug='bp'),                'GBP', true),
  ('Shell',                       'lse-shel',  ARRAY[]::text[], 'SHEL',  'LSE',    (SELECT id FROM companies WHERE slug='shell'),             'GBP', true),
  ('AstraZeneca (LSE)',           'lse-azn',   ARRAY['AZN.L'], 'AZN',   'LSE',    (SELECT id FROM companies WHERE slug='astrazeneca'),       'GBP', true),
  ('GSK',                         'lse-gsk',   ARRAY[]::text[], 'GSK',   'LSE',    (SELECT id FROM companies WHERE slug='gsk'),               'GBP', true),
  ('BAE Systems',                 'lse-ba',    ARRAY['BA.','BA.L'], 'BA',    'LSE',    (SELECT id FROM companies WHERE slug='bae-systems'),       'GBP', true),
  ('Lloyds Banking Group',        'lse-lloy',  ARRAY[]::text[], 'LLOY',  'LSE',    (SELECT id FROM companies WHERE slug='lloyds'),            'GBP', true),
  ('Barclays',                    'lse-barc',  ARRAY[]::text[], 'BARC',  'LSE',    (SELECT id FROM companies WHERE slug='barclays'),          'GBP', true),
  ('HSBC',                        'lse-hsba',  ARRAY[]::text[], 'HSBA',  'LSE',    (SELECT id FROM companies WHERE slug='hsbc'),              'GBP', true),
  ('Vodafone',                    'lse-vod',   ARRAY[]::text[], 'VOD',   'LSE',    (SELECT id FROM companies WHERE slug='vodafone'),          'GBP', true),
  ('Wise',                        'lse-wise',  ARRAY[]::text[], 'WISE',  'LSE',    (SELECT id FROM companies WHERE slug='wise'),              'GBP', true),
  ('Deliveroo',                   'lse-roo',   ARRAY[]::text[], 'ROO',   'LSE',    (SELECT id FROM companies WHERE slug='deliveroo'),         'GBP', true),
  ('Ocado',                       'lse-ocdo',  ARRAY[]::text[], 'OCDO',  'LSE',    (SELECT id FROM companies WHERE slug='ocado'),             'GBP', true),
  ('Funding Circle',              'lse-fcmh',  ARRAY['FCH'], 'FCMH',  'LSE',    (SELECT id FROM companies WHERE slug='funding-circle'),    'GBP', true),
  ('Oxford Nanopore',             'lse-ont',   ARRAY[]::text[], 'ONT',   'LSE',    (SELECT id FROM companies WHERE slug='oxford-nanopore'),   'GBP', true),
  ('3i Group',                    'lse-iii',   ARRAY[]::text[], 'III',   'LSE',    (SELECT id FROM companies WHERE slug='3i-group'),          'GBP', true),
  ('Apple',                       'nasdaq-aapl', ARRAY[]::text[], 'AAPL',  'NASDAQ', (SELECT id FROM companies WHERE slug='apple'),             'USD', true),
  ('Microsoft',                   'nasdaq-msft', ARRAY[]::text[], 'MSFT',  'NASDAQ', (SELECT id FROM companies WHERE slug='microsoft'),         'USD', true),
  ('Alphabet',                    'nasdaq-googl',ARRAY['GOOG'], 'GOOGL', 'NASDAQ', (SELECT id FROM companies WHERE slug='alphabet'),          'USD', true),
  ('Meta',                        'nasdaq-meta', ARRAY[]::text[], 'META',  'NASDAQ', (SELECT id FROM companies WHERE slug='meta'),              'USD', true),
  ('Amazon',                      'nasdaq-amzn', ARRAY[]::text[], 'AMZN',  'NASDAQ', (SELECT id FROM companies WHERE slug='amazon'),            'USD', true),
  ('Nvidia',                      'nasdaq-nvda', ARRAY[]::text[], 'NVDA',  'NASDAQ', (SELECT id FROM companies WHERE slug='nvidia'),            'USD', true),
  ('ARM Holdings',                'nasdaq-arm',  ARRAY[]::text[], 'ARM',   'NASDAQ', (SELECT id FROM companies WHERE slug='arm'),               'USD', true),
  ('AstraZeneca (NASDAQ)',        'nasdaq-azn',  ARRAY[]::text[], 'AZN',   'NASDAQ', (SELECT id FROM companies WHERE slug='astrazeneca'),       'USD', true)
ON CONFLICT (slug) DO NOTHING;


-- =====================================================================
-- 4. UPDATE companies.primary_ticker_id
-- =====================================================================

-- Single-ticker companies first: pick the only ticker that points back.
UPDATE companies c
   SET primary_ticker_id = t.id
  FROM tickers t
 WHERE t.company_id = c.id
   AND c.primary_ticker_id IS NULL
   AND NOT EXISTS (
     SELECT 1 FROM tickers t2
      WHERE t2.company_id = c.id AND t2.id <> t.id
   );

-- AstraZeneca is dual-listed; force LSE as primary for our UK readership.
UPDATE companies
   SET primary_ticker_id = (SELECT id FROM tickers WHERE slug = 'lse-azn')
 WHERE slug = 'astrazeneca';


-- =====================================================================
-- 5. EXECUTIVES
-- =====================================================================

INSERT INTO executives (name, slug, aliases, role, current_company_id, bio) VALUES

-- 5a. UK founders / current CEOs of seeded companies -----------------

  ('Nik Storonsky', 'nik-storonsky', ARRAY[]::text[],
    'Co-founder & CEO',
    (SELECT id FROM companies WHERE slug='revolut'),
    'Co-founder and chief executive of Revolut. Previously a derivatives trader at Credit Suisse and Lehman Brothers.'),

  ('Vlad Yatsenko', 'vlad-yatsenko', ARRAY[]::text[],
    'Co-founder & CTO',
    (SELECT id FROM companies WHERE slug='revolut'),
    'Co-founder and CTO of Revolut. Previously a software engineer at Credit Suisse and Deutsche Bank.'),

  ('TS Anil', 'ts-anil', ARRAY['Tirumalarao Subramanya Anil'],
    'CEO',
    (SELECT id FROM companies WHERE slug='monzo'),
    'Chief executive of Monzo since 2020. Previously a senior executive at Visa and Standard Chartered.'),

  ('Tom Blomfield', 'tom-blomfield', ARRAY[]::text[],
    'Co-founder',
    (SELECT id FROM companies WHERE slug='monzo'),
    'Co-founder of Monzo and previously of GoCardless. Now a partner at Y Combinator.'),

  ('Raman Bhatia', 'raman-bhatia', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='starling-bank'),
    'Chief executive of Starling Bank since 2024. Previously head of digital banking at HSBC UK.'),

  ('Anne Boden', 'anne-boden', ARRAY[]::text[],
    'Founder',
    (SELECT id FROM companies WHERE slug='starling-bank'),
    'Founder of Starling Bank and CEO until 2023. Previously COO of Allied Irish Banks.'),

  ('Kristo Käärmann', 'kristo-kaarmann', ARRAY['Kristo Kaarmann'],
    'Co-founder & CEO',
    (SELECT id FROM companies WHERE slug='wise'),
    'Co-founder and chief executive of Wise. Previously a consultant at Deloitte.'),

  ('Taavet Hinrikus', 'taavet-hinrikus', ARRAY[]::text[],
    'Co-founder',
    (SELECT id FROM companies WHERE slug='wise'),
    'Co-founder of Wise and Skype''s first employee. Now an active angel investor and Plural co-founder.'),

  ('Greg Jackson', 'greg-jackson', ARRAY[]::text[],
    'Founder & CEO',
    (SELECT id FROM companies WHERE slug='octopus-energy'),
    'Founder and chief executive of Octopus Energy. Previously founded a series of UK technology and energy ventures.'),

  ('Guillaume Pousaz', 'guillaume-pousaz', ARRAY[]::text[],
    'Founder & CEO',
    (SELECT id FROM companies WHERE slug='checkout-com'),
    'Founder and chief executive of Checkout.com. Previously worked in cross-border payments at International Payments Consultants.'),

  ('Will Shu', 'will-shu', ARRAY[]::text[],
    'Co-founder & CEO',
    (SELECT id FROM companies WHERE slug='deliveroo'),
    'Co-founder and chief executive of Deliveroo. Previously an investment banker at Morgan Stanley.'),

  ('Tim Steiner', 'tim-steiner', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='ocado'),
    'Co-founder and chief executive of Ocado Group. Previously a bond trader at Goldman Sachs.'),

  ('Hiroki Takeuchi', 'hiroki-takeuchi', ARRAY[]::text[],
    'Co-founder & CEO',
    (SELECT id FROM companies WHERE slug='gocardless'),
    'Co-founder and chief executive of GoCardless. Previously a consultant at McKinsey.'),

  ('Oliver Prill', 'oliver-prill', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='tide'),
    'Chief executive of Tide. Previously chief operating officer at Telia Company.'),

  ('Richard Davies', 'richard-davies', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='allica-bank'),
    'Chief executive of Allica Bank. Previously CEO of Revolut UK and chief operating officer at OakNorth.'),

  ('Mark Mullen', 'mark-mullen', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='atom-bank'),
    'Chief executive of Atom Bank. Previously CEO of First Direct.'),

  ('Rishi Khosla', 'rishi-khosla', ARRAY[]::text[],
    'Co-founder & CEO',
    (SELECT id FROM companies WHERE slug='oaknorth'),
    'Co-founder and chief executive of OakNorth. Previously co-founded Copal Partners, sold to Moody''s.'),

  ('Barney Hussey-Yeo', 'barney-hussey-yeo', ARRAY[]::text[],
    'Founder & CEO',
    (SELECT id FROM companies WHERE slug='cleo'),
    'Founder and chief executive of Cleo. Previously head of growth at LMAX Exchange.'),

  ('Shachar Bialick', 'shachar-bialick', ARRAY[]::text[],
    'Founder & CEO',
    (SELECT id FROM companies WHERE slug='curve'),
    'Founder and chief executive of Curve. Background in management consulting and the Israeli special forces.'),

  ('Oliver Kent-Braham', 'oliver-kent-braham', ARRAY[]::text[],
    'Co-founder & co-CEO',
    (SELECT id FROM companies WHERE slug='marshmallow'),
    'Co-founder and co-CEO of Marshmallow. Co-founded the company with his twin brother Alexander.'),

  ('Jeppe Rindom', 'jeppe-rindom', ARRAY[]::text[],
    'Co-founder & CEO',
    (SELECT id FROM companies WHERE slug='pleo'),
    'Co-founder and chief executive of Pleo. Previously CFO at Tradeshift.'),

  ('Euan Blair', 'euan-blair', ARRAY[]::text[],
    'Co-founder & CEO',
    (SELECT id FROM companies WHERE slug='multiverse'),
    'Co-founder and chief executive of Multiverse. Previously a banker at Morgan Stanley.'),

  ('Matt Welle', 'matt-welle', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='mews'),
    'Chief executive of Mews. Hospitality industry background spanning Mandarin Oriental and Kempinski.'),

  ('Herman Narula', 'herman-narula', ARRAY[]::text[],
    'Co-founder & CEO',
    (SELECT id FROM companies WHERE slug='improbable'),
    'Co-founder and chief executive of Improbable. Studied computer science at Cambridge.'),

  ('Peter McKay', 'peter-mckay', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='snyk'),
    'Chief executive of Snyk. Previously co-CEO of Veeam Software.'),

  ('Christian Owens', 'christian-owens', ARRAY[]::text[],
    'Co-founder & CEO',
    (SELECT id FROM companies WHERE slug='paddle'),
    'Co-founder and chief executive of Paddle. Started his first business as a teenager.'),

  ('Vishal Marria', 'vishal-marria', ARRAY[]::text[],
    'Founder & CEO',
    (SELECT id FROM companies WHERE slug='quantexa'),
    'Founder and chief executive of Quantexa. Previously a director at EY''s financial-crime practice.'),

  ('Alex Kendall', 'alex-kendall', ARRAY[]::text[],
    'Co-founder & CEO',
    (SELECT id FROM companies WHERE slug='wayve'),
    'Co-founder and chief executive of Wayve. PhD in computer-vision and machine-learning at Cambridge.'),

  ('Husayn Kassai', 'husayn-kassai', ARRAY[]::text[],
    'Co-founder',
    (SELECT id FROM companies WHERE slug='onfido'),
    'Co-founder of Onfido. Now founder and CEO of Quench AI.'),

-- 5b. VC partners ---------------------------------------------------

  ('Niklas Zennström', 'niklas-zennstrom', ARRAY['Niklas Zennstrom'],
    'Founding partner',
    (SELECT id FROM companies WHERE slug='atomico'),
    'Founding partner of Atomico. Co-founder of Skype, Kazaa, and Joost.'),

  ('Sonali De Rycker', 'sonali-de-rycker', ARRAY[]::text[],
    'Partner',
    NULL,
    'Partner at Accel''s London office, focused on European technology investments. Accel is not seeded as a separate entity in this pass.'),

  ('Hussein Kanji', 'hussein-kanji', ARRAY[]::text[],
    'Founding partner',
    (SELECT id FROM companies WHERE slug='hoxton-ventures'),
    'Founding partner of Hoxton Ventures. Previously at Microsoft and Accel London.'),

  ('Saul Klein', 'saul-klein', ARRAY[]::text[],
    'Founding partner',
    (SELECT id FROM companies WHERE slug='localglobe'),
    'Founding partner of LocalGlobe and Phoenix Court. Previously a partner at Index Ventures.'),

  ('Robin Klein', 'robin-klein', ARRAY[]::text[],
    'Founding partner',
    (SELECT id FROM companies WHERE slug='localglobe'),
    'Founding partner of LocalGlobe and Phoenix Court. Co-founder of The Accelerator Group.'),

  ('Suranga Chandratillake', 'suranga-chandratillake', ARRAY[]::text[],
    'General partner',
    (SELECT id FROM companies WHERE slug='balderton-capital'),
    'General partner at Balderton Capital. Previously founded blinkx, listed on the London Stock Exchange.'),

  ('Reshma Sohoni', 'reshma-sohoni', ARRAY[]::text[],
    'Co-founder & partner',
    (SELECT id FROM companies WHERE slug='seedcamp'),
    'Co-founder and partner at Seedcamp. Previously at Sun Microsystems.'),

  ('Eileen Burbidge', 'eileen-burbidge', ARRAY[]::text[],
    'Founding partner',
    (SELECT id FROM companies WHERE slug='passion-capital'),
    'Founding partner of Passion Capital. Previously at Yahoo, Apple, and Skype, and a UK government adviser on fintech.'),

  ('Jan Hammer', 'jan-hammer', ARRAY[]::text[],
    'Partner',
    (SELECT id FROM companies WHERE slug='index-ventures'),
    'Partner at Index Ventures, focused on fintech and enterprise. Previously at Goldman Sachs.'),

  ('Stephen Welton', 'stephen-welton', ARRAY[]::text[],
    'Founder',
    NULL,
    'Founder of BGF, the Business Growth Fund. BGF is not seeded as a separate entity in this pass.'),

-- 5c. FTSE 100 / US giant CEOs --------------------------------------

  ('Pascal Soriot', 'pascal-soriot', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='astrazeneca'),
    'Chief executive of AstraZeneca since 2012. Previously chief operating officer of Roche''s pharmaceuticals division.'),

  ('Emma Walmsley', 'emma-walmsley', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='gsk'),
    'Chief executive of GSK since 2017. Previously CEO of GSK Consumer Healthcare.'),

  ('Murray Auchincloss', 'murray-auchincloss', ARRAY['Tufan Erginbilgic'],
    'CEO',
    (SELECT id FROM companies WHERE slug='bp'),
    'Chief executive of BP. Aliases include the prior CEO Tufan Erginbilgic so older articles still resolve to BP leadership.'),

  ('Wael Sawan', 'wael-sawan', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='shell'),
    'Chief executive of Shell since 2023. Previously director of integrated gas and renewables.'),

  ('Charles Woodburn', 'charles-woodburn', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='bae-systems'),
    'Chief executive of BAE Systems. Previously CEO of Expro Group.'),

  ('Charlie Nunn', 'charlie-nunn', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='lloyds'),
    'Chief executive of Lloyds Banking Group since 2021. Previously head of wealth and personal banking at HSBC.'),

  ('C.S. Venkatakrishnan', 'cs-venkatakrishnan', ARRAY['Venkat'],
    'CEO',
    (SELECT id FROM companies WHERE slug='barclays'),
    'Chief executive of Barclays since 2021. Previously chief risk officer.'),

  ('Georges Elhedery', 'georges-elhedery', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='hsbc'),
    'Chief executive of HSBC since 2024. Previously CFO and co-CEO of global banking and markets.'),

  ('Margherita Della Valle', 'margherita-della-valle', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='vodafone'),
    'Chief executive of Vodafone since 2023. Long career inside the Vodafone group, including as CFO.'),

  ('Ken Murphy', 'ken-murphy', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='tesco'),
    'Chief executive of Tesco since 2020. Previously chief commercial officer at Walgreens Boots Alliance.'),

  ('Simon Roberts', 'simon-roberts', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='sainsburys'),
    'Chief executive of Sainsbury''s. Previously president of Boots UK and Ireland.'),

  ('Stuart Machin', 'stuart-machin', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='marks-and-spencer'),
    'Chief executive of Marks & Spencer. Previously managing director of M&S Food.'),

  ('Sundar Pichai', 'sundar-pichai', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='alphabet'),
    'Chief executive of Alphabet and Google. Joined Google in 2004.'),

  ('Tim Cook', 'tim-cook', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='apple'),
    'Chief executive of Apple since 2011. Previously chief operating officer.'),

  ('Satya Nadella', 'satya-nadella', ARRAY[]::text[],
    'Chairman & CEO',
    (SELECT id FROM companies WHERE slug='microsoft'),
    'Chairman and chief executive of Microsoft. Joined Microsoft in 1992; CEO since 2014.'),

  ('Mark Zuckerberg', 'mark-zuckerberg', ARRAY[]::text[],
    'Chairman & CEO',
    (SELECT id FROM companies WHERE slug='meta'),
    'Co-founder, chairman, and chief executive of Meta Platforms.'),

  ('Andy Jassy', 'andy-jassy', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='amazon'),
    'Chief executive of Amazon since 2021. Previously founded and led Amazon Web Services.'),

  ('Jensen Huang', 'jensen-huang', ARRAY[]::text[],
    'Founder & CEO',
    (SELECT id FROM companies WHERE slug='nvidia'),
    'Co-founder and chief executive of Nvidia.'),

  ('Sam Altman', 'sam-altman', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='openai'),
    'Chief executive of OpenAI. Previously president of Y Combinator.'),

  ('Demis Hassabis', 'demis-hassabis', ARRAY[]::text[],
    'Co-founder',
    (SELECT id FROM companies WHERE slug='alphabet'),
    'Co-founder of DeepMind, now Google DeepMind, part of Alphabet. Nobel Laureate in Chemistry 2024.'),

-- 5d. Government and policy ----------------------------------------

  ('Andrew Bailey', 'andrew-bailey', ARRAY[]::text[],
    'Governor',
    (SELECT id FROM companies WHERE slug='bank-of-england'),
    'Governor of the Bank of England since 2020. Previously chief executive of the Financial Conduct Authority.'),

  ('Nikhil Rathi', 'nikhil-rathi', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='fca'),
    'Chief executive of the Financial Conduct Authority since 2020. Previously CEO of London Stock Exchange plc.'),

  ('Jonathan Reynolds', 'jonathan-reynolds', ARRAY[]::text[],
    'Secretary of State',
    (SELECT id FROM companies WHERE slug='dbt'),
    'Secretary of State for Business and Trade. Labour MP for Stalybridge and Hyde.'),

  ('Louis Taylor', 'louis-taylor', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='british-business-bank'),
    'Chief executive of the British Business Bank. Previously CEO of UK Export Finance.'),

  ('Indro Mukerjee', 'indro-mukerjee', ARRAY[]::text[],
    'CEO',
    (SELECT id FROM companies WHERE slug='innovate-uk'),
    'Chief executive of Innovate UK. Background in semiconductor and technology businesses.')

ON CONFLICT (slug) DO NOTHING;


-- =====================================================================
-- 6. ARTICLE BACKFILL — tag the 9 published articles with their entities
--                       via the article_entities join table.
--
-- Schema deviation from the spec: spec wrote `UPDATE articles SET
-- suggested_*` but those columns live on news_candidates (set by
-- news-filter), not on articles. The article→entity relationship lives
-- in article_entities, created in migration 005. Same intent, correct
-- target.
-- =====================================================================

INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT (SELECT id FROM articles WHERE slug = 'british-business-bank-s-ai-pivot-what'), p.etype, p.eid
FROM (
  SELECT 'company'::text AS etype, id AS eid FROM companies WHERE slug IN ('british-business-bank')
  UNION ALL
  SELECT 'sector'::text,            id        FROM sectors   WHERE slug IN ('ai','fintech','venture')
) p
ON CONFLICT (article_id, entity_type, entity_id) DO NOTHING;

INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT (SELECT id FROM articles WHERE slug = 'shell-s-16-4bn-arc-deal-marks'), p.etype, p.eid
FROM (
  SELECT 'company'::text AS etype, id AS eid FROM companies  WHERE slug IN ('shell')
  UNION ALL
  SELECT 'ticker'::text,            id        FROM tickers    WHERE company_id = (SELECT id FROM companies WHERE slug='shell')
  UNION ALL
  SELECT 'executive'::text,         id        FROM executives WHERE slug IN ('wael-sawan')
  UNION ALL
  SELECT 'sector'::text,            id        FROM sectors    WHERE slug IN ('climate-tech')
) p
ON CONFLICT (article_id, entity_type, entity_id) DO NOTHING;

INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT (SELECT id FROM articles WHERE slug = 'shell-s-16-4bn-arc-deal-signals'), p.etype, p.eid
FROM (
  SELECT 'company'::text AS etype, id AS eid FROM companies  WHERE slug IN ('shell')
  UNION ALL
  SELECT 'ticker'::text,            id        FROM tickers    WHERE company_id = (SELECT id FROM companies WHERE slug='shell')
  UNION ALL
  SELECT 'executive'::text,         id        FROM executives WHERE slug IN ('wael-sawan')
  UNION ALL
  SELECT 'sector'::text,            id        FROM sectors    WHERE slug IN ('climate-tech')
) p
ON CONFLICT (article_id, entity_type, entity_id) DO NOTHING;

INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT (SELECT id FROM articles WHERE slug = 'ineffable-intelligence-closes-1-1bn-seed-europe'), p.etype, p.eid
FROM (
  SELECT 'company'::text AS etype, id AS eid FROM companies WHERE slug IN ('british-business-bank')
  UNION ALL
  SELECT 'sector'::text,            id        FROM sectors   WHERE slug IN ('ai','deep-tech')
) p
ON CONFLICT (article_id, entity_type, entity_id) DO NOTHING;

INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT (SELECT id FROM articles WHERE slug = 'seraphim-space-350m-european-launch'), p.etype, p.eid
FROM (
  SELECT 'sector'::text AS etype, id AS eid FROM sectors WHERE slug IN ('deep-tech')
) p
ON CONFLICT (article_id, entity_type, entity_id) DO NOTHING;

INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT (SELECT id FROM articles WHERE slug = 'bank-of-england-hawkish-minority-may-meeting'), p.etype, p.eid
FROM (
  SELECT 'company'::text   AS etype, id AS eid FROM companies  WHERE slug IN ('bank-of-england')
  UNION ALL
  SELECT 'executive'::text,            id        FROM executives WHERE slug IN ('andrew-bailey')
) p
ON CONFLICT (article_id, entity_type, entity_id) DO NOTHING;

INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT (SELECT id FROM articles WHERE slug = 'sereact-110m-series-b-physical-ai'), p.etype, p.eid
FROM (
  SELECT 'sector'::text AS etype, id AS eid FROM sectors WHERE slug IN ('ai','deep-tech')
) p
ON CONFLICT (article_id, entity_type, entity_id) DO NOTHING;

INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT (SELECT id FROM articles WHERE slug = 'amazon-ai-lab-kings-cross-talent'), p.etype, p.eid
FROM (
  SELECT 'company'::text AS etype, id AS eid FROM companies WHERE slug IN ('amazon')
  UNION ALL
  SELECT 'ticker'::text,            id        FROM tickers   WHERE company_id = (SELECT id FROM companies WHERE slug='amazon')
  UNION ALL
  SELECT 'sector'::text,            id        FROM sectors   WHERE slug IN ('ai','b2b-saas')
) p
ON CONFLICT (article_id, entity_type, entity_id) DO NOTHING;

INSERT INTO article_entities (article_id, entity_type, entity_id)
SELECT (SELECT id FROM articles WHERE slug = 'uk-classroom-ai-teacher-shortage'), p.etype, p.eid
FROM (
  SELECT 'company'::text AS etype, id AS eid FROM companies WHERE slug IN ('microsoft','alphabet')
  UNION ALL
  SELECT 'ticker'::text,            id        FROM tickers   WHERE company_id IN (SELECT id FROM companies WHERE slug IN ('microsoft','alphabet'))
  UNION ALL
  SELECT 'sector'::text,            id        FROM sectors   WHERE slug IN ('ai','edtech')
) p
ON CONFLICT (article_id, entity_type, entity_id) DO NOTHING;
