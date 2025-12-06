// This file defines the Database type used by Supabase client.
// It is based on the current SQL migrations in `supabase/migrations`.

export type Json = string | number | boolean | null | Record<string, Json | undefined> | Json[];

export interface Database {
  auth: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          created_at: string | null;
          updated_at: string | null;
          app_metadata: Json | null;
          user_metadata: Json | null;
          confirmation_sent_at: string | null;
          confirmation_token: string | null;
          recovery_sent_at: string | null;
          recovery_token: string | null;
          email_change_sent_at: string | null;
          new_email: string | null;
          email_change_token_new: string | null;
          email_change_token_current: string | null;
          phone_change_sent_at: string | null;
          new_phone: string | null;
          phone_change_token: string | null;
          is_super_admin: boolean | null;
          role: string | null;
          aud: string | null;
          email_confirmed_at: string | null;
          phone_confirmed_at: string | null;
          last_sign_in_at: string | null;
          raw_user_meta_data: Json | null;
          raw_app_meta_data: Json | null;
          reauthentication_sent_at: string | null;
          reauthentication_token: string | null;
          factors: Json | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          app_metadata?: Json | null;
          user_metadata?: Json | null;
          confirmation_sent_at?: string | null;
          confirmation_token?: string | null;
          recovery_sent_at?: string | null;
          recovery_token?: string | null;
          email_change_sent_at?: string | null;
          new_email?: string | null;
          email_change_token_new?: string | null;
          email_change_token_current?: string | null;
          phone_change_sent_at?: string | null;
          new_phone?: string | null;
          phone_change_token?: string | null;
          is_super_admin?: boolean | null;
          role?: string | null;
          aud?: string | null;
          email_confirmed_at?: string | null;
          phone_confirmed_at?: string | null;
          last_sign_in_at?: string | null;
          raw_user_meta_data?: Json | null;
          raw_app_meta_data?: Json | null;
          reauthentication_sent_at?: string | null;
          reauthentication_token?: string | null;
          factors?: Json | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          app_metadata?: Json | null;
          user_metadata?: Json | null;
          confirmation_sent_at?: string | null;
          confirmation_token?: string | null;
          recovery_sent_at?: string | null;
          recovery_token?: string | null;
          email_change_sent_at?: string | null;
          new_email?: string | null;
          email_change_token_new?: string | null;
          email_change_token_current?: string | null;
          phone_change_sent_at?: string | null;
          new_phone?: string | null;
          phone_change_token?: string | null;
          is_super_admin?: boolean | null;
          role?: string | null;
          aud?: string | null;
          email_confirmed_at?: string | null;
          phone_confirmed_at?: string | null;
          last_sign_in_at?: string | null;
          raw_user_meta_data?: Json | null;
          raw_app_meta_data?: Json | null;
          reauthentication_sent_at?: string | null;
          reauthentication_token?: string | null;
          factors?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      exercise_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          default_taxonomy_level: Database["public"]["Enums"]["taxonomy_level"] | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          default_taxonomy_level?: Database["public"]["Enums"]["taxonomy_level"] | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          default_taxonomy_level?: Database["public"]["Enums"]["taxonomy_level"] | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      review_session_feedback: {
        Row: {
          id: string;
          review_session_id: string;
          user_id: string;
          rating: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_session_id: string;
          user_id: string;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_session_id?: string;
          user_id?: string;
          rating?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_session_feedback_review_session_id_fkey";
            columns: ["review_session_id"];
            isOneToOne: false;
            referencedRelation: "review_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_session_feedback_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
        ];
      };
      review_sessions: {
        Row: {
          id: string;
          study_plan_id: string;
          user_id: string;
          exercise_template_id: string | null;
          exercise_label: string;
          review_date: string;
          taxonomy_level: Database["public"]["Enums"]["taxonomy_level"];
          status: Database["public"]["Enums"]["review_status"];
          is_ai_generated: boolean;
          is_completed: boolean;
          completed_at: string | null;
          status_changed_at: string;
          content: Json;
          metadata: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          study_plan_id: string;
          user_id: string;
          exercise_template_id?: string | null;
          exercise_label: string;
          review_date: string;
          taxonomy_level: Database["public"]["Enums"]["taxonomy_level"];
          status?: Database["public"]["Enums"]["review_status"];
          is_ai_generated?: boolean;
          is_completed?: boolean;
          completed_at?: string | null;
          status_changed_at?: string;
          content: Json;
          metadata?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          study_plan_id?: string;
          user_id?: string;
          exercise_template_id?: string | null;
          exercise_label?: string;
          review_date?: string;
          taxonomy_level?: Database["public"]["Enums"]["taxonomy_level"];
          status?: Database["public"]["Enums"]["review_status"];
          is_ai_generated?: boolean;
          is_completed?: boolean;
          completed_at?: string | null;
          status_changed_at?: string;
          content?: Json;
          metadata?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_sessions_exercise_template_id_fkey";
            columns: ["exercise_template_id"];
            isOneToOne: false;
            referencedRelation: "exercise_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_sessions_study_plan_id_fkey";
            columns: ["study_plan_id"];
            isOneToOne: false;
            referencedRelation: "study_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
        ];
      };
      study_plans: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          source_material: string;
          word_count: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          source_material: string;
          word_count: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          source_material?: string;
          word_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      review_status: "proposed" | "accepted" | "rejected";
      taxonomy_level: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
    };
    CompositeTypes: Record<never, never>;
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never;
