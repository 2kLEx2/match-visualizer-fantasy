
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iwxvebibywavdrlkujmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3eHZlYmlieXdhdmRybGt1am1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MjMyMDAsImV4cCI6MjA1NTM5OTIwMH0.U4L7Utd3GogGGH7JHEpxadoF3crkQXnpMSxo969ufEM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
