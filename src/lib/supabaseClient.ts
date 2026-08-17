// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// Get the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Warn if environment variables are missing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local; using placeholder credentials.");
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);