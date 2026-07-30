import { IProvider } from '../../contracts/providers/IProvider.js';
import { Match } from '../../domain/entities/Match.js';

export class ProviderManager {
  private providers: IProvider[] = [];
  
  registerProvider(provider: IProvider) {
    this.providers.push(provider);
  }
  
  async fetchLiveMatches(): Promise<any[]> {
    if (this.providers.length === 0) throw new Error('No providers registered');
    // Simple strategy: use the first provider
    return this.providers[0].fetchLiveMatches();
  }
}
