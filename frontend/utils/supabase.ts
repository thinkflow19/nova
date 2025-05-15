import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import config from '../config/config'; // Import centralized config

// Use config values, ensuring they're not empty strings
const supabaseUrl = config.supabaseUrl || '';
const supabaseAnonKey = config.supabaseAnonKey || '';

// Validate configuration values
const isConfigValid = supabaseUrl && supabaseAnonKey;

// Add logging for missing keys
if (!isConfigValid) {
  console.error(
    'Supabase URL or Anon Key is missing in frontend config. Some functionality will be limited.'
  );
}

// Initialize Supabase client or create a mock client if config is missing
let supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Export the client
export const supabase = supabaseClient;

// Function to get client with validation
export function getSupabaseClient(): SupabaseClient {
    if (!isConfigValid) {
        throw new Error('Supabase configuration is missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return supabase;
}

// Validate environment variables
const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!envSupabaseUrl || !envSupabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing in environment variables. Check your .env.local file.'
  );
}

// Create and export the Supabase client
export const createClient = (): SupabaseClient => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}; 