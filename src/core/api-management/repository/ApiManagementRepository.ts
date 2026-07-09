
import { IApiManagementRepository } from '../contracts/IApiManagementRepository';
import { IProviderRepository } from '../contracts/IProviderRepository';
import { ProviderRepository } from './ProviderRepository';
import { IApiKeyRepository } from '../contracts/IApiKeyRepository';
import { ApiKeyRepository } from './ApiKeyRepository';
import { ILeagueRepository } from '../contracts/ILeagueRepository';
import { LeagueRepository } from './LeagueRepository';
import { ITeamRepository } from '../contracts/ITeamRepository';
import { TeamRepository } from './TeamRepository';
import { ISyncRepository } from '../contracts/ISyncRepository';
import { SyncRepository } from './SyncRepository';
import { IConfigRepository } from '../contracts/IConfigRepository';
import { ConfigRepository } from './ConfigRepository';
import { unifiedSyncEngine } from '../services/UnifiedSyncEngine';

export class ApiManagementRepository implements IApiManagementRepository {
  public providerRepository: IProviderRepository;
  public apiKeyRepository: IApiKeyRepository;
  public leagueRepository: ILeagueRepository;
  public teamRepository: ITeamRepository;
  public syncRepository: ISyncRepository;
  public configRepository: IConfigRepository;
  public syncEngine = unifiedSyncEngine;

  constructor() {
    this.providerRepository = new ProviderRepository();
    this.apiKeyRepository = new ApiKeyRepository();
    this.leagueRepository = new LeagueRepository();
    this.teamRepository = new TeamRepository();
    this.syncRepository = new SyncRepository();
    this.configRepository = new ConfigRepository();
  }

  async getProviders() { return this.providerRepository.getProviders(); }
  async updateProvider(provider: any) { return this.providerRepository.updateProvider(provider); }
  
  async getKeys() { return this.apiKeyRepository.getKeys(); }
  async updateKey(key: any) { return this.apiKeyRepository.updateKey(key); }
  
  async getLeagues() { return this.leagueRepository.getLeagues(); }
  async updateLeague(league: any) { return this.leagueRepository.updateLeague(league); }

  async getTeams() { return this.teamRepository.getTeams(); }
  async updateTeam(team: any) { return this.teamRepository.updateTeam(team); }
}
