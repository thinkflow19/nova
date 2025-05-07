/** @type {import('next').NextConfig} */
const nextConfig = {
  // Load environment variables from parent directory
  env: {
    // Ensure environment variables are properly accessible in the frontend
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_API_URL: process.env.API_URL || 'http://localhost:8000',
  },
  // Add some debug info during startup
  onDemandEntries: {
    // Display environment info during development
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

// Debug environment variables during build
if (process.env.NODE_ENV === 'development') {
  console.log('▶️ Next.js config using environment variables:');
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`API_URL: ${process.env.API_URL || '➡️ Using default: http://localhost:8000'}`);
}

export default nextConfig; 