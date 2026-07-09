
export interface IProvider {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  apiType: string;
  baseUrl: string;
  // ... other fields
}

export interface IApiKey {
  id: string;
  providerId: string;
  key: string;
  enabled: boolean;
  // ... other fields
}

export interface ILeague {
  id: string;
  providerId: string;
  enabled: boolean;
  order: number;
  // ... other fields
}

export interface ITeam {
  id: string;
  leagueId: string;
  enabled: boolean;
  // ... other fields
}

export interface ISyncSettings {
  id: string;
  providerId: string;
  frequency: string;
  // ... other fields
}

export interface IApiLog {
  id: string;
  providerId: string;
  status: string;
  timestamp: number;
  // ... other fields
}
