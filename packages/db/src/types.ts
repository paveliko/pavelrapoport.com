// Auto-generated stub matching migration 20260408000000_initial_schema.sql
// Regenerate from live schema: pnpm generate-types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          locale: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      canvas_sessions: {
        Row: {
          id: string;
          lead_name: string | null;
          lead_email: string | null;
          lead_company: string | null;
          language: string;
          source: string;
          domain_graph: Json;
          messages: Json;
          summary: string | null;
          fit_score: number | null;
          fit_reason: string | null;
          status: string;
          tokens_used: number;
          cost_usd: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_name?: string | null;
          lead_email?: string | null;
          lead_company?: string | null;
          language?: string;
          source?: string;
          domain_graph?: Json;
          messages?: Json;
          summary?: string | null;
          fit_score?: number | null;
          fit_reason?: string | null;
          status?: string;
          tokens_used?: number;
          cost_usd?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_name?: string | null;
          lead_email?: string | null;
          lead_company?: string | null;
          language?: string;
          source?: string;
          domain_graph?: Json;
          messages?: Json;
          summary?: string | null;
          fit_score?: number | null;
          fit_reason?: string | null;
          status?: string;
          tokens_used?: number;
          cost_usd?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string | null;
          canvas_session_id: string | null;
          name: string;
          email: string | null;
          company: string | null;
          source: string;
          status: string;
          fit_score: number | null;
          budget_range: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          canvas_session_id?: string | null;
          name: string;
          email?: string | null;
          company?: string | null;
          source?: string;
          status?: string;
          fit_score?: number | null;
          budget_range?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          canvas_session_id?: string | null;
          name?: string;
          email?: string | null;
          company?: string | null;
          source?: string;
          status?: string;
          fit_score?: number | null;
          budget_range?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      whatsapp_messages: {
        Row: {
          id: string;
          phone_number: string;
          sender_name: string | null;
          direction: string;
          message_type: string;
          content: string;
          raw_transcription: string | null;
          agent_action: string | null;
          agent_metadata: Json | null;
          wa_message_id: string | null;
          tokens_used: number | null;
          latency_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone_number: string;
          sender_name?: string | null;
          direction: string;
          message_type?: string;
          content: string;
          raw_transcription?: string | null;
          agent_action?: string | null;
          agent_metadata?: Json | null;
          wa_message_id?: string | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string;
          sender_name?: string | null;
          direction?: string;
          message_type?: string;
          content?: string;
          raw_transcription?: string | null;
          agent_action?: string | null;
          agent_metadata?: Json | null;
          wa_message_id?: string | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
