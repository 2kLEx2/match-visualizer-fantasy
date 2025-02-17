
import { createClient } from '@supabase/supabase-js';

// Get the URL and anon key from the auto-injected env variables
const supabaseUrl = 'https://' + import.meta.env.VITE_SUPABASE_PROJECT_ID + '.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
