// API Configuration for different environments

export interface ApiConfig {
  baseUrl: string;
  stage: 'dev' | 'prod';
}

// Environment detection
const getEnvironment = (): 'dev' | 'prod' => {
  // Check URL patterns or environment variables for deployed environments
  if (window.location.hostname.includes('dev') || 
      window.location.pathname.includes('dev') ||
      process.env.NODE_ENV === 'development') {
    return 'dev';
  }
  
  // Default to prod for production deployments
  return 'prod';
};

// API Configuration for each environment (always AWS)
const API_CONFIGS: Record<'dev' | 'prod', ApiConfig> = {
  dev: {
    baseUrl: 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev',
    stage: 'dev'
  },
  prod: {
    baseUrl: 'https://fzfh3j7m0h.execute-api.eu-central-1.amazonaws.com/prod',
    stage: 'prod'
  }
};

// Get current API configuration
export const getApiConfig = (): ApiConfig => {
  const env = getEnvironment();
  return API_CONFIGS[env];
};

// Convenience function to get the current API base URL
export const getApiBaseUrl = (): string => {
  return getApiConfig().baseUrl;
};

// Helper to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Export the current config for debugging
export const currentApiConfig = getApiConfig();
console.log('🔧 API Config:', currentApiConfig);
