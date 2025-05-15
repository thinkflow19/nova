/**
 * Configuration constants for the application
 * Centralizes environment variable access and provides defaults
 */

interface Config {
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  environment: 'development' | 'production' | 'test';
  isDevMode: boolean;
  features: {
    enableAuth: boolean;
    enableAnalytics: boolean;
  };
  app: {
    name: string;
    description: string;
    url: string;
  };
}

/**
 * Get environment variables with strong typing and validation
 */
const getEnvVar = (key: string, defaultValue?: string): string => {
  // Check both NEXT_PUBLIC_* and regular environment variables
  const value = 
    typeof window === 'undefined' 
      ? process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || defaultValue
      : process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
  
  if (value === undefined) {
    console.warn(`Environment variable NEXT_PUBLIC_${key} is not defined`);
    return '';
  }
  
  return value;
};

/**
 * Check if we're in development mode
 */
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Application configuration object with environment variables
 */
const config: Config = {
  apiUrl: getEnvVar('API_URL', isDev ? 'http://localhost:8000' : '/api'),
  supabaseUrl: getEnvVar('SUPABASE_URL', ''),
  supabaseAnonKey: getEnvVar('SUPABASE_ANON_KEY', ''),
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  isDevMode: isDev,
  features: {
    enableAuth: getEnvVar('ENABLE_AUTH', 'true') === 'true',
    enableAnalytics: getEnvVar('ENABLE_ANALYTICS', 'false') === 'true',
  },
  app: {
    name: getEnvVar('APP_NAME', 'Nova AI'),
    description: getEnvVar('APP_DESCRIPTION', 'Your AI assistant powered by your knowledge'),
    url: getEnvVar('APP_URL', isDev ? 'http://localhost:3000' : ''),
  }
};

// Log configuration in development mode
if (isDev && typeof window === 'undefined') {
  console.log('Configuration loaded:', {
    ...config,
    supabaseAnonKey: config.supabaseAnonKey ? '[REDACTED]' : '[MISSING]'
  });
}

export default config; 