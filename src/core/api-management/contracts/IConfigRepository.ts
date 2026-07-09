
import { ApiRouting } from '../../../admin/api/types/api';

export interface SystemConfig {
  routing: ApiRouting;
  cacheTtlMinutes: number;
  cacheEnabled: boolean;
  worldCupModuleEnabled: boolean;
}

export interface IConfigRepository {
  getConfig(): Promise<SystemConfig>;
  updateConfig(config: Partial<SystemConfig>): Promise<void>;
  updateRouting(routing: Partial<ApiRouting>): Promise<void>;
}
