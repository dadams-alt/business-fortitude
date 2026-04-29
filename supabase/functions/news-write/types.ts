// supabase/functions/news-write/types.ts

export interface ClaimedCandidate {
  id: string;
  source_title: string;
  source_url: string | null;
  source_summary: string | null;
  source_pub_date: string | null;
  suggested_category: string | null;
  // All four suggested_* arrays are NOT NULL DEFAULT '{}' in schema 004,
  // but we type them defensively for postgrest's deserialiser.
  suggested_companies: string[] | null;
  suggested_tickers: string[] | null;
  suggested_executives: string[] | null;
  suggested_sectors: string[] | null;
  priority_score: number | null;
}

export interface BriefAIResponse {
  core_story: string;
  why_it_matters: string;
  editorial_angle: string;
  context_needed: string | string[];
  target_word_count: number;
  suggested_h2_sections: string[];
  named_entities?: {
    companies?: string[];
    tickers?: string[];
    executives?: string[];
    sectors?: string[];
  };
}

export interface ArticleAIResponse {
  title: string;
  subtitle: string;
  lead: string;
  body_md: string;
  meta_title: string;
  meta_description: string;
}

export interface WriteError {
  candidate_id: string;
  stage: 'brief' | 'article' | 'compliance' | 'insert' | 'unknown';
  message: string;
}

export interface WriteResult {
  drafted: number;
  // Total article_entities rows actually inserted across the run.
  // Sum across all candidates processed; conflicts (rare — see notes
  // in index.ts) reduce this below the attempted count.
  entity_links: number;
  errors: WriteError[];
}
