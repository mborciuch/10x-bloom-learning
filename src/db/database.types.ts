export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
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
      ai_generation_log: {
        Row: {
          created_at: string;
          error_message: string | null;
          id: string;
          model_name: string | null;
          parameters: Json;
          requested_at: string;
          response: Json | null;
          state: Database["public"]["Enums"]["ai_generation_state"];
          study_plan_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          model_name?: string | null;
          parameters: Json;
          requested_at?: string;
          response?: Json | null;
          state?: Database["public"]["Enums"]["ai_generation_state"];
          study_plan_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          id?: string;
          model_name?: string | null;
          parameters?: Json;
          requested_at?: string;
          response?: Json | null;
          state?: Database["public"]["Enums"]["ai_generation_state"];
          study_plan_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_generation_log_study_plan_id_fkey";
            columns: ["study_plan_id"];
            isOneToOne: false;
            referencedRelation: "study_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generation_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
        ];
      };
      exercise_templates: {
        Row: {
          created_at: string;
          created_by: string | null;
          default_taxonomy_level: Database["public"]["Enums"]["taxonomy_level"] | null;
          description: string | null;
          id: string;
          is_active: boolean;
          is_predefined: boolean;
          metadata: Json;
          name: string;
          prompt: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          default_taxonomy_level?: Database["public"]["Enums"]["taxonomy_level"] | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_predefined?: boolean;
          metadata?: Json;
          name: string;
          prompt: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          default_taxonomy_level?: Database["public"]["Enums"]["taxonomy_level"] | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_predefined?: boolean;
          metadata?: Json;
          name?: string;
          prompt?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_templates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema: "auth";
          },
        ];
      };
      review_session_feedback: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          rating: number | null;
          review_session_id: string;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating?: number | null;
          review_session_id: string;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating?: number | null;
          review_session_id?: string;
          user_id?: string;
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
          ai_generation_log_id: string | null;
          completed_at: string | null;
          content: Json;
          created_at: string;
          exercise_label: string;
          exercise_template_id: string | null;
          id: string;
          is_ai_generated: boolean;
          is_completed: boolean;
          notes: string | null;
          review_date: string;
          status: Database["public"]["Enums"]["review_status"];
          status_changed_at: string;
          study_plan_id: string;
          taxonomy_level: Database["public"]["Enums"]["taxonomy_level"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_generation_log_id?: string | null;
          completed_at?: string | null;
          content: Json;
          created_at?: string;
          exercise_label: string;
          exercise_template_id?: string | null;
          id?: string;
          is_ai_generated?: boolean;
          is_completed?: boolean;
          notes?: string | null;
          review_date: string;
          status?: Database["public"]["Enums"]["review_status"];
          status_changed_at?: string;
          study_plan_id: string;
          taxonomy_level: Database["public"]["Enums"]["taxonomy_level"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_generation_log_id?: string | null;
          completed_at?: string | null;
          content?: Json;
          created_at?: string;
          exercise_label?: string;
          exercise_template_id?: string | null;
          id?: string;
          is_ai_generated?: boolean;
          is_completed?: boolean;
          notes?: string | null;
          review_date?: string;
          status?: Database["public"]["Enums"]["review_status"];
          status_changed_at?: string;
          study_plan_id?: string;
          taxonomy_level?: Database["public"]["Enums"]["taxonomy_level"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_sessions_ai_generation_log_id_fkey";
            columns: ["ai_generation_log_id"];
            isOneToOne: false;
            referencedRelation: "ai_generation_log";
            referencedColumns: ["id"];
          },
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
          created_at: string;
          id: string;
          source_material: string;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
          word_count: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          source_material: string;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
          word_count: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          source_material?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          word_count?: number;
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
      ai_generation_state: "pending" | "succeeded" | "failed";
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
    ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
