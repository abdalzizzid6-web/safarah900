
import { ApiKey } from '../../../admin/api/types/api';

export interface IApiKeyRepository {
  getKeys(): Promise<ApiKey[]>;
  addKey(key: ApiKey): Promise<void>;
  updateKey(key: ApiKey): Promise<void>;
  deleteKey(id: string): Promise<void>;
  toggleKey(id: string, active: boolean): Promise<void>;
}
