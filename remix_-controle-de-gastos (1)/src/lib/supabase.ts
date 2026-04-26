/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co' || !supabaseAnonKey) {
  const errorMsg = 'SUPABASE ERROR: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados no Netlify.';
  console.error(errorMsg);
}

export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co',
  supabaseAnonKey || 'missing-key'
);
