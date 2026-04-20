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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          message_type: string
          twilio_sid: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          message_type?: string
          twilio_sid?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          message_type?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context_summary: string | null
          created_at: string
          id: string
          last_message_at: string | null
          lead_id: string | null
          next_follow_up_at: string | null
          stage: string
          status: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          context_summary?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          next_follow_up_at?: string | null
          stage?: string
          status?: string
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          context_summary?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          next_follow_up_at?: string | null
          stage?: string
          status?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_schedule: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message_content: string | null
          scheduled_at: string
          status: string
          type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message_content?: string | null
          scheduled_at: string
          status?: string
          type?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message_content?: string | null
          scheduled_at?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_schedule_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          fal_request_id: string | null
          id: string
          input_image_url: string | null
          order_id: string
          output_url: string | null
          prompt: string | null
          status: string
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          fal_request_id?: string | null
          id?: string
          input_image_url?: string | null
          order_id: string
          output_url?: string | null
          prompt?: string | null
          status?: string
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          fal_request_id?: string | null
          id?: string
          input_image_url?: string | null
          order_id?: string
          output_url?: string | null
          prompt?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_public"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          source: string | null
          track: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          source?: string | null
          track?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          source?: string | null
          track?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          brand_description: string | null
          brand_name: string
          campaign_goal: string | null
          created_at: string
          customer_name: string | null
          email: string
          id: string
          model_type: string
          photos_qty: number
          piece_description: string | null
          status: string
          total_price: number
          updated_at: string
          videos_qty: number
          whatsapp: string | null
        }
        Insert: {
          brand_description?: string | null
          brand_name: string
          campaign_goal?: string | null
          created_at?: string
          customer_name?: string | null
          email: string
          id?: string
          model_type?: string
          photos_qty?: number
          piece_description?: string | null
          status?: string
          total_price?: number
          updated_at?: string
          videos_qty?: number
          whatsapp?: string | null
        }
        Update: {
          brand_description?: string | null
          brand_name?: string
          campaign_goal?: string | null
          created_at?: string
          customer_name?: string | null
          email?: string
          id?: string
          model_type?: string
          photos_qty?: number
          piece_description?: string | null
          status?: string
          total_price?: number
          updated_at?: string
          videos_qty?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      orders_public: {
        Row: {
          brand_name: string | null
          created_at: string | null
          id: string | null
          model_type: string | null
          photos_qty: number | null
          status: string | null
          videos_qty: number | null
        }
        Insert: {
          brand_name?: string | null
          created_at?: string | null
          id?: string | null
          model_type?: string | null
          photos_qty?: number | null
          status?: string | null
          videos_qty?: number | null
        }
        Update: {
          brand_name?: string | null
          created_at?: string | null
          id?: string | null
          model_type?: string | null
          photos_qty?: number | null
          status?: string | null
          videos_qty?: number | null
        }
        Relationships: []
      }
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
