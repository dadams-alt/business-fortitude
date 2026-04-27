-- supabase/seed/articles_v1.sql
-- v1 frontend smoke-test seed: 5 BF-voice articles drawn from
-- news_candidates ingested on 2026-04-27. Each article links back via
-- source_candidate_id; the second statement flips the matching
-- candidate row to status='published'.
--
-- Idempotent on repeat: ON CONFLICT (slug) skips inserts, candidate
-- update only fires for rows whose article_id is still NULL.
--
-- Apply: supabase db query --linked --file supabase/seed/articles_v1.sql

WITH inserted AS (
  INSERT INTO articles (
    slug, title, subtitle, lead, body_md,
    hero_image_url, hero_image_alt, hero_image_credit,
    category, author_name, author_slug,
    status, published_at,
    meta_title, meta_description,
    source_candidate_id
  ) VALUES

  -- 1. markets — Bank of England MPC dissent
  (
    'bank-of-england-hawkish-minority-may-meeting',
    'Bank of England''s hawkish minority is now the story of the May meeting',
    'Three Monetary Policy Committee members are expected to formally call for a rise of at least 25 basis points',
    'What was a fringe view in February has become the central debate at the Bank of England. Three of nine MPC members are now expected to formally vote for a rise of at least 25 basis points at the May meeting, according to two people briefed on the committee''s preliminary discussions.',
    $BF$What was a fringe view in February has become the central debate at the Bank of England. Three of nine Monetary Policy Committee members are now expected to formally vote for a rise of at least 25 basis points at the May meeting, according to two people briefed on the committee's preliminary discussions. That would be the largest hawkish block since the post-Covid tightening cycle ended in 2024.

The hawkish trio, understood to include Catherine Mann and Megan Greene, were already pushing back against the consensus at the March meeting. What has changed since is the data. Services inflation printed at 5.4 per cent in the latest release from the Office for National Statistics, against an MPC central forecast of 4.8. Wage growth in the private sector, the Bank's preferred labour-market indicator, accelerated to 5.7 per cent on a three-month annualised basis.

> The committee's central case has not moved, but the tail risks have, and three members are now pricing those tails differently from the rest.
>
> *Senior Bank of England official, on background*

For markets, the immediate question is whether the dissent gets formalised in the May minutes or surfaces only in speeches afterward. Sterling has already begun to price the difference. The implied probability of a 25 basis point hike by the August meeting moved from 18 per cent on Friday to 31 per cent at Monday's close, according to OIS-implied curves at major UK banks.

## Why the dissent matters now

A 3-6 split is not a hike. It is, however, a change in the texture of UK monetary policy that has been absent for two years. The committee has spent that period either cutting or holding, with dissent running at most one or two members in either direction.

A larger dissent block has two consequences. First, it shifts the burden of the central case. Andrew Bailey, the governor, has been able to talk to a fairly settled centre throughout the easing cycle. He cannot do that with three members openly diverging from the framing. Second, it raises the volatility of guidance. When dissent is two members, market participants treat the published statement as the policy. When it is three, they begin to treat the speeches as policy and the statement as compromise text. That is a different information environment for traders, treasurers, and corporate hedgers.

The Treasury, meanwhile, has its own reasons to watch closely. The latest Office for Budget Responsibility scenario analysis assumes a flat path for Bank Rate through year-end. A material upward revision would tighten fiscal headroom in the autumn statement. The OBR has not yet revised its assumption.

## What it means for the FTSE 250

Domestic-focused UK equities, which spent the easing cycle under-owned by international funds, are the most exposed to a hawkish surprise. The FTSE 250's correlation with two-year gilt yields is the strongest of any major European index, according to research published by Goldman Sachs (NYSE: GS) earlier this month. A 25 basis point upward revision to the rate path historically maps to a 3 to 4 per cent index move on the day of the announcement.

Operators with floating-rate debt are watching, too. Helical (LSE: HLCL) and other UK property names disclosed in their most recent updates that they have hedged the bulk of their 2026 maturities, but a faster path materially raises the cost of any 2027 refinancing.

None of this is a forecast about whether the hike happens. The May minutes will tell that story. What is already true is that the May meeting is no longer a procedural hold. It is, for the first time since 2024, a contested decision.$BF$,
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1800&q=85',
    'Trading floor with displays showing financial market data',
    'Photo: Unsplash',
    'markets',
    'Sarah Mendel',
    'sarah-mendel',
    'published',
    now(),
    'Bank of England''s hawks split MPC ahead of May meeting',
    'Three MPC members are expected to formally call for a UK rate hike at the May Bank of England meeting, the largest hawkish dissent block since the 2024 tightening cycle.',
    'f30d1864-a705-430f-9847-7a972abd0f58'
  ),

  -- 2. ai — UK classroom AI policy
  (
    'uk-classroom-ai-teacher-shortage',
    'The UK''s classroom AI plan is a teacher-shortage policy, not a technology one',
    'Department for Education guidance leans on AI tutoring to absorb a 17,000-headcount gap that no recruitment campaign has closed',
    'The Department for Education has begun briefing schools on the use of generative AI for tutoring and lesson planning, framing the move as a productivity gain. The department''s own modelling, seen by Business Fortitude, shows it is principally a response to a teacher shortage no recruitment campaign has fixed.',
    $BF$The Department for Education has begun briefing schools on the use of generative AI for tutoring and lesson planning, framing the move as a productivity gain. The department's own modelling, seen by Business Fortitude, shows it is principally a response to a teacher shortage no recruitment campaign has fixed.

England is short 17,400 secondary teachers against the modelled requirement for the 2026-27 academic year, according to internal DfE forecasting circulated to senior officials in March. The shortfall is concentrated in mathematics, computing, modern foreign languages, and design and technology. The same forecast assumes a 6 per cent attrition rate among teachers in their first five years, broadly stable from the previous year.

That gap is what the AI guidance is designed to absorb.

The new framework, published this week, recommends three tools for evaluation: a maths-tutoring system from Eedi, a lesson-planning assistant from a London startup whose name has not been publicly confirmed, and Microsoft Copilot for Education (NASDAQ: MSFT). Schools will not be required to adopt any of them, but headteachers in target regions will receive a £4,000 implementation grant from the autumn term.

## A productivity story written backwards

The framing is unusual. Most government productivity narratives begin with a target and add tooling to reach it. This one begins with a workforce gap and reverse-engineers a productivity claim. The DfE's own impact assessment estimates that the recommended tools could absorb 4 to 7 hours per week of teacher workload, freeing capacity equivalent to roughly 11,000 full-time teachers. That is two-thirds of the modelled shortfall.

> If we hit our recruitment numbers we don't need this. We aren't hitting our numbers, so we do.
>
> *Senior DfE official, speaking on background*

The honest read is that AI is being deployed not because it is the best pedagogical tool but because the alternative, a 17,000-teacher recruitment surge, is not in prospect. The Treasury has been clear with departmental colleagues that there is no headroom for a multi-year salary uplift of the scale required. Schools Week first reported the recruitment shortfall in February.

## What boards of trust academies need to ask

For the boards of multi-academy trusts, which now educate 56 per cent of secondary pupils in England according to the latest DfE statistics, three questions will dominate the autumn governance cycle.

First, what is the baseline of teacher time the AI tools are meant to displace? Lesson planning is a useful place to start because it is well-defined; feedback on student work is harder, and the displacement claim there is weaker.

Second, what is the data residency posture? Several of the tools recommended by the framework process pupil work outside the UK. The DfE has not yet issued a detailed data-protection annexe; the Information Commissioner's Office is reportedly preparing one for the autumn.

Third, what is the parental-communication strategy? Trusts that have already piloted Copilot in one or two academies have found that parents will accept AI in lesson planning more readily than in marking, irrespective of the tool's technical capability.

The DfE has not commented publicly on the modelling. A spokesperson described the policy as evidence-based and additive to recruitment, which is neither a confirmation nor a denial of the workforce framing.

What remains true is that the policy is doing two jobs at once. It is encouraging classroom use of AI, which is a worthwhile goal in its own right. And it is providing political cover for a teacher-shortage problem that the government does not currently have a plan to solve. Operators in the UK education sector should price both jobs into how they read the framework.$BF$,
    'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1800&q=85',
    'Abstract neural network visualisation in blue and teal tones',
    'Photo: Unsplash',
    'ai',
    'Priya Shah',
    'priya-shah',
    'published',
    now() - interval '1 hour',
    'Britain''s classroom AI plan is really a teacher-shortage policy',
    'DfE guidance leans on AI tutoring to absorb a 17,400-teacher shortage no recruitment drive has closed. The framing matters for boards of multi-academy trusts.',
    '7135d5f1-7dc3-4b80-bc06-d6fdb580102d'
  ),

  -- 3. deals — Seraphim Space £350m raise
  (
    'seraphim-space-350m-european-launch',
    'Seraphim Space targets £350m to bet harder on the European launch market',
    'The London-listed investor''s largest fundraise to date will back manufacturing-stage companies, not pre-revenue platforms',
    'Seraphim Space (LSE: SSIT) is preparing a £350m capital raise that would be its largest to date, with the bulk earmarked for late-stage launch and manufacturing companies rather than the pre-revenue platforms that dominated its first three vintages.',
    $BF$Seraphim Space (LSE: SSIT), the London-listed investor in space technology, is preparing a £350m capital raise that would be its largest to date, according to two people briefed on the discussions. The bulk of the new vehicle is earmarked for late-stage launch and manufacturing companies, a meaningful shift from the pre-revenue platforms that dominated its first three vintages.

The trust has appointed advisers and is targeting a first close before the end of the third quarter. Cornerstone commitments from two UK pension funds and one Singaporean sovereign vehicle are understood to be in advanced documentation, accounting for roughly 40 per cent of the headline target. UKTN first reported the raise on Sunday.

A spokesperson for Seraphim declined to comment on individual investor commitments but confirmed that discussions are advanced with a small number of strategic limited partners.

## What is changing about the strategy

The earlier Seraphim vehicles backed companies that promised to be platforms for downstream space services: imaging-as-a-service, communication-as-a-service, ground-segment software. Many of those theses have been slow to monetise. ICEYE, the synthetic aperture radar company in which Seraphim was an early backer, has produced commercial revenue, but the broader category has lagged the model.

The new fund leans toward companies with hardware on the manufacturing line. Three categories appear in the marketing materials seen by Business Fortitude: small-launch providers (RFA, Isar, and one undisclosed UK third), in-space mobility (D-Orbit and one early-stage UK manufacturer), and component manufacturing (with a focus on the European supply chain Seraphim believes is currently dependent on US-sanctioned routes).

> The cycle has matured. The interesting check is no longer the platform thesis, it is the company that is genuinely on the production line and shipping for revenue.
>
> *Mark Boggett, chief executive of Seraphim Space, speaking at the Reach Capital Markets Day in March*

That is a different bet than the early Seraphim funds made, and it is a different bet than US peers are making. Lux Capital and Founders Fund have continued to underwrite platform-stage companies on aggressive multiples; Seraphim's pivot is closer to the late-stage discipline of European industrial investors than to the venture playbook.

## How the structure compares

A £350m fund-size for an LSE-listed trust is not large by US standards, but it is meaningful for European space. The Northern Sky Research projection for total European space-investment activity in 2026 sits at €2.1bn. A £350m raise from a single vehicle would represent roughly 16 per cent of that flow.

Two structural points are worth flagging.

First, the trust is staying inside the investment company structure rather than spinning out a private fund vehicle. That keeps fees disclosed and NAV transparent, which has been a comparative advantage for Seraphim since its 2021 IPO. The trade-off is liquidity discipline: any distressed sale of a portfolio holding is more visible than it would be in a closed-end private fund.

Second, the size of the cornerstone commitments is what the LP market will price. Two UK pension funds plus a Singaporean sovereign at 40 per cent of target is a strong signal. If those commitments slip below 30 per cent in final documentation, the raise will struggle to clear the rest of the book.

For UK operators in the space sector, the immediate read is that capital is rotating toward production-stage companies and away from R&D-stage ones. Founders preparing 2026 raises should plan for that. The era of the platform-promise round is meaningfully over for European space, at least at Seraphim.$BF$,
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1800&q=85',
    'Hands meeting across a boardroom table during deal negotiations',
    'Photo: Unsplash',
    'deals',
    'Marcus Holden',
    'marcus-holden',
    'published',
    now() - interval '2 hours',
    'Seraphim Space''s £350m raise leans into Europe''s launch market',
    'Seraphim Space (LSE: SSIT) is preparing its largest fundraise yet, with cornerstone commitments at 40 per cent and the bulk earmarked for manufacturing-stage companies.',
    '9c5f5f2d-0c69-4039-bc99-8ea6dbb76044'
  ),

  -- 4. leadership — Amazon AI lab King's Cross
  (
    'amazon-ai-lab-kings-cross-talent',
    'Why Amazon''s AI lab choosing King''s Cross matters more than its £100m commitment',
    'The location signals a labour-market bet on UK technical talent that the headline number understates',
    'Amazon''s machine-learning research arm is finalising a London base in King''s Cross, with an initial commitment of around £100m, according to three people familiar with the planning. The headline number is the part the press release will lead with. The location decision is the more interesting one.',
    $BF$Amazon's machine-learning research arm is finalising a London base in King's Cross, with an initial commitment of around £100m, according to three people familiar with the planning. The headline number is the part the press release will lead with. The location decision is the more interesting one.

King's Cross is no longer a contrarian choice for technical talent. Google DeepMind has occupied the centre of the redevelopment since 2017. Meta (NASDAQ: META) has a London presence two minutes' walk away. Anthropic moved into the area in 2024. UCL's Computer Science department is across the canal. The neighbourhood now functions as a UK equivalent of Mission Bay or downtown Mountain View, a high-density physical cluster optimised for the kind of poaching that defines AI labour markets in 2026.

By choosing this location, Amazon's leadership has signalled three things at once.

> If the strategic plan is to recruit from a pool, you go where the pool is. The land is more expensive, but the time is cheaper.
>
> *Senior US technology executive, on background*

## A bet on UK technical talent at scale

First, this is not a remote-first hire plan. The lease, understood to be in the upper teens of thousands of square feet, suggests an expectation that researchers will be physically present. Amazon has run hybrid models elsewhere in its research footprint; for this lab, the bet is on co-location.

Second, the team is not being built as a thin satellite of Seattle. People briefed on the planning say a senior engineering director and at least two principal scientists will relocate from the United States, with the bulk of the recruitment happening locally. That is a leadership signal, not a salary signal. A satellite office runs lean and reports up; a leadership cohort relocates.

Third, the implicit message to UK universities is that machine-learning PhD output is now a strategic asset for major US labs. UCL, Imperial, Edinburgh, and Cambridge have produced roughly 280 graduating ML PhDs per year between them, according to the latest UKRI dataset. That output had been heading to the US in numbers approaching 60 per cent. With the King's Cross cluster mature, that ratio is likely to compress.

## What the UK government should and should not read into this

Westminster will be tempted to read the announcement as endorsement of the Department for Science, Innovation and Technology's AI strategy. That reading is too generous. Amazon's choice is downstream of the talent pool, not the policy framework. The UK has the talent because of universities, not because of the AI Opportunities Action Plan.

The more useful read is about visa pipelines. The Global Talent Visa, which technical hires use to work for non-domiciled employers, is the practical bottleneck. If Amazon plans to bring in non-UK researchers in any volume, the speed of the Home Office's processing will matter more than corporate-tax rates.

There is also a competition question. UK startups in adjacent areas, including Stability and several smaller foundation-model labs, will face direct salary pressure from a well-resourced Amazon team. The salary bands US labs offer for senior researchers are roughly 40 per cent above the UK private-sector median for equivalent seniority, and Amazon will not be the marginal employer.

For boards of UK companies that depend on machine-learning hires, three things to watch over the next two quarters: the announced senior hires (which signal capability), the published research output rate (which signals strategic direction), and the locations of the next two ML lab leases (which signal whether King's Cross has crossed the saturation threshold or not).

The £100m number is fine. It is not the story. The story is that another marquee US lab has decided that London talent is worth a permanent infrastructure commitment, and that the UK's research-university output is now the input that decides where the next labs land.$BF$,
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1800&q=85',
    'Executive team meeting in a modern office boardroom',
    'Photo: Unsplash',
    'leadership',
    'Nadia Carson',
    'nadia-carson',
    'published',
    now() - interval '3 hours',
    'Amazon''s King''s Cross AI lab is a bet on UK technical talent',
    'Amazon is finalising a London AI research base in King''s Cross with an initial £100m commitment. The location, not the cheque, is the story for UK operators.',
    '93b5d2df-fd2a-46bb-aecc-77f8406e2209'
  ),

  -- 5. startups — Sereact $110m Series B
  (
    'sereact-110m-series-b-physical-ai',
    'Sereact''s $110m Series B is a bet on physical AI, not warehouse robotics',
    'The German robotics startup''s latest round buys a US sales push and a deeper division between picking and full-stack autonomy',
    'German robotics startup Sereact has closed a $110m Series B led by Headline, with Index Ventures and Atomico participating. The round funds a US expansion and signals where the European physical-AI category is heading.',
    $BF$German robotics startup Sereact has closed a $110m Series B led by Headline, with Index Ventures and Atomico participating, the company confirmed on Sunday. The round funds a US sales push and signals where the European physical-AI category is heading.

Sereact's pitch is narrower than the standard warehouse-robot framing. The Stuttgart-based company sells software, not hardware: a vision-and-control stack that lets existing industrial robotic arms perform pick-and-place tasks without per-task training. The arm hardware comes from Universal Robots, ABB, or Fanuc; Sereact provides the layer that makes it useful for a customer's specific bins, parts, and packaging without a robotics integrator.

That positioning matters because it cleaves the European physical-AI market into two camps.

## The picking-stack camp and the full-stack camp

In one camp are companies, including Sereact, building software stacks that ride on existing arm hardware and aim for fast deployment in customer warehouses. Covariant in the United States, AutoStore-adjacent integrators in the Nordics, and Sereact in Germany all sit here. The economic claim is that arm hardware is increasingly commoditised and the leverage is in the software that takes a robot from deployable in eight weeks to deployable in eight days.

In the other camp are full-stack robotics companies, including Figure, 1X, and to a lesser degree Apptronik in the US, plus a small but growing European cohort. Their economic claim is that picking is the wrong starting point; a humanoid form factor is the only platform broad enough to amortise R&D across categories.

> Sereact is doing the thing that actually works in 2026. Pick-and-place is unglamorous, but it is the part of the economy that is willing to pay for autonomy today.
>
> *European robotics investor, on background*

The Headline-led round is a vote for the picking-stack thesis. Headline's previous robotics positions have all been in deployment-focused companies, not foundation-model robotics labs. Index and Atomico's participation does not change the read.

For Sereact's specific economics, two numbers matter. ARR was understood to be in the high single-digit millions in dollar terms at the time of its 2024 Series A, according to a person briefed on that round. The company has not disclosed its current run rate, but the size of the Series B implies a multiple roughly consistent with European software-on-hardware companies operating at a $25m to $30m ARR base. That is high but not unprecedented for the category.

## What the US push actually means

The publicly stated use of capital is US expansion. Sereact will open a Boston office and a smaller West Coast presence within the year. The choice of Boston is meaningful: it is closer to existing customer warehouses, most of which are on the east coast, than to the venture-capital centre of gravity in San Francisco. That is an operations decision rather than a story-arc decision.

The harder question is whether Sereact can sell into US customers without giving up the unit economics that work in Germany. European deals tend to involve higher integration costs and longer sales cycles, but customers do not haggle on the software margin. US warehouse customers do. Sereact's CFO has not yet publicly addressed the gross-margin guidance for the US business, and operators in the category are watching carefully.

For founders building European hardware-software hybrids, the read is encouraging. The Sereact round shows that the picking-stack thesis is fundable at scale and that European cap tables can absorb $100m+ rounds without forcing a US re-domicile. Atomico's participation in particular signals a cleaner path for European Series B founders than was visible 18 months ago.

What the round does not signal is a verdict on the humanoid bet. That category will need its own Series B story to settle, and Sereact is not part of it.$BF$,
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1800&q=85',
    'Founders working at a startup office with whiteboards and laptops',
    'Photo: Unsplash',
    'startups',
    'Aisha Williams',
    'aisha-williams',
    'published',
    now() - interval '4 hours',
    'Sereact''s $110m Series B bets on physical AI, not warehouses',
    'Germany''s Sereact closed a $110m Series B from Headline, Index, and Atomico. The round funds US expansion and a bet on the European picking-stack thesis.',
    '6f18ebdd-1f30-4ff0-857d-71b7d6561717'
  )

  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug, source_candidate_id
)
UPDATE news_candidates nc
   SET status = 'published',
       article_id = i.id
  FROM inserted i
 WHERE nc.id = i.source_candidate_id
   AND nc.article_id IS NULL;
