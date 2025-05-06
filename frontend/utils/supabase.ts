import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
let supabaseClient: SupabaseClient;

try {
  // Only attempt to create the client if we have valid configuration
  if (isConfigValid) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully');
  } else {
    // Create a minimal mock client that won't throw errors but won't connect either
    // This prevents runtime errors but functionality will be limited
    supabaseClient = {
      auth: {
        signIn: () => Promise.resolve({ error: { message: 'Configuration missing' }}),
        signUp: () => Promise.resolve({ error: { message: 'Configuration missing' }}),
        signOut: () => Promise.resolve({ error: null }),
        session: null,
      },
      from: () => ({ select: () => Promise.resolve({ data: [], error: { message: 'Configuration missing' }})}),
    } as unknown as SupabaseClient;
    console.warn('Created Supabase mock client due to missing configuration');
}
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Fallback to mock client in case of initialization error
  supabaseClient = {
    auth: {
      signIn: () => Promise.resolve({ error: { message: 'Initialization failed' }}),
      signOut: () => Promise.resolve({ error: null }),
      session: null,
    },
  } as unknown as SupabaseClient;
}

// Export the client
export const supabase = supabaseClient;

// Function to get client with validation
export function getSupabaseClient(): SupabaseClient {
    if (!isConfigValid) {
        throw new Error('Supabase configuration is missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return supabase;
} 