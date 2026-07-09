
import { BaseRepository } from '../../repository/BaseRepository';
import { ApiKey } from '../../../admin/api/types/api';
import { IApiKeyRepository } from '../contracts/IApiKeyRepository';
import { CacheLayer } from '../cache/CacheLayer';

export class ApiKeyRepository extends BaseRepository<ApiKey> implements IApiKeyRepository {
  constructor() {
    super('api_keys');
  }

  async getKeys(): Promise<ApiKey[]> {
    const cached = CacheLayer.get<ApiKey[]>('api_keys');
    if (cached) return cached;

    const keys = await this.getAll(100);
    CacheLayer.set('api_keys', keys, 300); // 5 min TTL
    return keys;
  }

  async addKey(key: ApiKey): Promise<void> {
    await this.setById(key.id, key);
    CacheLayer.invalidate('api_keys');
  }

  async updateKey(key: ApiKey): Promise<void> {
    await this.setById(key.id, key);
    CacheLayer.invalidate('api_keys');
  }

  async deleteKey(id: string): Promise<void> {
    await this.delete(id);
    CacheLayer.invalidate('api_keys');
  }

  async toggleKey(id: string, active: boolean): Promise<void> {
    await this.update(id, { active });
    CacheLayer.invalidate('api_keys');
  }
}
