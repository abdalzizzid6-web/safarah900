import { Team } from './team.types';

export interface MatchScore {
  home: number | null;
  away: number | null;
}

export interface MatchPeriod {
  first: number | null;
  second: number | null;
  extratime: number | null;
  penalty: number | null;
}

export interface MatchStatusObj {
  long: string;
  short: string;
  elapsed: number | null;
  extra: number | null;
}

export type MatchStatus = MatchStatusObj | string;

export interface MatchLeagueObj {
  id: number | string;
  name: string;
  country: string;
  logo: string;
  season?: number;
  round?: string;
}

export type MatchLeague = MatchLeagueObj | string;

export interface MatchEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  player: {
    id: number | null;
    name: string;
  };
  assist: {
    id: number | null;
    name: string | null;
  };
  type: 'Goal' | 'Card' | 'subst' | 'Var' | string;
  detail: string;
  comments: string | null;
}

export interface MatchStat {
  type: string;
  home: string | number;
  away: string | number;
}

export interface PlayerNode {
  id: number;
  name: string;
  number: number;
  pos: 'G' | 'D' | 'M' | 'F' | string;
  grid: string | null;
}

export interface TeamLineup {
  team: Team;
  formation: string;
  startXI: { player: PlayerNode }[];
  substitutes: { player: PlayerNode }[];
  coach: {
    name: string;
    photo?: string;
  };
}

export interface StreamingLink {
    name: string;
    url: string;
    icon?: string;
    enabled: boolean;
    priority: number;
    type: 'iframe' | 'youtube' | 'custom';
    quality?: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  score?: MatchScore;
  status: MatchStatus;
  league: MatchLeague;
  utcDate?: string;
  minute?: number;
  isLive?: boolean;
  events?: MatchEvent[];
  statistics?: MatchStat[];
  lineups?: TeamLineup[];
  stadium?: string;
  referee?: string;
  streamingLinks?: StreamingLink[];
  stats?: unknown;
  h2h?: unknown;
  predictions?: unknown;
  timeline?: unknown;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: number;
  awayScore?: number;
  leagueLogo?: string;
  startTime?: string;
  commentator?: string;
  channel?: string;
  youtubeLink?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
  };
  highlightsLinks?: unknown;
  replayLinks?: unknown;
  isFeatured?: boolean;
  featuredPriority?: number;
  featuredPinned?: boolean;
  featuredStartDate?: string;
  featuredEndDate?: string;
  featuredEnabled?: boolean;
  isHidden?: boolean;
  viewersCount?: number;
  interestRate?: number;
  approved?: boolean;
  order?: number;
  visibilityStartTime?: string;
  visibilityEndTime?: string;
  archived?: boolean;
  posterUrl?: string;
  isManual?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  editorialStatus?: 'Draft' | 'Pending Review' | 'Approved' | 'Published' | 'Archived' | 'Cancelled';
  version?: number;
  lastEditedBy?: {
    id: string;
    name: string;
  };
}
