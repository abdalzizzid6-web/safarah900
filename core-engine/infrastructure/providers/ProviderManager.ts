import { IProvider } from '../../contracts/providers/IProvider';
import { Match } from '../../domain/entities/Match';

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
