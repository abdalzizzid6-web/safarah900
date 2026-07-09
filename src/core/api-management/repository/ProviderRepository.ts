
import { BaseRepository } from '../../repository/BaseRepository';
import { ApiProvider } from '../../../admin/api/types/api';
import { IProviderRepository } from '../contracts/IProviderRepository';
import { CacheLayer } from '../cache/CacheLayer';

export class ProviderRepository extends BaseRepository<ApiProvider> implements IProviderRepository {
  constructor() {
    super('api_providers');
  }

  async getProviders(): Promise<ApiProvider[]> {
    const cached = CacheLayer.get('providers');
    if (cached) return cached;

    const providers = await this.getAll(100);
    CacheLayer.set('providers', providers, 300); // 5 min TTL
    return providers;
  }

  async addProvider(provider: ApiProvider): Promise<void> {
    await this.setById(provider.id, provider);
    CacheLayer.invalidate('providers');
  }

  async updateProvider(provider: ApiProvider): Promise<void> {
    await this.setById(provider.id, provider);
    CacheLayer.invalidate('providers');
  }

  async deleteProvider(id: string): Promise<void> {
    await this.delete(id);
    CacheLayer.invalidate('providers');
  }

  async toggleProvider(id: string, active: boolean): Promise<void> {
    await this.update(id, { active });
    CacheLayer.invalidate('providers');
  }
}
