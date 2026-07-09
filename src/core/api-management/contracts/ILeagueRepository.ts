
import { LeagueSettings } from '../../../types';

export interface ILeagueRepository {
  getLeagues(): Promise<LeagueSettings[]>;
  getLeaguesMap(): Promise<Record<string, LeagueSettings>>;
  getLeagueById(id: string): Promise<LeagueSettings | null>;
  createLeague(league: LeagueSettings): Promise<void>;
  updateLeague(league: LeagueSettings): Promise<void>;
  deleteLeague(id: string): Promise<void>;
  
  enableLeague(id: string, enabled: boolean): Promise<void>;
  setVisibleInHome(id: string, visible: boolean): Promise<void>;
  setVisibleInLive(id: string, visible: boolean): Promise<void>;
  setVisibleInSchedule(id: string, visible: boolean): Promise<void>;
  setVisibleInNews(id: string, visible: boolean): Promise<void>;
  
  updateOrder(id: string, order: number): Promise<void>;
}
