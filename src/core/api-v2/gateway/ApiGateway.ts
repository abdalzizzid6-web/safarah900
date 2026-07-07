import { ProviderManager } from '../providers/ProviderManager';
import { UnifiedMatch } from '../models/UnifiedMatch';

export class ApiGateway {
  private static instance: ApiGateway;
  private providerManager: ProviderManager;

  private constructor() {
    this.providerManager = new ProviderManager();
  }

  static getInstance(): ApiGateway {
    if (!ApiGateway.instance) {
      ApiGateway.instance = new ApiGateway();
    }
    return ApiGateway.instance;
  }

  getProviderManager(): ProviderManager {
    return this.providerManager;
  }

  async getMatches(date: string): Promise<UnifiedMatch[]> {
    return this.providerManager.getMatchesByDate(date);
  }

  async getLiveMatches(): Promise<UnifiedMatch[]> {
    return this.providerManager.getLiveMatches();
  }
}
