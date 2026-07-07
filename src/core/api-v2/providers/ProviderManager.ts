import { IProvider } from './IProvider';
import { UnifiedMatch } from '../models/UnifiedMatch';

export class ProviderManager {
  private providers: Map<string, IProvider> = new Map();

  registerProvider(provider: IProvider) {
    this.providers.set(provider.id, provider);
  }

  private getActiveProviders(): IProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.isActive)
      .sort((a, b) => a.priority - b.priority);
  }

  async getMatchesByDate(date: string): Promise<UnifiedMatch[]> {
    const providers = this.getActiveProviders();
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const matches = await provider.getMatchesByDate(date);
        return matches;
      } catch (error: any) {
        lastError = error;
        console.warn(`[ProviderManager] Provider ${provider.name} failed: ${error.message}. Falling back...`);
      }
    }
    
    throw new Error(`[ProviderManager] All providers failed. Last error: ${lastError?.message}`);
  }

  async getLiveMatches(): Promise<UnifiedMatch[]> {
    const providers = this.getActiveProviders();
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        return await provider.getLiveMatches();
      } catch (error: any) {
        lastError = error;
        console.warn(`[ProviderManager] Provider ${provider.name} failed for live matches: ${error.message}.`);
      }
    }

    throw new Error(`[ProviderManager] All providers failed for live matches. Last error: ${lastError?.message}`);
  }
}
