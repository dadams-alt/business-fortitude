// src/app/admin/articles/page.tsx
// Read-only paginated list of articles. Status filter, 50 per page,
// ordered by created_at DESC. Tags column shows the count of
// article_entities rows.

import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["all", "draft", "review", "published", "archived"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const PAGE_SIZE = 50;

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  author_name: string | null;
  status: string;
  published_at: string | null;
  hero_image_credit: string | null;
  body_md: string | null;
  created_at: string;
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
    draft: "bg-surface text-ink",
    review: "bg-lime text-ink",
    published: "bg-ink text-white",
    archived: "bg-white border border-rule text-soft",
  };
  return <span className={`chip ${classes[status] ?? "bg-surface"}`}>{status}</span>;
}

export default async function AdminArticlesPage({
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
    .from("articles")
    .select(
      "id, slug, title, category, author_name, status, published_at, hero_image_credit, body_md, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (status !== "all") query = query.eq("status", status);
  const { data, count } = await query;
  const articles = (data ?? []) as ArticleRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // Per-article tag counts in one round-trip.
  const articleIds = articles.map((a) => a.id);
  const { data: tagRows } = articleIds.length
    ? await supabase
        .from("article_entities")
        .select("article_id")
        .in("article_id", articleIds)
    : { data: [] as Array<{ article_id: string }> };
  const tagCount = new Map<string, number>();
  for (const r of tagRows ?? []) {
    tagCount.set(r.article_id, (tagCount.get(r.article_id) ?? 0) + 1);
  }

  const queryString = (s: StatusFilter, p: number) => {
    const u = new URLSearchParams();
    if (s !== "all") u.set("status", s);
    if (p > 1) u.set("page", String(p));
    return u.toString() ? `?${u}` : "";
  };

  return (
    <div>
      <h1 className="display text-[36px] mb-2">Articles</h1>
      <p className="text-soft text-[14px] mb-8">
        {count ?? 0} total · page {page} of {totalPages}
      </p>

      <nav className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((s) => {
          const active = s === status;
          return (
            <Link
              key={s}
              href={`/admin/articles${queryString(s, 1)}`}
              className={`chip ${active ? "bg-ink text-white" : "bg-surface text-ink hover:bg-rule"}`}
            >
              {s}
            </Link>
          );
        })}
      </nav>

      {articles.length === 0 ? (
        <p className="text-soft text-[14px]">No articles match this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-rule">
          <table className="w-full text-[13px]">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Author</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Body chars</th>
                <th className="px-3 py-2 text-right">Tags</th>
                <th className="px-3 py-2">Hero credit</th>
                <th className="px-3 py-2">Published</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id} className="border-t border-rule">
                  <td className="px-3 py-2 max-w-md truncate" title={a.title}>
                    <Link
                      href={`/article/${a.slug}`}
                      className="hover:text-accent"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px]">{a.category}</td>
                  <td className="px-3 py-2 text-soft">{a.author_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={a.status} />
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {a.body_md?.length ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {tagCount.get(a.id) ?? 0}
                  </td>
                  <td className="px-3 py-2 text-soft truncate max-w-[180px]">
                    {a.hero_image_credit ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px]">
                    {fmt(a.published_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between mt-6">
        {page > 1 ? (
          <Link
            href={`/admin/articles${queryString(status, page - 1)}`}
            className="text-[13px] underline"
          >
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {page < totalPages && (
          <Link
            href={`/admin/articles${queryString(status, page + 1)}`}
            className="text-[13px] underline ml-auto"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
