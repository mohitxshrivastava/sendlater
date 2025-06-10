import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ScheduledEmail = {
  id: string;
  user_id: string;
  to_email: string;
  subject: string;
  body: string;
  scheduled_at: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};