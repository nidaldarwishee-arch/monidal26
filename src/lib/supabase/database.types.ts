export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;

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
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
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
          status: "scheduled" | "live" | "played" | "postponed" | "cancelled";
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<Database["public"]["Tables"]["matches"]["Row"], "created_at" | "updated_at" | "status"> & {
          status?: "scheduled" | "live" | "played" | "postponed" | "cancelled";
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
          winner_team_id: string | null;
          status: "live" | "played";
          official: boolean;
          updated_by: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Omit<Database["public"]["Tables"]["match_results"]["Row"], "created_at" | "updated_at" | "status" | "official" | "updated_by"> & {
          status?: "live" | "played";
          official?: boolean;
          updated_by?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["match_results"]["Insert"]>;
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
          created_at: Timestamp;
        };
        Insert: {
          user_id: string;
          team_id: string;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["user_favorite_teams"]["Insert"]>;
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
