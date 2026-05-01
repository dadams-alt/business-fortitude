export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      article_entities: {
        Row: {
          article_id: string
          entity_id: string
          entity_type: string
        }
        Insert: {
          article_id: string
          entity_id: string
          entity_type: string
        }
        Update: {
          article_id?: string
          entity_id?: string
          entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_entities_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_name: string | null
          author_slug: string | null
          body_md: string
          category: string
          created_at: string
          hero_image_alt: string | null
          hero_image_credit: string | null
          hero_image_url: string | null
          id: string
          lead: string | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          source_candidate_id: string | null
          status: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          author_slug?: string | null
          body_md: string
          category: string
          created_at?: string
          hero_image_alt?: string | null
          hero_image_credit?: string | null
          hero_image_url?: string | null
          id?: string
          lead?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          source_candidate_id?: string | null
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          author_slug?: string | null
          body_md?: string
          category?: string
          created_at?: string
          hero_image_alt?: string | null
          hero_image_credit?: string | null
          hero_image_url?: string | null
          id?: string
          lead?: string | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          source_candidate_id?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_source_candidate_id_fkey"
            columns: ["source_candidate_id"]
            isOneToOne: false
            referencedRelation: "news_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          aliases: string[]
          created_at: string
          description: string | null
          founded_year: number | null
          hq_country: string | null
          id: string
          is_public: boolean
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          primary_ticker_id: string | null
          sector_ids: string[]
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          description?: string | null
          founded_year?: number | null
          hq_country?: string | null
          id?: string
          is_public?: boolean
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          primary_ticker_id?: string | null
          sector_ids?: string[]
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          aliases?: string[]
          created_at?: string
          description?: string | null
          founded_year?: number | null
          hq_country?: string | null
          id?: string
          is_public?: boolean
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          primary_ticker_id?: string | null
          sector_ids?: string[]
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_primary_ticker_id_fkey"
            columns: ["primary_ticker_id"]
            isOneToOne: false
            referencedRelation: "tickers"
            referencedColumns: ["id"]
          },
        ]
      }
      executives: {
        Row: {
          aliases: string[]
          bio: string | null
          created_at: string
          current_company_id: string | null
          id: string
          linkedin_url: string | null
          name: string
          photo_lookup_attempted_at: string | null
          photo_url: string | null
          role: string | null
          slug: string
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          bio?: string | null
          created_at?: string
          current_company_id?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          photo_lookup_attempted_at?: string | null
          photo_url?: string | null
          role?: string | null
          slug: string
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          bio?: string | null
          created_at?: string
          current_company_id?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          photo_lookup_attempted_at?: string | null
          photo_url?: string | null
          role?: string | null
          slug?: string
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executives_current_company_id_fkey"
            columns: ["current_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      news_candidates: {
        Row: {
          article_id: string | null
          claimed_at: string | null
          claimed_by: string | null
          content_hash: string | null
          created_at: string
          full_text: string | null
          id: string
          priority_score: number | null
          rejection_reason: string | null
          source_author: string | null
          source_feed: string | null
          source_pub_date: string | null
          source_summary: string | null
          source_title: string
          source_url: string | null
          status: string
          suggested_category: string | null
          suggested_companies: string[]
          suggested_executives: string[]
          suggested_sectors: string[]
          suggested_tickers: string[]
        }
        Insert: {
          article_id?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          content_hash?: string | null
          created_at?: string
          full_text?: string | null
          id?: string
          priority_score?: number | null
          rejection_reason?: string | null
          source_author?: string | null
          source_feed?: string | null
          source_pub_date?: string | null
          source_summary?: string | null
          source_title: string
          source_url?: string | null
          status?: string
          suggested_category?: string | null
          suggested_companies?: string[]
          suggested_executives?: string[]
          suggested_sectors?: string[]
          suggested_tickers?: string[]
        }
        Update: {
          article_id?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          content_hash?: string | null
          created_at?: string
          full_text?: string | null
          id?: string
          priority_score?: number | null
          rejection_reason?: string | null
          source_author?: string | null
          source_feed?: string | null
          source_pub_date?: string | null
          source_summary?: string | null
          source_title?: string
          source_url?: string | null
          status?: string
          suggested_category?: string | null
          suggested_companies?: string[]
          suggested_executives?: string[]
          suggested_sectors?: string[]
          suggested_tickers?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "news_candidates_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_candidates_source_feed_fkey"
            columns: ["source_feed"]
            isOneToOne: false
            referencedRelation: "rss_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmed: boolean
          email: string
          id: string
          source: string
          subscribed_at: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          user_agent: string | null
        }
        Insert: {
          confirmed?: boolean
          email: string
          id?: string
          source?: string
          subscribed_at?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Update: {
          confirmed?: boolean
          email?: string
          id?: string
          source?: string
          subscribed_at?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      rss_feeds: {
        Row: {
          category: string | null
          consecutive_failure_count: number
          created_at: string
          fetch_interval_minutes: number
          homepage_url: string | null
          id: string
          is_active: boolean
          last_error: string | null
          last_fetched_at: string | null
          last_status_code: number | null
          name: string
          source_name: string
          updated_at: string
          url: string
          user_agent: string | null
        }
        Insert: {
          category?: string | null
          consecutive_failure_count?: number
          created_at?: string
          fetch_interval_minutes?: number
          homepage_url?: string | null
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_fetched_at?: string | null
          last_status_code?: number | null
          name: string
          source_name: string
          updated_at?: string
          url: string
          user_agent?: string | null
        }
        Update: {
          category?: string | null
          consecutive_failure_count?: number
          created_at?: string
          fetch_interval_minutes?: number
          homepage_url?: string | null
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_fetched_at?: string | null
          last_status_code?: number | null
          name?: string
          source_name?: string
          updated_at?: string
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      sectors: {
        Row: {
          aliases: string[]
          created_at: string
          description: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_sector_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          description?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_sector_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          description?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_sector_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectors_parent_sector_id_fkey"
            columns: ["parent_sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      tickers: {
        Row: {
          aliases: string[]
          company_id: string | null
          created_at: string
          currency: string | null
          exchange: string
          id: string
          is_active: boolean
          name: string
          slug: string
          symbol: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          company_id?: string | null
          created_at?: string
          currency?: string | null
          exchange: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          symbol: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          company_id?: string | null
          created_at?: string
          currency?: string | null
          exchange?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      admin_recent_cron_runs: {
        Args: { p_limit?: number }
        Returns: {
          end_time: string
          jobid: number
          jobname: string
          return_message: string
          start_time: string
          status: string
        }[]
      }
      admin_recent_http_responses: {
        Args: { p_limit?: number }
        Returns: {
          content: string
          content_type: string
          created: string
          id: number
          status_code: number
        }[]
      }
      call_edge_fn: { Args: { fn_name: string }; Returns: number }
      claim_news_candidates: {
        Args: { batch_size: number; worker_id: string }
        Returns: {
          article_id: string | null
          claimed_at: string | null
          claimed_by: string | null
          content_hash: string | null
          created_at: string
          full_text: string | null
          id: string
          priority_score: number | null
          rejection_reason: string | null
          source_author: string | null
          source_feed: string | null
          source_pub_date: string | null
          source_summary: string | null
          source_title: string
          source_url: string | null
          status: string
          suggested_category: string | null
          suggested_companies: string[]
          suggested_executives: string[]
          suggested_sectors: string[]
          suggested_tickers: string[]
        }[]
        SetofOptions: {
          from: "*"
          to: "news_candidates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          check_user_id: string
        }
        Returns: boolean
      }
      release_stale_writing_candidates: {
        Args: { max_age_minutes?: number }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
