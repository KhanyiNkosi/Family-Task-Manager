// app/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for your database
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          points: number
          assigned_to: string | null
          created_by: string
          family_id: string
          status: 'pending' | 'in_progress' | 'completed' | 'approved'
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          points: number
          assigned_to?: string | null
          created_by: string
          family_id: string
          status?: 'pending' | 'in_progress' | 'completed' | 'approved'
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          points?: number
          assigned_to?: string | null
          created_by?: string
          family_id?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'approved'
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'parent' | 'child'
          family_id: string
          profile_image: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
      }
      rewards: {
        Row: {
          id: string
          name: string
          description: string | null
          points_required: number
          family_id: string
          created_by: string
          created_at: string
        }
      }
      claimed_rewards: {
        Row: {
          id: string
          reward_id: string
          child_id: string
          claimed_at: string
          points_used: number
          family_id: string
        }
      }
    }
  }
}
