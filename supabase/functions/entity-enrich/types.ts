// supabase/functions/entity-enrich/types.ts

export interface CompanyRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sector_ids: string[] | null;
}

export interface ExecutiveRow {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  current_company_id: string | null;
  company_name?: string | null;
}

export interface CompanyAIResponse {
  description: string;
}

export interface ExecutiveAIResponse {
  bio: string;
}

export interface EnrichError {
  slug: string;
  kind: 'company' | 'executive' | 'photo';
  message: string;
}

export interface EnrichResult {
  companies_enriched: number;
  bios_enriched: number;
  photos_found: number;
  compliance_reverts: number;
  companies_remaining: number;
  bios_remaining: number;
  photos_remaining: number;
  errors: EnrichError[];
}
