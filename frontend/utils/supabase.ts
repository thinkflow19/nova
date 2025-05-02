import { createClient } from '@supabase/supabase-js';

// Environment variables will be populated by Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://orzhsdggsdbaacbemxav.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhzZGdnc2RiYWFjYmVteGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQxMzg1ODYsImV4cCI6MjAyOTcxNDU4Nn0.VylI-UXfnbubzMOHQdQlzA8oNi5p1D0lzxO1swsQnS0';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase URL or Anon Key. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase; 