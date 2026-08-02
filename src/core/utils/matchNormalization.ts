import { Match, Team, MatchScore, MatchStatus, MatchLeagueObj } from '../../types';
import { translateTeamName, translateLeagueName } from '../../utils/arabicTeamNames';
import { getTeamLogoUrl } from '../../utils/teamUtils';

/**
 * Universal date normalizer for Safara 90.
 * Safely handles:
 * - Firestore Timestamp object ({ toDate: () => Date })
 * - Firestore JSON map ({ _seconds: number } or { seconds: number })
 * - ISO date string
 * - Unix timestamp in seconds (e.g. 1785367800)
 * - Unix timestamp in milliseconds
 * - Native JS Date object
 */
export function normalizeMatchDate(dateData: any): Date | null {
  if (dateData === null || dateData === undefined) return null;

  // Native JS Date
  if (dateData instanceof Date) {
    return isNaN(dateData.getTime()) ? null : dateData;
  }

  // Firestore Timestamp with toDate() method
  if (typeof dateData === 'object' && typeof dateData.toDate === 'function') {
    try {
      const d = dateData.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      // Fall through if toDate throws
    }
  }

  // Firestore serialized object {_seconds, _nanoseconds} or {seconds, nanoseconds}
  if (typeof dateData === 'object' && dateData !== null) {
    const sec = dateData._seconds ?? dateData.seconds;
    if (typeof sec === 'number') {
      return new Date(sec * 1000);
    }
  }

  // Number: Unix timestamp (seconds or milliseconds)
  if (typeof dateData === 'number') {
    if (isNaN(dateData)) return null;
    // If less than 10^11, it's in seconds, otherwise milliseconds
    const ms = dateData < 1e11 ? dateData * 1000 : dateData;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // String (ISO or numeric string)
  if (typeof dateData === 'string') {
    const trimmed = dateData.trim();
    if (!trimmed) return null;
    
    // Numeric string check
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      const ms = num < 1e11 ? num * 1000 : num;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Validates match data and returns a robust ISO string, or null if invalid.
 */
export function parseValidDate(dateData: any): string | null {
  const d = normalizeMatchDate(dateData);
  return d ? d.toISOString() : null;
}

/**
 * Helper to get timestamp in milliseconds safely from any match date input.
 */
export function getMatchTimestamp(dateData: any): number {
  const d = normalizeMatchDate(dateData);
  return d ? d.getTime() : 0;
}

/**
 * Type Guard to check if a match has critical data
 */
export function isValidMatch(data: any): data is Match {
  if (!data.id) return false;
  if (!parseValidDate(data.startTime || data.utcDate || data.date || data.fixture?.date)) return false;
  return true;
}

/**
 * Normalizes any match-like object into the canonical Safara 90 Match format.
 */
export function normalizeMatch(id: string, data: any): Match | null {
  const isoDate = parseValidDate(data.startTime || data.utcDate || data.date || data.fixture?.date);
  
  if (!id || id === 'undefined' || id === 'null' || !isoDate) {
    console.debug(`[MatchNormalizer] Rejected Match ${id}: Missing ID or Invalid Date`, { id, data });
    return null;
  }

  const getTeamField = (field: any, key: 'name' | 'logo' | 'id' | 'tla') => {
    if (!field) return '';
    
    if (typeof field === 'string') {
      return key === 'name' ? field : '';
    }
    
    if (typeof field === 'object') {
      if (key === 'id') {
        return field.id || field.teamId || '';
      }
      if (key === 'name') {
        return field.name || field.shortName || field.displayName || field.teamName || '';
      }
      if (key === 'tla') {
        return field.tla || field.code || field.shortName || '';
      }
      if (key === 'logo') {
        const logo = field.logo || field.crest || field.emblem || field.image || field.url || field.teamLogo || '';
        if (logo && (logo.includes('unknown.png') || logo.includes('placeholder'))) return '';
        return logo;
      }
    }
    return '';
  };

  // 1. Extract raw names and logos
  const homeTeamSource = data.homeTeam || data.teams?.home || {};
  const awayTeamSource = data.awayTeam || data.teams?.away || {};
  const leagueSource = data.league || data.competition || {};

  const rawHomeName = String(getTeamField(homeTeamSource, 'name') || data.homeTeamName || data.homeName || '').trim();
  const rawAwayName = String(getTeamField(awayTeamSource, 'name') || data.awayTeamName || data.awayName || '').trim();
  const homeTla = String(getTeamField(homeTeamSource, 'tla') || '');
  const awayTla = String(getTeamField(awayTeamSource, 'tla') || '');

  const homeLogoRaw = String(getTeamField(homeTeamSource, 'logo') || data.homeLogo || data.homeTeamLogo || '').trim();
  const awayLogoRaw = String(getTeamField(awayTeamSource, 'logo') || data.awayLogo || data.awayTeamLogo || '').trim();

  const rawLeagueName = String(getTeamField(leagueSource, 'name') || data.leagueName || data.competition || data.league?.name || '').trim();
  const leagueLogo = String(getTeamField(leagueSource, 'logo') || data.leagueLogo || data.competitionLogo || data.league?.logo || data.league?.image || '').trim();

  const resolveTeamName = (rawName: string, source: any): string => {
    const isPlaceholder = (name: string) => {
      if (!name) return true;
      const lower = name.toLowerCase();
      return lower.includes('unknown') || 
             lower.includes('tbd') || 
             lower === 'team' ||
             lower === 'null' ||
             name === 'قيد التحديد';
    };

    if (rawName && !isPlaceholder(rawName)) return rawName;
    const altName = getTeamField(source, 'name');
    if (altName && !isPlaceholder(altName)) return altName;
    const translated = translateTeamName(rawName || altName || '');
    if (translated && !isPlaceholder(translated)) return translated;
    
    return rawName || 'قيد التحديد';
  };

  const homeName = resolveTeamName(rawHomeName, homeTeamSource);
  const awayName = resolveTeamName(rawAwayName, awayTeamSource);

  const leagueName = translateLeagueName(rawLeagueName) || rawLeagueName || 'بطولة غير متوفرة';

  const homeTeam: Team = {
    id: String(getTeamField(homeTeamSource, 'id') || data.homeTeamId || ''),
    name: homeName,
    logo: getTeamLogoUrl(homeLogoRaw, homeName || rawHomeName, homeTla),
    tla: homeTla,
  };

  const awayTeam: Team = {
    id: String(getTeamField(awayTeamSource, 'id') || data.awayTeamId || ''),
    name: awayName,
    logo: getTeamLogoUrl(awayLogoRaw, awayName || rawAwayName, awayTla),
    tla: awayTla,
  };

  const leagueDetails: MatchLeagueObj = (typeof leagueSource === 'object' && leagueSource !== null) 
    ? { ...leagueSource, name: leagueName, logo: leagueLogo || (leagueSource as any).logo || (leagueSource as any).crest }
    : { id: data.leagueId || 'manual', name: leagueName, logo: leagueLogo, country: 'Global' };

  const minute = data.minute ?? (data.elapsed ?? (data.fixture?.status?.elapsed ?? 0));
  const rawStatus = data.status || data.fixture?.status?.short || 'NS';
  const status = typeof rawStatus === 'object' ? (rawStatus.short || rawStatus.long || 'NS') : rawStatus;

  return {
    ...data,
    id,
    homeTeam,
    awayTeam,
    startTime: isoDate || '',
    utcDate: isoDate || '',
    minute,
    status,
    league: {
        id: leagueDetails.id,
        name: leagueName,
        logo: leagueDetails.logo || 'https://media.api-sports.io/football/leagues/unknown.png'
    },
    isLive: ['LIVE', '1H', '2H', 'HT', 'ET', 'P'].includes(status),
  } as Match;
}
