import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const getSupabaseUrl = (): string => {
  return import.meta.env.VITE_SUPABASE_URL || '';
};

const getSupabaseAnonKey = (): string => {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Log Supabase configuration status
console.log('🔧 [Supabase] Initializing client...');
console.log('🔧 [Supabase] URL configured:', !!supabaseUrl);
console.log('🔧 [Supabase] URL value:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET');
console.log('🔧 [Supabase] Anon Key configured:', !!supabaseAnonKey);
console.log('🔧 [Supabase] Anon Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  const configured = Boolean(supabaseUrl && supabaseAnonKey);
  console.log('🔧 [Supabase] Is configured:', configured);
  return configured;
};

// Create Supabase client only if configured
// Use placeholder URL to avoid initialization errors
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Make supabase available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  console.log('🔧 [Supabase] Client available as window.supabase for debugging');
}
