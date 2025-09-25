// API Configuration for different environments

export interface ApiConfig {
  baseUrl: string;
  stage: 'local' | 'dev' | 'prod';
}

// Environment detection
const getEnvironment = (): 'local' | 'dev' | 'prod' => {
  // Check if we're running locally
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'local';
  }
  
  // Check URL patterns for deployed environments
  if (window.location.hostname.includes('dev') || window.location.pathname.includes('dev')) {
    return 'dev';
  }
  
  // Default to prod for production deployments
  return 'prod';
};

// API Configuration for each environment
const API_CONFIGS: Record<'local' | 'dev' | 'prod', ApiConfig> = {
  local: {
    baseUrl: 'http://localhost:3000/dev',
    stage: 'local'
  },
  dev: {
    baseUrl: 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev',
    stage: 'dev'
  },
  prod: {
    baseUrl: 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/prod',
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
