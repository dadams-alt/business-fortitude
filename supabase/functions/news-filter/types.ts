// supabase/functions/news-filter/types.ts

export type FilterDecision = 'approve' | 'reject' | 'duplicate';

export interface FilterAIResponse {
  decision: FilterDecision;
  reason: string;
  category: string;
  companies: string[];
  tickers: string[];
  executives: string[];
  sectors: string[];
  priority: number;
  duplicate_of_title?: string;
}

export interface CandidateRow {
  id: string;
  source_title: string;
  source_url: string | null;
  source_summary: string | null;
  source_pub_date: string | null;
  source_feed: string | null;
  status: string;
  priority_score: number | null;
}

export interface FilterError {
  candidate_id: string;
  message: string;
}

export interface FilterResult {
  processed: number;
  ready: number;
  rejected: number;
  duplicate: number;
  failed: number;
  errors: FilterError[];
}

export interface ContextRow {
  title: string;
  category: string;
}
