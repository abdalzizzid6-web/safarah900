import { UnifiedMatch } from '../models/UnifiedMatch';

export interface IProvider {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;

  getMatchesByDate(date: string): Promise<UnifiedMatch[]>;
  getMatchDetails(matchId: string): Promise<UnifiedMatch>;
  getLiveMatches(): Promise<UnifiedMatch[]>;
}
