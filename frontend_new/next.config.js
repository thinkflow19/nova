/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for better development experience
  reactStrictMode: true,
  
  // Use SWC minify for better performance
  swcMinify: true,
  
  // Load environment variables
  env: {
    // Ensure environment variables are properly accessible in the frontend
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Configure image domains for Next.js Image optimization
  images: {
    domains: ['ui-avatars.com'],
  },
  
  // Remove console logs in production for better performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enable TypeScript type checking
  typescript: {
    // Report errors in production build
    ignoreBuildErrors: false,
  },
};

// Debug environment variables during development
if (process.env.NODE_ENV === 'development') {
  console.log('▶️ Next.js config using environment variables:');
  console.log(`API_URL: ${process.env.NEXT_PUBLIC_API_URL || '➡️ Using default: http://localhost:8000'}`);
  
  // Check if Supabase credentials are present
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase credentials missing. Authentication functionality may not work properly.');
  }
}

module.exports = nextConfig; 