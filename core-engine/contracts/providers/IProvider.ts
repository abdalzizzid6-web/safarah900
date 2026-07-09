import { Match } from '../../domain/entities/Match';

export interface IProvider {
  name: string;
  fetchLiveMatches(): Promise<Match[]>;
  fetchMatchesByDate(date: Date): Promise<Match[]>;
  fetchMatch(id: string): Promise<Match | null>;
  fetchStandings(leagueId: string): Promise<any[]>;
  fetchStatistics(matchId: string): Promise<any[]>;
  fetchEvents(matchId: string): Promise<any[]>;
  fetchLineups(matchId: string): Promise<any[]>;
}
