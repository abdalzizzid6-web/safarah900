
export interface ApiProviderConfig {
  id: string;
  name: string;
  key: string;
  provider: 'API-Football' | 'SportMonks' | 'TheSportsDB' | 'Custom';
  status: 'healthy' | 'degraded' | 'suspended' | 'unauthorized';
  active: boolean;
}

export interface IApiConfigProvider {
  loadConfig(force?: boolean): Promise<void>;
  getActiveKeyForCategory(category: string, targetProviderName: string): Promise<{
    key: string;
    providerDoc: ApiProviderConfig;
    targetProviderName: string;
  }>;
  getProvidersCache(): ApiProviderConfig[];
}
