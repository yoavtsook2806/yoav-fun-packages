/**
 * URL parameter utilities for the training app
 */

export interface AppConfig {
  useServerData: boolean;
  showCoachApp: boolean;
}

/**
 * Get URL parameters and return app configuration
 */
export const getAppConfig = (): AppConfig => {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    useServerData: urlParams.get('useServerData') === 'true',
    showCoachApp: urlParams.get('showCoachApp') === 'true'
  };
};

/**
 * Update URL parameters without page reload
 */
export const updateUrlParams = (config: Partial<AppConfig>): void => {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (config.useServerData !== undefined) {
    if (config.useServerData) {
      urlParams.set('useServerData', 'true');
    } else {
      urlParams.delete('useServerData');
    }
  }
  
  if (config.showCoachApp !== undefined) {
    if (config.showCoachApp) {
      urlParams.set('showCoachApp', 'true');
    } else {
      urlParams.delete('showCoachApp');
    }
  }
  
  const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
  window.history.replaceState({}, '', newUrl);
};
