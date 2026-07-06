import { Team } from './team.types';
export interface StandingsRow {
  rank: number;
  team: Team;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  points: number;
  form: string;
}

export interface LeagueStandings {
  leagueId: number;
  leagueName: string;
  season: number;
  standings: StandingsRow[];
}
