/**
 * App configuration for Trainerly app
 */

export interface AppConfig {
  useServerData: boolean;
  showCoachApp: boolean;
}

/**
 * Get app configuration - always returns true for both settings in Trainerly app
 */
export const getAppConfig = (): AppConfig => {
  return {
    useServerData: true,
    showCoachApp: true
  };
};
