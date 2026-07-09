
import { ITeam } from '../models/team.model';

export interface ITeamRepository {
  getTeams(): Promise<ITeam[]>;
  getTeamById(id: string): Promise<ITeam | null>;
  createTeam(team: ITeam): Promise<void>;
  updateTeam(team: ITeam): Promise<void>;
  deleteTeam(id: string): Promise<void>;
  
  toggleTeamEnabled(id: string, enabled: boolean): Promise<void>;
  setTeamFeatured(id: string, featured: boolean): Promise<void>;
  setTeamFavorite(id: string, favorite: boolean): Promise<void>;
  setTeamHidden(id: string, hidden: boolean): Promise<void>;
  
  updateOrder(id: string, order: number): Promise<void>;
}
