export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar: string | null
          currency: string | null
          locale: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          avatar?: string | null
          currency?: string | null
          locale?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          avatar?: string | null
          currency?: string | null
          locale?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          category_id: string
          date: string
          merchant: string
          description: string | null
          receipt_url: string | null
          created_at: number
        }
        Insert: {
          id: string
          user_id: string
          amount: number
          currency: string
          category_id: string
          date: string
          merchant: string
          description?: string | null
          receipt_url?: string | null
          created_at: number
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          category_id?: string
          date?: string
          merchant?: string
          description?: string | null
          receipt_url?: string | null
          created_at?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
