// src/app/admin/page.tsx
// Admin dashboard. Counts at a glance — pipeline stages, RSS feed
// health, entity directory sizes. Server-rendered, no client
// interactivity. Uses service-role client because admin views often
// need to count rows that anon RLS hides.

import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

interface Stat {
  label: string;
  value: number | string;
  hint?: string;
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="bg-surface rounded-2xl p-6">
      <div className="kicker text-soft mb-3">{stat.label}</div>
      <div className="display text-[40px] mb-1">{stat.value}</div>
      {stat.hint && <div className="text-[12px] text-soft">{stat.hint}</div>}
    </div>
  );
}

async function loadCounts() {
  const supabase = createServiceClient();
  const [
    pendingC,
    readyC,
    writingC,
    publishedC,
    rejectedC,
    duplicateC,
    publishedArticles,
    todayArticles,
    weekArticles,
    activeFeeds,
    inactiveFeeds,
    failingFeeds,
    companies,
    executives,
    sectors,
    tickers,
    articleEntities,
    subscribers,
    activeSubscribers,
  ] = await Promise.all([
    supabase.from("news_candidates").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("news_candidates").select("id", { count: "exact", head: true }).eq("status", "ready"),
    supabase.from("news_candidates").select("id", { count: "exact", head: true }).eq("status", "writing"),
    supabase.from("news_candidates").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("news_candidates").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("news_candidates").select("id", { count: "exact", head: true }).eq("status", "duplicate"),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .gte("published_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .gte("published_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()),
    supabase.from("rss_feeds").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("rss_feeds").select("id", { count: "exact", head: true }).eq("is_active", false),
    supabase
      .from("rss_feeds")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .gt("consecutive_failure_count", 0),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("executives").select("id", { count: "exact", head: true }),
    supabase.from("sectors").select("id", { count: "exact", head: true }),
    supabase.from("tickers").select("id", { count: "exact", head: true }),
    supabase.from("article_entities").select("article_id", { count: "exact", head: true }),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
    supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .is("unsubscribed_at", null),
  ]);

  return {
    pipeline: {
      pending: pendingC.count ?? 0,
      ready: readyC.count ?? 0,
      writing: writingC.count ?? 0,
      published: publishedC.count ?? 0,
      rejected: rejectedC.count ?? 0,
      duplicate: duplicateC.count ?? 0,
    },
    articles: {
      total: publishedArticles.count ?? 0,
      today: todayArticles.count ?? 0,
      week: weekArticles.count ?? 0,
    },
    feeds: {
      active: activeFeeds.count ?? 0,
      inactive: inactiveFeeds.count ?? 0,
      failing: failingFeeds.count ?? 0,
    },
    entities: {
      companies: companies.count ?? 0,
      executives: executives.count ?? 0,
      sectors: sectors.count ?? 0,
      tickers: tickers.count ?? 0,
      tags: articleEntities.count ?? 0,
    },
    newsletter: {
      total: subscribers.count ?? 0,
      active: activeSubscribers.count ?? 0,
    },
  };
}

export default async function AdminDashboard() {
  const c = await loadCounts();
  return (
    <div>
      <h1 className="display text-[36px] mb-2">Dashboard</h1>
      <p className="text-soft text-[14px] mb-8">
        Live counts. Server-rendered each request.
      </p>

      <h2 className="kicker text-soft mb-3">Articles</h2>
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard stat={{ label: "Published total", value: c.articles.total }} />
        <StatCard stat={{ label: "Last 7 days", value: c.articles.week }} />
        <StatCard stat={{ label: "Last 24 hours", value: c.articles.today }} />
      </div>

      <h2 className="kicker text-soft mb-3">Pipeline (news_candidates)</h2>
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard stat={{ label: "Pending", value: c.pipeline.pending, hint: "Awaiting filter" }} />
        <StatCard stat={{ label: "Ready", value: c.pipeline.ready, hint: "Filter approved, queue for write" }} />
        <StatCard stat={{ label: "Writing", value: c.pipeline.writing, hint: "Claimed by news-write" }} />
        <StatCard stat={{ label: "Published", value: c.pipeline.published }} />
        <StatCard stat={{ label: "Rejected", value: c.pipeline.rejected }} />
        <StatCard stat={{ label: "Duplicate", value: c.pipeline.duplicate }} />
      </div>

      <h2 className="kicker text-soft mb-3">RSS feeds</h2>
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard stat={{ label: "Active", value: c.feeds.active }} />
        <StatCard stat={{ label: "Failing", value: c.feeds.failing, hint: "≥1 consecutive failure" }} />
        <StatCard stat={{ label: "Disabled", value: c.feeds.inactive }} />
      </div>

      <h2 className="kicker text-soft mb-3">Entity directory</h2>
      <div className="grid grid-cols-5 gap-4 mb-10">
        <StatCard stat={{ label: "Companies", value: c.entities.companies }} />
        <StatCard stat={{ label: "People", value: c.entities.executives }} />
        <StatCard stat={{ label: "Sectors", value: c.entities.sectors }} />
        <StatCard stat={{ label: "Tickers", value: c.entities.tickers }} />
        <StatCard stat={{ label: "Article tags", value: c.entities.tags }} />
      </div>

      <h2 className="kicker text-soft mb-3">Newsletter</h2>
      <div className="grid grid-cols-2 gap-4">
        <StatCard stat={{ label: "Subscribers (active)", value: c.newsletter.active }} />
        <StatCard
          stat={{
            label: "Total",
            value: c.newsletter.total,
            hint: `${c.newsletter.total - c.newsletter.active} unsubscribed`,
          }}
        />
      </div>
    </div>
  );
}
