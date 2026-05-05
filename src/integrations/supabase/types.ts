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
      billing_cases: {
        Row: {
          automation_status: Database["public"]["Enums"]["automation_status"]
          billing_pct: number | null
          candidate_name: string
          client_id: string
          company_id: string
          created_at: string
          ctc: number | null
          current_stage: number
          current_stage_day: number
          due_date: string | null
          gst_amount: number
          id: string
          job_title: string | null
          joining_date: string | null
          last_sent_at: string | null
          next_run_at: string | null
          pause_reason: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          performa_invoice_no: string | null
          responsible_user_id: string | null
          tax_invoice_no: string | null
          taxable_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          automation_status?: Database["public"]["Enums"]["automation_status"]
          billing_pct?: number | null
          candidate_name: string
          client_id: string
          company_id: string
          created_at?: string
          ctc?: number | null
          current_stage?: number
          current_stage_day?: number
          due_date?: string | null
          gst_amount?: number
          id?: string
          job_title?: string | null
          joining_date?: string | null
          last_sent_at?: string | null
          next_run_at?: string | null
          pause_reason?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          performa_invoice_no?: string | null
          responsible_user_id?: string | null
          tax_invoice_no?: string | null
          taxable_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          automation_status?: Database["public"]["Enums"]["automation_status"]
          billing_pct?: number | null
          candidate_name?: string
          client_id?: string
          company_id?: string
          created_at?: string
          ctc?: number | null
          current_stage?: number
          current_stage_day?: number
          due_date?: string | null
          gst_amount?: number
          id?: string
          job_title?: string | null
          joining_date?: string | null
          last_sent_at?: string | null
          next_run_at?: string | null
          pause_reason?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          performa_invoice_no?: string | null
          responsible_user_id?: string | null
          tax_invoice_no?: string | null
          taxable_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          company_id: string
          company_name: string
          contact_person: string | null
          created_at: string
          email: string | null
          gst_number: string | null
          id: string
          legal_name: string | null
          notes: string | null
          payment_due_days: number
          phone: string | null
          service_fee_pct: number | null
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          company_id: string
          company_name: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          legal_name?: string | null
          notes?: string | null
          payment_due_days?: number
          phone?: string | null
          service_fee_pct?: number | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string
          company_name?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          legal_name?: string | null
          notes?: string | null
          payment_due_days?: number
          phone?: string | null
          service_fee_pct?: number | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_workflow_steps: {
        Row: {
          day_offset: number
          id: string
          label: string
          stage: number
          template_key: string
        }
        Insert: {
          day_offset: number
          id?: string
          label: string
          stage: number
          template_key: string
        }
        Update: {
          day_offset?: number
          id?: string
          label?: string
          stage?: number
          template_key?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          brand_name: string | null
          created_at: string
          default_send_time_ist: string
          id: string
          logo_url: string | null
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          brand_name?: string | null
          created_at?: string
          default_send_time_ist?: string
          id?: string
          logo_url?: string | null
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          brand_name?: string | null
          created_at?: string
          default_send_time_ist?: string
          id?: string
          logo_url?: string | null
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      dispatch_logs: {
        Row: {
          billing_case_id: string | null
          body: string | null
          channel: Database["public"]["Enums"]["channel"]
          company_id: string
          created_at: string
          error: string | null
          id: string
          idempotency_key: string
          recipient: string | null
          stage: number | null
          stage_day: number | null
          status: Database["public"]["Enums"]["dispatch_status"]
          subject: string | null
          template_key: string | null
        }
        Insert: {
          billing_case_id?: string | null
          body?: string | null
          channel: Database["public"]["Enums"]["channel"]
          company_id: string
          created_at?: string
          error?: string | null
          id?: string
          idempotency_key: string
          recipient?: string | null
          stage?: number | null
          stage_day?: number | null
          status: Database["public"]["Enums"]["dispatch_status"]
          subject?: string | null
          template_key?: string | null
        }
        Update: {
          billing_case_id?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["channel"]
          company_id?: string
          created_at?: string
          error?: string | null
          id?: string
          idempotency_key?: string
          recipient?: string | null
          stage?: number | null
          stage_day?: number | null
          status?: Database["public"]["Enums"]["dispatch_status"]
          subject?: string | null
          template_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_logs_billing_case_id_fkey"
            columns: ["billing_case_id"]
            isOneToOne: false
            referencedRelation: "billing_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          billing_case_id: string
          company_id: string
          created_at: string
          id: string
          paid_at: string
          reference: string | null
        }
        Insert: {
          amount: number
          billing_case_id: string
          company_id: string
          created_at?: string
          id?: string
          paid_at?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          billing_case_id?: string
          company_id?: string
          created_at?: string
          id?: string
          paid_at?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_billing_case_id_fkey"
            columns: ["billing_case_id"]
            isOneToOne: false
            referencedRelation: "billing_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          active: boolean
          body: string
          category: string
          channel: Database["public"]["Enums"]["channel"]
          company_id: string
          created_at: string
          id: string
          subject: string | null
          template_key: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          category: string
          channel: Database["public"]["Enums"]["channel"]
          company_id: string
          created_at?: string
          id?: string
          subject?: string | null
          template_key: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          category?: string
          channel?: Database["public"]["Enums"]["channel"]
          company_id?: string
          created_at?: string
          id?: string
          subject?: string | null
          template_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "company_admin"
        | "manager"
        | "team_leader"
        | "recruiter"
        | "finance"
        | "collection"
        | "legal"
        | "viewer"
      automation_status:
        | "not_started"
        | "running"
        | "paused"
        | "stopped"
        | "completed"
      channel: "email" | "whatsapp" | "sms" | "internal"
      dispatch_status: "queued" | "sent" | "failed" | "skipped"
      payment_status:
        | "pending"
        | "partial"
        | "paid"
        | "cancelled"
        | "credit_note"
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
      app_role: [
        "super_admin",
        "company_admin",
        "manager",
        "team_leader",
        "recruiter",
        "finance",
        "collection",
        "legal",
        "viewer",
      ],
      automation_status: [
        "not_started",
        "running",
        "paused",
        "stopped",
        "completed",
      ],
      channel: ["email", "whatsapp", "sms", "internal"],
      dispatch_status: ["queued", "sent", "failed", "skipped"],
      payment_status: [
        "pending",
        "partial",
        "paid",
        "cancelled",
        "credit_note",
      ],
    },
  },
} as const
