
export interface ITeam {
  id: string;
  externalId: string;
  providerId: string;
  leagueId: string;
  country: string;
  season: string;
  sport: string;
  logo: string;
  nameAR: string;
  nameEN: string;
  shortName: string;
  slug: string;
  enabled: boolean;
  hidden: boolean;
  featured: boolean;
  favorite: boolean;
  excluded: boolean;
  order: number;
  syncDisabled: boolean;
  updatedAt: number;
}
