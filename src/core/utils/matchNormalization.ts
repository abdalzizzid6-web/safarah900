import { Match, Team, MatchScore, MatchStatus, MatchLeagueObj } from '../../types';
import { translateTeamName, translateLeagueName } from '../../utils/arabicTeamNames';
import { getTeamLogoUrl } from '../../utils/teamUtils';

/**
 * Normalizes any match-like object into the canonical Safara 90 Match format.
 * This ensures consistency across Admin panel, Frontend, and different API providers.
 */
export function normalizeMatch(id: string, data: any): Match {
  const processDate = (val: any) => {
    if (val && typeof val === 'object' && 'toDate' in val) {
      return val.toDate().toISOString();
    }
    return val;
  };

  const getTeamField = (field: any, key: 'name' | 'logo' | 'id' | 'tla') => {
    if (!field) return '';
    
    // If field is a string, it might be the name
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
        // If it's the known "unknown" logo, return empty so we can use our better fallback
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

  // 2. Resolve Identities with multi-tier logic
  const resolveTeamName = (rawName: string, source: any): string => {
    const isPlaceholder = (name: string) => {
      if (!name) return true;
      const lower = name.toLowerCase();
      return lower.includes('unknown') || 
             lower.includes('tbd') || 
             lower.includes('to be determined') ||
             lower.includes('winner match') ||
             lower.includes('winner of') ||
             lower.includes('runner-up') ||
             lower.includes('group') || // e.g. "1st Group A"
             lower.includes('loser') ||
             lower === 'team' ||
             lower === 'null' ||
             lower === 'undefined' ||
             name === 'قيد التحديد';
    };

    // 1. Primary API response
    if (rawName && !isPlaceholder(rawName)) return rawName;

    // 2. Alternative API fields
    const altName = getTeamField(source, 'name');
    if (altName && !isPlaceholder(altName)) return altName;

    // 3. Translation database
    const translated = translateTeamName(rawName || altName || '');
    if (translated && !isPlaceholder(translated)) return translated;

    // 4. Fallback to TLA
    const tla = getTeamField(source, 'tla');
    if (tla && tla.length >= 2 && !isPlaceholder(tla)) return tla;

    // IF IT'S STILL A PLACEHOLDER, use the rawName if available, otherwise "قيد التحديد"
    return rawName || 'قيد التحديد';
  };

  const homeName = resolveTeamName(rawHomeName, homeTeamSource);
  const awayName = resolveTeamName(rawAwayName, awayTeamSource);

  // Check if these are legitimate tournament placeholders
  const isTournamentPlaceholder = (name: string, raw: string) => {
      const lower = String(raw || '').toLowerCase();
      return lower.includes('winner') || 
             lower.includes('loser') || 
             lower.includes('runner-up') || 
             lower.includes('group') ||
             lower.includes('tbd') ||
             name === 'قيد التحديد';
  };

  const isHomePlaceholder = isTournamentPlaceholder(homeName, rawHomeName);
  const isAwayPlaceholder = isTournamentPlaceholder(awayName, rawAwayName);
  const matchIsPlaceholder = isHomePlaceholder || isAwayPlaceholder;

  const leagueName = translateLeagueName(rawLeagueName) || rawLeagueName || 'بطولة غير متوفرة';

  // 3. Score validation
  const homeScore = data.homeScore ?? (data.score?.home ?? (data.score?.fullTime?.home ?? (data.goals?.home ?? null)));
  const awayScore = data.awayScore ?? (data.score?.away ?? (data.score?.fullTime?.away ?? (data.goals?.away ?? null)));
  const halfTimeHome = data.halfTimeHome ?? (data.score?.halfTime?.home ?? undefined);
  const halfTimeAway = data.halfTimeAway ?? (data.score?.halfTime?.away ?? undefined);

  // 4. Construct canonical objects
  const homeTeam: Team = {
    id: String(getTeamField(homeTeamSource, 'id') || data.homeTeamId || ''),
    name: homeName,
    logo: getTeamLogoUrl(homeLogoRaw, homeName || rawHomeName, homeTla),
    tla: homeTla,
    isPlaceholder: isHomePlaceholder
  };

  const awayTeam: Team = {
    id: String(getTeamField(awayTeamSource, 'id') || data.awayTeamId || ''),
    name: awayName,
    logo: getTeamLogoUrl(awayLogoRaw, awayName || rawAwayName, awayTla),
    tla: awayTla,
    isPlaceholder: isAwayPlaceholder
  };

  // Validation: Only hide if critical data is missing
  const hasValidId = !!id && id !== 'undefined' && id !== 'null';
  const hasValidDate = !!(data.startTime || data.utcDate || data.date || data.matchDate);
  
  let hiddenReason = '';
  if (!hasValidId) hiddenReason = 'Missing Fixture ID';
  else if (!hasValidDate) hiddenReason = 'Missing Temporal Data';
  
  // RELAXED: If it's a placeholder, identity is technically resolved for a bracket
  const identityResolved = (!!homeName && !!awayName) || matchIsPlaceholder;
  const isInvalid = !hasValidId || !hasValidDate;

  if (isInvalid) {
    console.warn(`[Normalization] Match ${id} critically invalid: ${hiddenReason}`, {
      rawHomeName,
      rawAwayName,
      homeName,
      awayName
    });
  }

  const leagueDetails: MatchLeagueObj = (typeof leagueSource === 'object' && leagueSource !== null) 
    ? { ...leagueSource, name: leagueName, logo: leagueLogo || (leagueSource as any).logo || (leagueSource as any).crest || (leagueSource as any).emblem }
    : { id: data.leagueId || 'manual', name: leagueName, logo: leagueLogo, country: 'Global' };

  // Ensure league logo is never empty
  if (!leagueDetails.logo) {
      leagueDetails.logo = leagueLogo || 'https://media.api-sports.io/football/leagues/unknown.png';
  }

  const stadium = data.stadium || data.venue || data.fixture?.venue?.name || data.matchStadium || '';
  const minute = data.minute ?? (data.elapsed ?? (data.fixture?.status?.elapsed ?? 0));

  const rawStatus = data.status || data.fixture?.status?.short || 'NS';
  const status = typeof rawStatus === 'object' ? (rawStatus.short || rawStatus.long || 'NS') : rawStatus;

  // 5. Build final Match object
  return {
    ...data,
    id,
    homeTeam,
    awayTeam,
    homeName: homeTeam.name,
    awayName: awayTeam.name,
    homeLogo: homeTeam.logo,
    awayLogo: awayTeam.logo,
    stadium,
    minute,
    elapsed: minute,
    status,
    league: {
        id: leagueDetails.id,
        name: leagueName,
        logo: leagueDetails.logo
    },
    leagueName,
    leagueLogo: leagueDetails.logo,
    leagueDetails: {
      ...leagueDetails,
      name: leagueName,
      logo: leagueDetails.logo
    },
    homeScore,
    awayScore,
    score: { 
      home: homeScore, 
      away: awayScore,
      halfTimeHome,
      halfTimeAway
    },
    startTime: processDate(data.startTime || data.utcDate || data.date || data.matchDate || ''),
    utcDate: processDate(data.utcDate || data.startTime || data.date || data.matchDate || ''),
    isLive: !!(data.isLive || status === 'LIVE' || status === 'IN_PLAY' || status === '1H' || status === '2H' || status === 'HT' || status === 'ET' || status === 'P'),
    competition: {
      name: leagueName,
      emblem: leagueLogo || leagueDetails.logo
    },
    metadata: {
      ...data.metadata,
      hiddenReason,
      identityResolved,
      originalHomeName: rawHomeName,
      originalAwayName: rawAwayName
    },
    approved: data.approved === true,
    isManual: !!data.isManual,
    isHidden: data.isHidden === true || isInvalid,
    source: data.source || (data.isManual ? 'manual' : 'api-football'),
    syncStatus: data.syncStatus || 'synced'
  } as Match;
}
