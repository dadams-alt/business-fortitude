// scripts/legacy-import/parse-csvs.ts
// Shared CSV parsing for the legacy Lovable export. The CSVs use
// semicolon delimiters and quote multi-line HTML content per RFC 4180.

import { parse } from 'jsr:@std/csv@1.0.3/parse';

const LEGACY_DIR = new URL('../../legacy-content/', import.meta.url);

export interface LegacyCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: string;
  created_at: string;
}

export interface LegacyAuthor {
  id: string;
  name: string;
  slug: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  job_title: string;
  twitter_url: string;
  linkedin_url: string;
  website_url: string;
}

export interface LegacyPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  feature_image_url: string;
  feature_image_alt: string;
  category_id: string;
  author_id: string;
  status: string;
  published_at: string;
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
  key_points: string;
  key_takeaways: string;
  discussion_question: string;
  faq: string;
  fts: string;
  is_editors_pick: string;
}

async function readCsv<T>(filename: string): Promise<T[]> {
  const text = await Deno.readTextFile(new URL(filename, LEGACY_DIR));
  const rows = parse(text, { separator: ';', skipFirstRow: true }) as Record<
    string,
    string
  >[];
  return rows as T[];
}

export async function loadCategories(): Promise<LegacyCategory[]> {
  return readCsv<LegacyCategory>('categories.csv');
}

export async function loadAuthors(): Promise<LegacyAuthor[]> {
  return readCsv<LegacyAuthor>('authors.csv');
}

export async function loadPosts(): Promise<LegacyPost[]> {
  return readCsv<LegacyPost>('posts.csv');
}
