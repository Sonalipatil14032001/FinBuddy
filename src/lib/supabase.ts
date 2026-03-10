import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Transaction = {
  id: string
  user_id: string
  description: string
  category: string
  amount: number
  date: string
  notes: string
  created_at: string
}

export type Budget = {
  id: string
  user_id: string
  category: string
  limit_amount: number
  created_at: string
}

export type Goal = {
  id: string
  user_id: string
  name: string
  target: number
  saved: number
  icon: string
  color: string
  created_at: string
}