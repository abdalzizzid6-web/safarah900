export interface WCHistoryEdition {
  year: number;
  host: string;
  hostAr: string;
  champion: string;
  championAr: string;
  runnerUp: string;
  runnerUpAr: string;
  thirdPlace: string;
  thirdPlaceAr: string;
  score: string;
  teamsCount: number;
  matchesCount: number;
  goalsCount: number;
  status: 'completed' | 'upcoming';
}

export interface WCTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address?: string;
  website?: string;
  founded?: number;
  clubColors?: string;
  venue?: string;
  coach?: string;
  ranking?: number;
  history?: string;
  logo?: string;
}

export interface WCMatch {
  id: string;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  group: string | null;
  homeTeam: WCTeam;
  awayTeam: WCTeam;
  score: {
    winner: string | null;
    duration: string;
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime: {
      home: number | null;
      away: number | null;
    };
  };
  referees: {
    id: number;
    name: string;
    type: string;
    nationality: string;
  }[];
  venue?: string;
  city?: string;
  elapsed?: number;
}

export interface TableEntry {
  position: number;
  team: WCTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingGroup {
  stage: string;
  type: string;
  group: string;
  table: TableEntry[];
}

export interface ScorerEntry {
  player: {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    section: string;
    position: string | null;
    shirtNumber: number | null;
  };
  team: WCTeam;
  goals: number;
  assists: number | null;
  playedGames: number | null;
}

export interface WCStats {
  goals: number;
  matchesPlayed: number;
  avgGoals: string;
  bestAttack: { team: string; goals: number; crest: string } | null;
  bestDefense: { team: string; conceded: number; crest: string } | null;
  highestScoringMatch: { match: string; goals: number; score: string } | null;
}
