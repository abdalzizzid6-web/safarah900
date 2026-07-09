
import { ApiProvider } from '../../../admin/api/types/api';

export interface IProviderRepository {
  getProviders(): Promise<ApiProvider[]>;
  addProvider(provider: ApiProvider): Promise<void>;
  updateProvider(provider: ApiProvider): Promise<void>;
  deleteProvider(id: string): Promise<void>;
  toggleProvider(id: string, active: boolean): Promise<void>;
}
