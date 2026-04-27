// supabase/functions/news-ingest-rss/types.ts
// Shapes used inside this function only. Matching column names live
// in news_candidates / rss_feeds — see migration 003 / 004.

export interface FeedItem {
  title: string;
  link: string | null;
  summary: string | null;
  pubDate: Date | null;
  author: string | null;
  guid: string | null;
}

export interface ParsedFeed {
  items: FeedItem[];
}

export interface IngestError {
  feed_id: string;
  feed_name: string;
  message: string;
}

export interface IngestResult {
  feeds_processed: number;
  feeds_skipped: number;
  items_inserted: number;
  items_deduped: number;
  errors: IngestError[];
}

export interface FeedRow {
  id: string;
  name: string;
  url: string;
  fetch_interval_minutes: number;
  last_fetched_at: string | null;
  consecutive_failure_count: number;
  is_active: boolean;
}
