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
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://orzhsdggsdbaacbemxav.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhzZGdnc2RiYWFjYmVteGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NTc4NDYsImV4cCI6MjA2MTIzMzg0Nn0.cUeq8JluotH90QnL1ybUtVaaJAsxfzy9SpAVN6AWs2s',
    
    // Feature flags
    NEXT_PUBLIC_ENABLE_AUTH: process.env.NEXT_PUBLIC_ENABLE_AUTH || 'true',
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || 'true',
    NEXT_PUBLIC_ENABLE_INSIGHTS: process.env.NEXT_PUBLIC_ENABLE_INSIGHTS || 'true',
    NEXT_PUBLIC_ENABLE_KNOWLEDGE: process.env.NEXT_PUBLIC_ENABLE_KNOWLEDGE || 'true',
    NEXT_PUBLIC_ENABLE_DOC_UPLOAD: process.env.NEXT_PUBLIC_ENABLE_DOC_UPLOAD || 'true',
    NEXT_PUBLIC_ENABLE_AGENTS: process.env.NEXT_PUBLIC_ENABLE_AGENTS || 'true',
    NEXT_PUBLIC_ENABLE_CHAT: process.env.NEXT_PUBLIC_ENABLE_CHAT || 'true',
  },
  
  // Configure image domains for Next.js Image optimization
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com', 'ui-avatars.com', 'randomuser.me'],
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

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
};

// Debug environment variables during development
if (process.env.NODE_ENV === 'development') {
  console.log('▶️ Next.js config using environment variables:');
  console.log(`API_URL: ${process.env.NEXT_PUBLIC_API_URL || '➡️ Using default: http://localhost:8000'}`);
  console.log(`SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '➡️ Using default from config'}`);
  console.log(`SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '➡️ Using default from config'}`);
  
  // Check if Supabase credentials are present
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Using fallback Supabase credentials. This is fine for development but should be properly configured in production.');
  }
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.BUNDLE_ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig); 