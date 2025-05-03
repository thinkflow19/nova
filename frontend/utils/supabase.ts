import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config/config'; // Import centralized config

// Use config values
const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;

// Add logging for missing keys (already done in config.ts, but explicit check here too)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing in frontend config. Supabase client cannot be initialized.'
  );
  // Optionally throw an error or return a mock client depending on desired behavior
  // throw new Error('Missing Supabase configuration for frontend client.');
}

// Initialize Supabase client (ensure it handles empty strings gracefully if needed)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Optional: Function to get client, might be useful for testing or conditional logic
export function getSupabaseClient(): SupabaseClient {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing.');
    }
    return supabase;
} 