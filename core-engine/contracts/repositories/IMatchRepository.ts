import { Match } from '../../domain/entities/Match';

export interface IMatchRepository {
  getLiveMatches(): Promise<Match[]>;
  getMatchesByDate(date: Date): Promise<Match[]>;
  getMatchDetails(id: string): Promise<Match | null>;
  refreshMatch(id: string): Promise<Match>;
  searchMatches(query: string): Promise<Match[]>;
  getLeagueMatches(leagueId: string): Promise<Match[]>;
}
