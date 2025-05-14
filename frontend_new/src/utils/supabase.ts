import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache the client instance
let supabaseInstance: SupabaseClient | null = null;

// Get Supabase URL and key directly from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://orzhsdggsdbaacbemxav.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhzZGdnc2RiYWFjYmVteGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NTc4NDYsImV4cCI6MjA2MTIzMzg0Nn0.cUeq8JluotH90QnL1ybUtVaaJAsxfzy9SpAVN6AWs2s';

/**
 * Create and return a Supabase client
 * Uses singleton pattern to avoid creating multiple instances
 */
export const createSupabaseClient = (): SupabaseClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'nova-auth-token',
      },
    });
    
    return supabaseInstance;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    throw new Error('Failed to initialize Supabase client');
  }
};

export default createSupabaseClient; 