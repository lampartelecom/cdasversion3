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
      blockchain_ledger: {
        Row: {
          block_hash: string
          block_index: number
          created_at: string
          created_by: string
          diploma_id: string
          event: string
          id: string
          pdf_hash: string
          prev_hash: string | null
          signature: string
        }
        Insert: {
          block_hash: string
          block_index?: number
          created_at?: string
          created_by: string
          diploma_id: string
          event?: string
          id?: string
          pdf_hash: string
          prev_hash?: string | null
          signature: string
        }
        Update: {
          block_hash?: string
          block_index?: number
          created_at?: string
          created_by?: string
          diploma_id?: string
          event?: string
          id?: string
          pdf_hash?: string
          prev_hash?: string | null
          signature?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_ledger_diploma_id_fkey"
            columns: ["diploma_id"]
            isOneToOne: false
            referencedRelation: "diplomas"
            referencedColumns: ["id"]
          },
        ]
      }
      diplomas: {
        Row: {
          attestation_number: string | null
          birth_date: string | null
          birth_place: string | null
          cni: string | null
          created_at: string
          credits: number | null
          diploma_type: string
          director_name: string | null
          grade_letter: string | null
          holder_email: string | null
          holder_name: string
          holder_user_id: string | null
          id: string
          institution: string
          issued_by: string
          jury_session: string | null
          matricule: string | null
          mention: string | null
          moyenne: number | null
          pdf_hash: string | null
          qr_token: string
          reference: string
          sexe: string | null
          signature: string | null
          specialization: string | null
          status: Database["public"]["Enums"]["diploma_status"]
          sub_reference: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          verification_fee: number
          year: string
        }
        Insert: {
          attestation_number?: string | null
          birth_date?: string | null
          birth_place?: string | null
          cni?: string | null
          created_at?: string
          credits?: number | null
          diploma_type: string
          director_name?: string | null
          grade_letter?: string | null
          holder_email?: string | null
          holder_name: string
          holder_user_id?: string | null
          id?: string
          institution: string
          issued_by: string
          jury_session?: string | null
          matricule?: string | null
          mention?: string | null
          moyenne?: number | null
          pdf_hash?: string | null
          qr_token?: string
          reference: string
          sexe?: string | null
          signature?: string | null
          specialization?: string | null
          status?: Database["public"]["Enums"]["diploma_status"]
          sub_reference?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          verification_fee?: number
          year: string
        }
        Update: {
          attestation_number?: string | null
          birth_date?: string | null
          birth_place?: string | null
          cni?: string | null
          created_at?: string
          credits?: number | null
          diploma_type?: string
          director_name?: string | null
          grade_letter?: string | null
          holder_email?: string | null
          holder_name?: string
          holder_user_id?: string | null
          id?: string
          institution?: string
          issued_by?: string
          jury_session?: string | null
          matricule?: string | null
          mention?: string | null
          moyenne?: number | null
          pdf_hash?: string | null
          qr_token?: string
          reference?: string
          sexe?: string | null
          signature?: string | null
          specialization?: string | null
          status?: Database["public"]["Enums"]["diploma_status"]
          sub_reference?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          verification_fee?: number
          year?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verifications: {
        Row: {
          amount: number
          created_at: string
          diploma_id: string | null
          id: string
          paid: boolean
          payment_method: string | null
          query_type: string
          query_value: string
          result: Database["public"]["Enums"]["verification_result"]
          verifier_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          diploma_id?: string | null
          id?: string
          paid?: boolean
          payment_method?: string | null
          query_type: string
          query_value: string
          result: Database["public"]["Enums"]["verification_result"]
          verifier_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          diploma_id?: string | null
          id?: string
          paid?: boolean
          payment_method?: string | null
          query_type?: string
          query_value?: string
          result?: Database["public"]["Enums"]["verification_result"]
          verifier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifications_diploma_id_fkey"
            columns: ["diploma_id"]
            isOneToOne: false
            referencedRelation: "diplomas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "verifier" | "university"
      diploma_status: "active" | "revoked" | "draft"
      verification_result: "authentic" | "invalid" | "not_found"
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
      app_role: ["student", "verifier", "university"],
      diploma_status: ["active", "revoked", "draft"],
      verification_result: ["authentic", "invalid", "not_found"],
    },
  },
} as const
