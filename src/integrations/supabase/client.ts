// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://iwxvebibywavdrlkujmq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3eHZlYmlieXdhdmRybGt1am1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MjMyMDAsImV4cCI6MjA1NTM5OTIwMH0.U4L7Utd3GogGGH7JHEpxadoF3crkQXnpMSxo969ufEM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);