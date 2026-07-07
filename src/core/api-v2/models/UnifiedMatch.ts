export interface UnifiedTeam {
  id: string;
  name: string;
  logo: string;
  shortName?: string;
}

export interface UnifiedMatchScore {
  home: number | null;
  away: number | null;
}

export interface UnifiedMatchStatus {
  long: string;
  short: string;
  elapsed: number | null;
}

export interface UnifiedLeague {
  id: string;
  name: string;
  logo: string;
  country: string;
  season: number;
}

export interface UnifiedMatch {
  id: string;
  providerId: string;
  providerName: string;
  homeTeam: UnifiedTeam;
  awayTeam: UnifiedTeam;
  score: UnifiedMatchScore;
  status: UnifiedMatchStatus;
  league: UnifiedLeague;
  startTime: string; // ISO 8601
  isLive: boolean;
  minute?: number;
}
