export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;
type MatchLifecycleStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "played"
  | "postponed"
  | "cancelled";

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          country: string | null;
          favorite_team_id: string | null;
          preferred_language: "en" | "ar";
          last_login_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          country?: string | null;
          favorite_team_id?: string | null;
          preferred_language?: "en" | "ar";
          last_login_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          name_en: string;
          name_ar: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [];
      };
      match_stages: {
        Row: {
          id: "GS" | "R32" | "R16" | "QF" | "SF" | "3P" | "F";
          name_en: string;
          name_ar: string;
          stage_order: number;
          is_knockout: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<Database["public"]["Tables"]["match_stages"]["Row"], "created_at" | "updated_at"> & {
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["match_stages"]["Insert"]>;
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          group_id: string;
          iso: string;
          name_en: string;
          name_ar: string;
          host: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          group_id: string;
          iso: string;
          name_en: string;
          name_ar: string;
          host?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          city_en: string;
          city_ar: string;
          country: "USA" | "Canada" | "Mexico";
          lat: number;
          lng: number;
          tz: string;
          capacity: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<Database["public"]["Tables"]["venues"]["Row"], "created_at" | "updated_at"> & {
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["venues"]["Insert"]>;
        Relationships: [];
      };
      matches: {
        Row: {
          match_n: number;
          round: "GS" | "R32" | "R16" | "QF" | "SF" | "3P" | "F";
          group_id: string | null;
          home_slot: string;
          away_slot: string;
          kickoff_at: Timestamp;
          venue_id: string;
          status: MatchLifecycleStatus;
          live_minute: number | null;
          last_synced_at: Timestamp | null;
          external_provider: string | null;
          external_match_id: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["matches"]["Row"],
          "created_at" | "updated_at" | "status" | "live_minute" | "last_synced_at" | "external_provider" | "external_match_id"
        > & {
          status?: MatchLifecycleStatus;
          live_minute?: number | null;
          last_synced_at?: Timestamp | null;
          external_provider?: string | null;
          external_match_id?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
        Relationships: [];
      };
      match_results: {
        Row: {
          match_n: number;
          home_goals: number;
          away_goals: number;
          home_score: number | null;
          away_score: number | null;
          halftime_home_score: number | null;
          halftime_away_score: number | null;
          extra_time_home_score: number | null;
          extra_time_away_score: number | null;
          penalty_home_score: number | null;
          penalty_away_score: number | null;
          winner_team_id: string | null;
          status: MatchLifecycleStatus;
          official: boolean;
          updated_by: string | null;
          live_minute: number | null;
          last_synced_at: Timestamp | null;
          external_provider: string | null;
          external_match_id: string | null;
          locked: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["match_results"]["Row"],
          | "created_at"
          | "updated_at"
          | "status"
          | "official"
          | "updated_by"
          | "home_score"
          | "away_score"
          | "halftime_home_score"
          | "halftime_away_score"
          | "extra_time_home_score"
          | "extra_time_away_score"
          | "penalty_home_score"
          | "penalty_away_score"
          | "live_minute"
          | "last_synced_at"
          | "external_provider"
          | "external_match_id"
          | "locked"
        > & {
          status?: MatchLifecycleStatus;
          official?: boolean;
          updated_by?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          halftime_home_score?: number | null;
          halftime_away_score?: number | null;
          extra_time_home_score?: number | null;
          extra_time_away_score?: number | null;
          penalty_home_score?: number | null;
          penalty_away_score?: number | null;
          live_minute?: number | null;
          last_synced_at?: Timestamp | null;
          external_provider?: string | null;
          external_match_id?: string | null;
          locked?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["match_results"]["Insert"]>;
        Relationships: [];
      };
      live_score_cache: {
        Row: {
          id: string;
          provider: string;
          cache_key: string;
          response: Json;
          status_code: number | null;
          error: string | null;
          fetched_at: Timestamp;
          expires_at: Timestamp;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["live_score_cache"]["Row"],
          "id" | "status_code" | "error" | "fetched_at" | "created_at" | "updated_at"
        > & {
          id?: string;
          status_code?: number | null;
          error?: string | null;
          fetched_at?: Timestamp;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["live_score_cache"]["Insert"]>;
        Relationships: [];
      };
      live_score_sync_logs: {
        Row: {
          id: string;
          provider: string;
          sync_type: "fixtures" | "live" | "results" | "standings" | "bracket" | "predictions" | "manual";
          status: "success" | "error" | "skipped" | "rate_limited";
          message: string | null;
          matches_checked: number;
          matches_updated: number;
          detail: Json | null;
          created_by: string | null;
          started_at: Timestamp;
          finished_at: Timestamp | null;
          created_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["live_score_sync_logs"]["Row"],
          "id" | "matches_checked" | "matches_updated" | "started_at" | "finished_at" | "created_at"
        > & {
          id?: string;
          matches_checked?: number;
          matches_updated?: number;
          started_at?: Timestamp;
          finished_at?: Timestamp | null;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["live_score_sync_logs"]["Insert"]>;
        Relationships: [];
      };
      match_events: {
        Row: {
          id: string;
          match_n: number;
          event_type:
            | "goal"
            | "own_goal"
            | "penalty_goal"
            | "penalty_miss"
            | "yellow_card"
            | "red_card"
            | "substitution"
            | "var"
            | "other";
          team_id: string | null;
          player_name: string | null;
          minute: number | null;
          extra_minute: number | null;
          detail: Json | null;
          source: string;
          external_event_id: string | null;
          created_by: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["match_events"]["Row"],
          "id" | "source" | "external_event_id" | "created_by" | "created_at" | "updated_at"
        > & {
          id?: string;
          source?: string;
          external_event_id?: string | null;
          created_by?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["match_events"]["Insert"]>;
        Relationships: [];
      };
      admin_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          detail: Json | null;
          created_at: Timestamp;
        };
        Insert: Omit<Database["public"]["Tables"]["admin_logs"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["admin_logs"]["Insert"]>;
        Relationships: [];
      };
      user_predictions: {
        Row: {
          id: string;
          user_id: string;
          match_n: number;
          home_goals: number;
          away_goals: number;
          winner_team_id: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<Database["public"]["Tables"]["user_predictions"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["user_predictions"]["Insert"]>;
        Relationships: [];
      };
      user_favorite_teams: {
        Row: {
          user_id: string;
          team_id: string;
          notifications_enabled: boolean;
          created_at: Timestamp;
        };
        Insert: {
          user_id: string;
          team_id: string;
          notifications_enabled?: boolean;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["user_favorite_teams"]["Insert"]>;
        Relationships: [];
      };
      user_saved_matches: {
        Row: {
          user_id: string;
          match_n: number;
          notifications_enabled: boolean;
          created_at: Timestamp;
        };
        Insert: {
          user_id: string;
          match_n: number;
          notifications_enabled?: boolean;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["user_saved_matches"]["Insert"]>;
        Relationships: [];
      };
      user_notification_preferences: {
        Row: {
          user_id: string;
          match_reminders: boolean;
          team_news: boolean;
          prediction_reminders: boolean;
          result_alerts: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_notification_preferences"]["Row"],
          | "match_reminders"
          | "team_news"
          | "prediction_reminders"
          | "result_alerts"
          | "created_at"
          | "updated_at"
        > & {
          match_reminders?: boolean;
          team_news?: boolean;
          prediction_reminders?: boolean;
          result_alerts?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["user_notification_preferences"]["Insert"]>;
        Relationships: [];
      };
      user_dashboard_stats: {
        Row: {
          user_id: string;
          matches_viewed: number;
          pages_viewed: number;
          time_spent_seconds: number;
          favorite_team_activity: number;
          prediction_submissions: number;
          calendar_exports: number;
          language_changes: number;
          updated_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_dashboard_stats"]["Row"],
          | "matches_viewed"
          | "pages_viewed"
          | "time_spent_seconds"
          | "favorite_team_activity"
          | "prediction_submissions"
          | "calendar_exports"
          | "language_changes"
          | "updated_at"
        > & {
          matches_viewed?: number;
          pages_viewed?: number;
          time_spent_seconds?: number;
          favorite_team_activity?: number;
          prediction_submissions?: number;
          calendar_exports?: number;
          language_changes?: number;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["user_dashboard_stats"]["Insert"]>;
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_key:
            | "first_prediction"
            | "ten_correct_predictions"
            | "group_stage_expert"
            | "knockout_expert"
            | "world_champion_predictor";
          progress: Json | null;
          unlocked_at: Timestamp;
          created_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_achievements"]["Row"],
          "id" | "unlocked_at" | "created_at"
        > & {
          id?: string;
          unlocked_at?: Timestamp;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["user_achievements"]["Insert"]>;
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string | null;
          scope: "all" | "match" | "team" | "teams" | "group" | "saved" | "favorites";
          match_n: number | null;
          team_id: string | null;
          group_id: string | null;
          title: string;
          locale: "en" | "ar";
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<Database["public"]["Tables"]["calendar_events"]["Row"], "id" | "created_at" | "updated_at" | "locale"> & {
          id?: string;
          locale?: "en" | "ar";
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["calendar_events"]["Insert"]>;
        Relationships: [];
      };
      bracket_nodes: {
        Row: {
          id: string;
          match_n: number;
          round: "R32" | "R16" | "QF" | "SF" | "3P" | "F";
          column_index: number;
          row_index: number;
          label: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<Database["public"]["Tables"]["bracket_nodes"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["bracket_nodes"]["Insert"]>;
        Relationships: [];
      };
      bracket_connections: {
        Row: {
          id: string;
          from_match_n: number;
          to_match_n: number;
          connection_type: "winner" | "loser";
          created_at: Timestamp;
        };
        Insert: Omit<Database["public"]["Tables"]["bracket_connections"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["bracket_connections"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type PublicSchema = Database["public"];
