export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_member_id: string | null
          actor_name: string | null
          changed_fields: Json | null
          created_at: string | null
          id: string
          note: string | null
          record_id: string
          snapshot: Json | null
          table_name: string
        }
        Insert: {
          action: string
          actor_member_id?: string | null
          actor_name?: string | null
          changed_fields?: Json | null
          created_at?: string | null
          id?: string
          note?: string | null
          record_id: string
          snapshot?: Json | null
          table_name: string
        }
        Update: {
          action?: string
          actor_member_id?: string | null
          actor_name?: string | null
          changed_fields?: Json | null
          created_at?: string | null
          id?: string
          note?: string | null
          record_id?: string
          snapshot?: Json | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_member_id_fkey'
            columns: ['actor_member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
      clients: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          is_contact: boolean
          name: string
          normalized_name: string | null
          note: string | null
          updated_at: string | null
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_contact?: boolean
          name: string
          normalized_name?: string | null
          note?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_contact?: boolean
          name?: string
          normalized_name?: string | null
          note?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          profession: string | null
          source: string | null
          tel: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          profession?: string | null
          source?: string | null
          tel: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          profession?: string | null
          source?: string | null
          tel?: string
        }
        Relationships: []
      }
      expense_attachments: {
        Row: {
          created_at: string | null
          expense_id: string
          file_name: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_by_member_id: string | null
        }
        Insert: {
          created_at?: string | null
          expense_id: string
          file_name: string
          id?: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_by_member_id?: string | null
        }
        Update: {
          created_at?: string | null
          expense_id?: string
          file_name?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'expense_attachments_expense_id_fkey'
            columns: ['expense_id']
            isOneToOne: false
            referencedRelation: 'expenses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expense_attachments_uploaded_by_member_id_fkey'
            columns: ['uploaded_by_member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string
          entry_type: string
          expense_date: string
          id: string
          spender_member_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description: string
          entry_type?: string
          expense_date: string
          id?: string
          spender_member_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          entry_type?: string
          expense_date?: string
          id?: string
          spender_member_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'expenses_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'expense_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_spender_member_id_fkey'
            columns: ['spender_member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
      marketing_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      members: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_marketings: {
        Row: {
          count: number
          created_at: string | null
          id: string
          marketing_type_id: string | null
          task_id: string | null
        }
        Insert: {
          count?: number
          created_at?: string | null
          id?: string
          marketing_type_id?: string | null
          task_id?: string | null
        }
        Update: {
          count?: number
          created_at?: string | null
          id?: string
          marketing_type_id?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'task_marketings_marketing_type_id_fkey'
            columns: ['marketing_type_id']
            isOneToOne: false
            referencedRelation: 'marketing_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_marketings_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          client_id: string | null
          company_name: string
          created_at: string | null
          deleted_at: string | null
          end_date: string | null
          execution_cost: number
          id: string
          member_id: string | null
          note: string | null
          profit: number | null
          received_amount: number
          start_date: string
          status: Database['public']['Enums']['task_status']
          updated_at: string | null
          vat_included: boolean
        }
        Insert: {
          client_id?: string | null
          company_name: string
          created_at?: string | null
          deleted_at?: string | null
          end_date?: string | null
          execution_cost?: number
          id?: string
          member_id?: string | null
          note?: string | null
          profit?: number | null
          received_amount?: number
          start_date: string
          status?: Database['public']['Enums']['task_status']
          updated_at?: string | null
          vat_included?: boolean
        }
        Update: {
          client_id?: string | null
          company_name?: string
          created_at?: string | null
          deleted_at?: string | null
          end_date?: string | null
          execution_cost?: number
          id?: string
          member_id?: string | null
          note?: string | null
          profit?: number | null
          received_amount?: number
          start_date?: string
          status?: Database['public']['Enums']['task_status']
          updated_at?: string | null
          vat_included?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_member_id_fkey'
            columns: ['member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
      threads_post_segments: {
        Row: {
          content: string
          id: string
          order_index: number
          post_id: string
          reply_thread_id: string | null
        }
        Insert: {
          content?: string
          id?: string
          order_index?: number
          post_id: string
          reply_thread_id?: string | null
        }
        Update: {
          content?: string
          id?: string
          order_index?: number
          post_id?: string
          reply_thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'threads_post_segments_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'threads_posts'
            referencedColumns: ['id']
          },
        ]
      }
      threads_posts: {
        Row: {
          created_at: string
          generated_at: string
          hook_pattern: number | null
          id: string
          persona: string | null
          published_at: string | null
          status: string
          thread_post_id: string | null
          thread_post_url: string | null
          topic: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          hook_pattern?: number | null
          id?: string
          persona?: string | null
          published_at?: string | null
          status?: string
          thread_post_id?: string | null
          thread_post_url?: string | null
          topic?: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          hook_pattern?: number | null
          id?: string
          persona?: string | null
          published_at?: string | null
          status?: string
          thread_post_id?: string | null
          thread_post_url?: string | null
          topic?: string
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
      task_status: 'proposal' | 'not_started' | 'in_progress' | 'done_settled' | 'done_unsettled' | 'lost'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      task_status: ['proposal', 'not_started', 'in_progress', 'done_settled', 'done_unsettled', 'lost'],
    },
  },
} as const
