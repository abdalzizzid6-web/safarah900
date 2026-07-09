
import { IApiManagementRepository } from '../contracts/IApiManagementRepository';

export class ApiManagementService {
  constructor(private repo: IApiManagementRepository) {}

  async manageProvider(provider: any) { }
  async manageKey(key: any) { }
  async manageLeague(league: any) { }
}
