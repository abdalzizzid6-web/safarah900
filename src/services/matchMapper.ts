import { Match, MatchEvent, MatchStat, TeamLineup } from '../types';
import { normalizeMatch } from '../core/utils/matchNormalization';

/**
 * Maps a raw fixture or any match-like object to a canonical Match.
 */
export function mapRawMatch(raw: any): Match {
  if (!raw) return {} as Match;
  
  // Determine an ID
  const id = raw.fixture?.id ? `apf-${raw.fixture.id}` : (raw.id || `match-${Date.now()}`);
  
  // Use the canonical normalization logic
  return normalizeMatch(String(id), raw) as Match;
}

/**
 * Maps multiple fixtures to standard format
 */
export function mapRawMatches(rawList: any[]): Match[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapRawMatch).filter(m => m && !m.isHidden);
}

export function mapRawEvent(raw: any): MatchEvent {
  return {
    time: {
      elapsed: raw.time?.elapsed || 0,
      extra: raw.time?.extra || null
    },
    team: {
      id: raw.team?.id || 0,
      name: raw.team?.name || '',
      logo: raw.team?.logo
    },
    player: {
      id: raw.player?.id || null,
      name: raw.player?.name || ''
    },
    assist: {
      id: raw.assist?.id || null,
      name: raw.assist?.name || null
    },
    type: raw.type || '',
    detail: raw.detail || '',
    comments: raw.comments || null
  };
}

export function mapRawEvents(rawList: any[]): MatchEvent[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapRawEvent);
}

export function mapRawStats(rawList: any[]): MatchStat[] {
  if (!Array.isArray(rawList) || rawList.length < 2) return [];

  const homeStats = rawList[0]?.statistics || [];
  const awayStats = rawList[1]?.statistics || [];

  const types = Array.from(new Set([
    ...homeStats.map((s: any) => s.type),
    ...awayStats.map((s: any) => s.type)
  ])) as string[];

  return types.map(type => {
    const homeVal = homeStats.find((s: any) => s.type === type)?.value ?? 0;
    const awayVal = awayStats.find((s: any) => s.type === type)?.value ?? 0;
    return {
      type,
      home: homeVal,
      away: awayVal
    };
  });
}

export function mapRawLineups(rawList: any[]): TeamLineup[] {
  if (!Array.isArray(rawList)) return [];

  return rawList.map(item => {
    return {
      team: {
        id: item.team?.id || '',
        name: item.team?.name || '',
        logo: item.team?.logo || ''
      },
      formation: item.formation || '',
      startXI: (item.startXI || []).map((x: any) => ({
        player: {
          id: x.player?.id || 0,
          name: x.player?.name || '',
          number: x.player?.number || 0,
          pos: x.player?.pos || 'M',
          grid: x.player?.grid || null
        }
      })),
      substitutes: (item.substitutes || []).map((s: any) => ({
        player: {
          id: s.player?.id || 0,
          name: s.player?.name || '',
          number: s.player?.number || 0,
          pos: s.player?.pos || 'M',
          grid: s.player?.grid || null
        }
      })),
      coach: {
        name: item.coach?.name || '',
        photo: item.coach?.photo
      }
    };
  });
}

// BACKWARD COMPATIBILITY INTERFACES & HELPERS
export type MappedMatch = Match;

export function mapFootballDataResponse(rawMatch: any): MappedMatch {
  return normalizeMatch(String(rawMatch.id || Date.now()), rawMatch) as Match;
}


