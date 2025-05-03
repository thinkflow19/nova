/**
 * Frontend Configuration
 *
 * Centralizes access to environment variables for the frontend application.
 * It ensures that necessary variables are present and provides type safety.
 */

// Note: Accessing process.env directly might only work server-side or during build time in Next.js.
// For client-side access, variables MUST be prefixed with NEXT_PUBLIC_ and exposed via next.config.js

interface FrontendConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiUrl: string;
  isDevelopment: boolean;
}

// Retrieve variables exposed via next.config.js (publicRuntimeConfig) or directly via process.env
// Ensure NEXT_PUBLIC_ prefixes are used for client-side access.
const config: FrontendConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000', // Default API URL for local dev
  isDevelopment: process.env.NODE_ENV === 'development',
};

// --- Validation --- //
const validateConfig = (cfg: FrontendConfig): string[] => {
  const missing: string[] = [];
  if (!cfg.supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!cfg.supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!cfg.apiUrl) missing.push('NEXT_PUBLIC_API_URL'); // API URL is usually required

  return missing;
};

const missingVars = validateConfig(config);

if (missingVars.length > 0 && typeof window !== 'undefined') {
  // Log warning only in the browser to avoid build-time noise if vars are set later
  console.warn(
    `🟡 Frontend Config Warning: The following environment variables appear missing client-side: ${missingVars.join(
      ', '
    )}. Ensure they are prefixed with NEXT_PUBLIC_ and exposed in next.config.js. Defaults will be used.`
  );
}

// Log loaded config in development for easier debugging (client-side)
if (config.isDevelopment && typeof window !== 'undefined') {
  console.log('Frontend Config Loaded:', {
    supabaseUrl: config.supabaseUrl ? config.supabaseUrl.substring(0, 20) + '...' : 'MISSING',
    supabaseAnonKey: config.supabaseAnonKey ? '***REDACTED***' : 'MISSING',
    apiUrl: config.apiUrl,
    isDevelopment: config.isDevelopment,
  });
}

export default config; 