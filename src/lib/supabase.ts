import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ruaptqoqzcvmrumsajlp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YXB0cW9xemN2bXJ1bXNhamxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTU0OTcsImV4cCI6MjA4ODIzMTQ5N30.ivd0I4fPRCC4HpGgI8U-lf1zKQl0nuN6cFFCsbfJX1o'

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