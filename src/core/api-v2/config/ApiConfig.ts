export interface ApiProviderConfig {
  id: string;
  name: string;
  isActive: boolean;
  priority: number;
  apiKey: string;
  baseUrl: string;
}

export interface ApiSystemConfig {
  cacheTtlSeconds: number;
  activeProviders: string[];
}

export class ApiConfigManager {
  private static instance: ApiConfigManager;
  private config: Record<string, ApiProviderConfig> = {};
  
  private constructor() {}

  static getInstance(): ApiConfigManager {
    if (!ApiConfigManager.instance) {
      ApiConfigManager.instance = new ApiConfigManager();
    }
    return ApiConfigManager.instance;
  }

  setProviderConfig(id: string, config: ApiProviderConfig) {
    this.config[id] = config;
  }

  getProviderConfig(id: string): ApiProviderConfig | undefined {
    return this.config[id];
  }
}
