// src/app/admin/candidates/page.tsx
// Read-only paginated list of news_candidates. Filter by status,
// 50 per page, ordered by created_at DESC.

import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  "all",
  "pending",
  "ready",
  "writing",
  "published",
  "rejected",
  "duplicate",
  "failed",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const PAGE_SIZE = 50;

interface CandidateRow {
  id: string;
  source_title: string;
  status: string;
  priority_score: number | null;
  source_pub_date: string | null;
  created_at: string;
  source_feed: string | null;
}

interface FeedRef {
  id: string;
  name: string;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Europe/London",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusPill({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: "bg-surface text-ink",
    ready: "bg-lime text-ink",
    writing: "bg-accent text-white",
    published: "bg-ink text-white",
    rejected: "bg-white border border-rule text-soft",
    duplicate: "bg-white border border-rule text-soft",
    failed: "bg-[#dc2626] text-white",
  };
  return <span className={`chip ${classes[status] ?? "bg-surface"}`}>{status}</span>;
}

export default async function AdminCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const statusParam = (sp.status ?? "all") as StatusFilter;
  const status: StatusFilter = STATUS_FILTERS.includes(statusParam)
    ? statusParam
    : "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = createServiceClient();
  let query = supabase
    .from("news_candidates")
    .select(
      "id, source_title, status, priority_score, source_pub_date, created_at, source_feed",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (status !== "all") query = query.eq("status", status);
  const { data, count } = await query;
  const candidates = (data ?? []) as CandidateRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // Resolve feed names in one round-trip.
  const feedIds = Array.from(
    new Set(candidates.map((c) => c.source_feed).filter((id): id is string => !!id)),
  );
  const { data: feedRows } = feedIds.length
    ? await supabase.from("rss_feeds").select("id, name").in("id", feedIds)
    : { data: [] as FeedRef[] };
  const feedById = new Map((feedRows ?? []).map((f) => [f.id, f.name]));

  const queryString = (s: StatusFilter, p: number) => {
    const u = new URLSearchParams();
    if (s !== "all") u.set("status", s);
    if (p > 1) u.set("page", String(p));
    return u.toString() ? `?${u}` : "";
  };

  return (
    <div>
      <h1 className="display text-[36px] mb-2">Candidates</h1>
      <p className="text-soft text-[14px] mb-8">
        {count ?? 0} total · page {page} of {totalPages}
      </p>

      <nav className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((s) => {
          const active = s === status;
          return (
            <Link
              key={s}
              href={`/admin/candidates${queryString(s, 1)}`}
              className={`chip ${active ? "bg-ink text-white" : "bg-surface text-ink hover:bg-rule"}`}
            >
              {s}
            </Link>
          );
        })}
      </nav>

      {candidates.length === 0 ? (
        <p className="text-soft text-[14px]">No candidates match this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rule">
          <table className="w-full text-[13px]">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Feed</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Pri</th>
                <th className="px-3 py-2">Pub date</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="border-t border-rule">
                  <td className="px-3 py-2 max-w-md truncate" title={c.source_title}>
                    {c.source_title}
                  </td>
                  <td className="px-3 py-2 text-soft">
                    {c.source_feed ? feedById.get(c.source_feed) ?? "—" : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {c.priority_score ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px]">
                    {fmt(c.source_pub_date)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px]">{fmt(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between mt-6">
        {page > 1 ? (
          <Link
            href={`/admin/candidates${queryString(status, page - 1)}`}
            className="text-[13px] underline"
          >
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {page < totalPages && (
          <Link
            href={`/admin/candidates${queryString(status, page + 1)}`}
            className="text-[13px] underline ml-auto"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
