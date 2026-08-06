// ─────────────────────────────────────────────────────────────────────
// Database types for the `public` schema.
//
// HAND-WRITTEN. The Supabase CLI is not installed in this environment, so
// these are authored by hand to match supabase/migrations/ exactly
// (090001 tables/enums, 090005 + 090006 functions). They follow the shape
// `supabase gen types typescript` emits, so regenerating later is a drop-in
// replacement. If you change a migration, update this file in lockstep.
// ─────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'owner' | 'admin' | 'member';
export type LeadStatus = 'pending' | 'contacted';
export type LeadOutcome = 'interested' | 'not_interested';
export type LeadSource = 'manual' | 'website_callback' | 'website_query' | 'import';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: AppRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: AppRole;
          created_at?: string;
        };
        Relationships: [];
      };
      allowed_emails: {
        Row: {
          email: string;
          role: AppRole;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          email: string;
          role?: AppRole;
          invited_by?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          role?: AppRole;
          invited_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          brand_name: string;
          instagram_username: string | null;
          address: string | null;
          lead_found_on: string;
          status: LeadStatus;
          outcome: LeadOutcome | null;
          source: LeadSource;
          notes: string | null;
          owner_id: string | null;
          created_by: string | null;
          contacted_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          brand_name: string;
          instagram_username?: string | null;
          address?: string | null;
          lead_found_on?: string;
          status?: LeadStatus;
          outcome?: LeadOutcome | null;
          source?: LeadSource;
          notes?: string | null;
          owner_id?: string | null;
          created_by?: string | null;
          contacted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          brand_name?: string;
          instagram_username?: string | null;
          address?: string | null;
          lead_found_on?: string;
          status?: LeadStatus;
          outcome?: LeadOutcome | null;
          source?: LeadSource;
          notes?: string | null;
          owner_id?: string | null;
          created_by?: string | null;
          contacted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      lead_contacts: {
        Row: {
          id: string;
          lead_id: string;
          name: string;
          designation: string | null;
          email: string | null;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          name: string;
          designation?: string | null;
          email?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          name?: string;
          designation?: string | null;
          email?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_contacts_lead_id_fkey';
            columns: ['lead_id'];
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
        ];
      };
      lead_phones: {
        Row: {
          id: string;
          lead_id: string;
          contact_id: string | null;
          phone_e164: string;
          label: string | null;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          contact_id?: string | null;
          phone_e164: string;
          label?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          contact_id?: string | null;
          phone_e164?: string;
          label?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_phones_lead_id_fkey';
            columns: ['lead_id'];
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_phones_contact_id_fkey';
            columns: ['contact_id'];
            referencedRelation: 'lead_contacts';
            referencedColumns: ['id'];
          },
        ];
      };
      lead_activities: {
        Row: {
          id: string;
          lead_id: string;
          actor_id: string | null;
          kind: string;
          detail: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          actor_id?: string | null;
          kind: string;
          detail?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          actor_id?: string | null;
          kind?: string;
          detail?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_activities_lead_id_fkey';
            columns: ['lead_id'];
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
        ];
      };
      inbound_enquiries: {
        Row: {
          id: string;
          kind: string;
          name: string;
          phone: string | null;
          email: string | null;
          best_time: string | null;
          message: string | null;
          user_agent: string | null;
          converted_lead_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kind: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          best_time?: string | null;
          message?: string | null;
          user_agent?: string | null;
          converted_lead_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kind?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          best_time?: string | null;
          message?: string | null;
          user_agent?: string | null;
          converted_lead_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      keepalive: {
        Row: {
          id: number;
          pinged_at: string;
          source: string | null;
        };
        Insert: {
          id?: number;
          pinged_at?: string;
          source?: string | null;
        };
        Update: {
          id?: number;
          pinged_at?: string;
          source?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      // 090006 — SECURITY DEFINER heartbeat, execute granted to anon only.
      ping_keepalive: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      // 090005 — atomic lead + contacts + phones writer.
      create_lead_with_contacts: {
        Args: { payload: Json };
        Returns: string;
      };
      // 090008 — replace-children editor (SECURITY DEFINER, re-checks is_staff).
      update_lead_with_contacts: {
        Args: { p_lead_id: string; payload: Json };
        Returns: undefined;
      };
      // 090003 — role helpers (SECURITY DEFINER).
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      current_app_role: {
        Args: Record<PropertyKey, never>;
        Returns: AppRole;
      };
    };
    Enums: {
      app_role: AppRole;
      lead_status: LeadStatus;
      lead_outcome: LeadOutcome;
      lead_source: LeadSource;
    };
    CompositeTypes: Record<never, never>;
  };
}

// Convenience aliases used across the CRM.
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
