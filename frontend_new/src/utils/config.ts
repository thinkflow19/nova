/**
 * Configuration constants for the application
 * Centralizes environment variable access and provides defaults
 */

interface Config {
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  environment: 'development' | 'production' | 'test';
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  features: {
    enableAuth: boolean;
    enableAnalytics: boolean;
    enableInsights: boolean;
    enableKnowledge: boolean;
    enableDocUpload: boolean;
    enableAgents: boolean;
    enableChat: boolean;
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
const getEnvVar = (key: string, required: boolean = true, defaultValue: string = ''): string => {
  const value = process.env[key]; // Directly try to get the key as passed

  if (value === undefined && required) {
    // If the key was expected to be prefixed (e.g., NEXT_PUBLIC_MY_VAR) and not found,
    // the error message should reflect that the exact key was missing.
    console.warn(`Environment variable ${key} is not defined, using default value: "${defaultValue}"`);
    return defaultValue;
  }
  
  return value || defaultValue;
};

/**
 * Validate URL format
 */
const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Configuration object with environment variables
 */
const config: Config = {
  apiUrl: (() => {
    const url = getEnvVar('NEXT_PUBLIC_API_URL', true, 'http://localhost:8000');
    if (!isValidUrl(url)) {
      console.warn(`Invalid NEXT_PUBLIC_API_URL format: "${url}", using default http://localhost:8000`);
      return 'http://localhost:8000';
    }
    return url;
  })(),

  supabaseUrl: (() => {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', true, '');
    if (!isValidUrl(url) && url !== '') {
      console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL format');
    }
    return url;
  })(),

  supabaseAnonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true, ''),

  environment: (() => {
    // NODE_ENV is typically not prefixed with NEXT_PUBLIC_ for Next.js usage
    // It's available on both server and client if set during build/run.
    const env = getEnvVar('NODE_ENV', false, 'development');
    if (!['development', 'production', 'test'].includes(env)) {
      return 'development';
    }
    return env as Config['environment'];
  })(),

  get isDevelopment() {
    return this.environment === 'development';
  },

  get isProduction() {
    return this.environment === 'production';
  },

  get isTest() {
    return this.environment === 'test';
  },

  features: {
    enableAuth: getEnvVar('NEXT_PUBLIC_ENABLE_AUTH', false, 'true') === 'true',
    enableAnalytics: getEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', false, 'true') === 'true',
    enableInsights: getEnvVar('NEXT_PUBLIC_ENABLE_INSIGHTS', false, 'true') === 'true',
    enableKnowledge: getEnvVar('NEXT_PUBLIC_ENABLE_KNOWLEDGE', false, 'true') === 'true',
    enableDocUpload: getEnvVar('NEXT_PUBLIC_ENABLE_DOC_UPLOAD', false, 'true') === 'true',
    enableAgents: getEnvVar('NEXT_PUBLIC_ENABLE_AGENTS', false, 'true') === 'true',
    enableChat: getEnvVar('NEXT_PUBLIC_ENABLE_CHAT', false, 'true') === 'true',
  },

  app: {
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', false, 'Nova AI'),
    description: getEnvVar('NEXT_PUBLIC_APP_DESCRIPTION', false, 'Your AI assistant powered by your knowledge'),
    url: getEnvVar('NEXT_PUBLIC_APP_URL', false, 'http://localhost:3000'),
  }
};

// Log configuration in development mode
if (config.isDevelopment && typeof window === 'undefined') {
  console.log('Configuration loaded:', {
    ...config,
    supabaseAnonKey: '***' // Hide sensitive values
  });
}

export default config; 