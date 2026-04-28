// supabase/functions/news-publish/types.ts

export interface PublishableArticle {
  id: string;
  slug: string;
  source_candidate_id: string | null;
  category: string;
}

export interface PublishError {
  article_id: string;
  stage: 'flip' | 'candidate' | 'indexnow' | 'revalidate' | 'unknown';
  message: string;
}

export interface PublishResult {
  published: number;
  indexnow_ok: number;
  revalidate_ok: number;
  errors: PublishError[];
}
