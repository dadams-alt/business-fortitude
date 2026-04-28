// supabase/functions/news-images/types.ts

export interface ArticleNeedingImage {
  id: string;
  title: string;
  lead: string | null;
  category: string;
}

export interface ImagePromptResponse {
  image_prompt: string;
  alt_text: string;
}

export interface ImageError {
  article_id: string;
  stage: 'prompt' | 'gemini' | 'process' | 'upload' | 'update' | 'unknown';
  message: string;
}

export interface ImageResult {
  processed: number;
  generated: number;   // image came from Gemini
  fallback: number;    // SVG placeholder used
  failed: number;
  errors: ImageError[];
}
