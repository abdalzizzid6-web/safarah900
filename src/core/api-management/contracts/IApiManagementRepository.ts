
import { IProviderRepository } from './IProviderRepository';
import { IApiKeyRepository } from './IApiKeyRepository';
import { ILeagueRepository } from './ILeagueRepository';
import { ITeamRepository } from './ITeamRepository';
import { ISyncRepository } from './ISyncRepository';
import { IConfigRepository } from './IConfigRepository';

export interface IApiManagementRepository {
  providerRepository: IProviderRepository;
  apiKeyRepository: IApiKeyRepository;
  leagueRepository: ILeagueRepository;
  teamRepository: ITeamRepository;
  syncRepository: ISyncRepository;
  configRepository: IConfigRepository;

  getProviders(): Promise<any[]>;
  updateProvider(provider: any): Promise<void>;
  
  getKeys(): Promise<any[]>;
  updateKey(key: any): Promise<void>;
  
  getLeagues(): Promise<any[]>;
  updateLeague(league: any): Promise<void>;
  
  getTeams(): Promise<any[]>;
  updateTeam(team: any): Promise<void>;
}
