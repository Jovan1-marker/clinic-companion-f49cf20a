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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          id: string
          message: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          title?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          admin_comment: string | null
          created_at: string
          description: string | null
          grade: string | null
          id: string
          lrn: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_type: string
          status: string
          student_id: string | null
          student_name: string | null
          updated_at: string
        }
        Insert: {
          admin_comment?: string | null
          created_at?: string
          description?: string | null
          grade?: string | null
          id?: string
          lrn?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type: string
          status?: string
          student_id?: string | null
          student_name?: string | null
          updated_at?: string
        }
        Update: {
          admin_comment?: string | null
          created_at?: string
          description?: string | null
          grade?: string | null
          id?: string
          lrn?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type?: string
          status?: string
          student_id?: string | null
          student_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_role: string
          student_id: string | null
          student_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_role?: string
          student_id?: string | null
          student_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_role?: string
          student_id?: string | null
          student_name?: string | null
        }
        Relationships: []
      }
      finished_appointments: {
        Row: {
          admin_comment: string | null
          created_at: string
          description: string | null
          finished_at: string
          grade: string | null
          id: string
          lrn: string | null
          original_id: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_type: string | null
          student_id: string | null
          student_name: string | null
        }
        Insert: {
          admin_comment?: string | null
          created_at?: string
          description?: string | null
          finished_at?: string
          grade?: string | null
          id?: string
          lrn?: string | null
          original_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type?: string | null
          student_id?: string | null
          student_name?: string | null
        }
        Update: {
          admin_comment?: string | null
          created_at?: string
          description?: string | null
          finished_at?: string
          grade?: string | null
          id?: string
          lrn?: string | null
          original_id?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_type?: string | null
          student_id?: string | null
          student_name?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          bmi_status: string | null
          clinic_exposure: string | null
          contact_no: string | null
          created_at: string
          email: string | null
          full_name: string
          grade: string | null
          height: string | null
          home_address: string | null
          id: string
          lrn: string | null
          medical_history: string | null
          updated_at: string
          weight: string | null
        }
        Insert: {
          bmi_status?: string | null
          clinic_exposure?: string | null
          contact_no?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          grade?: string | null
          height?: string | null
          home_address?: string | null
          id?: string
          lrn?: string | null
          medical_history?: string | null
          updated_at?: string
          weight?: string | null
        }
        Update: {
          bmi_status?: string | null
          clinic_exposure?: string | null
          contact_no?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          grade?: string | null
          height?: string | null
          home_address?: string | null
          id?: string
          lrn?: string | null
          medical_history?: string | null
          updated_at?: string
          weight?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          contact_no: string | null
          created_at: string
          email: string | null
          full_name: string | null
          grade: string | null
          home_address: string | null
          id: string
          lrn: string | null
          role: string
          section: string | null
          strand: string | null
          updated_at: string
        }
        Insert: {
          contact_no?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          grade?: string | null
          home_address?: string | null
          id: string
          lrn?: string | null
          role?: string
          section?: string | null
          strand?: string | null
          updated_at?: string
        }
        Update: {
          contact_no?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          grade?: string | null
          home_address?: string | null
          id?: string
          lrn?: string | null
          role?: string
          section?: string | null
          strand?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      records: {
        Row: {
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
