export interface NormalizedMatch {
  id: string;
  homeTeam: any;
  awayTeam: any;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  status: string;
  league: any;
  leagueName: string;
  utcDate: any;
  slug: string;
  isHidden?: boolean;
  metadata?: any;
  startTime?: any;
  isLive?: boolean;
}

export const normalizeMatch = (data: any): NormalizedMatch => {
  const getTeamField = (field: any, key: 'name' | 'logo' | 'id' | 'tla') => {
    if (!field) return '';
    if (typeof field === 'string') return key === 'name' ? field : '';
    if (typeof field === 'object') {
      if (key === 'id') return (field.id || field.teamId || '').toString();
      if (key === 'name') return field.name || field.shortName || field.displayName || field.teamName || '';
      if (key === 'tla') return field.tla || field.code || '';
      if (key === 'logo') return field.logo || field.crest || field.emblem || field.image || field.url || '';
    }
    return '';
  };

  const rawHome = getTeamField(data.homeTeam || data.teams?.home, 'name') || data.homeTeamName || data.homeName || '';
  const rawAway = getTeamField(data.awayTeam || data.teams?.away, 'name') || data.awayTeamName || data.awayName || '';
  const rawLeague = getTeamField(data.league || data.competition, 'name') || data.leagueName || '';

  // Identity Resolver
  const resolveName = (raw: string) => {
    const isPlaceholder = (name: string) => {
      if (!name) return true;
      const lower = name.toLowerCase();
      return lower.includes('unknown') || 
             lower.includes('tbd') || 
             lower.includes('to be determined') ||
             lower.includes('winner match') ||
             lower.includes('winner of') ||
             lower.includes('runner-up') ||
             lower.includes('group') ||
             lower.includes('loser') ||
             lower === 'team' ||
             lower === 'null' ||
             lower === 'undefined' ||
             name === 'قيد التحديد';
    };
    if (raw && !isPlaceholder(raw)) return raw;
    return 'قيد التحديد';
  };

  const homeName = resolveName(rawHome);
  const awayName = resolveName(rawAway);

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

  const isHomePlaceholder = isTournamentPlaceholder(homeName, rawHome);
  const isAwayPlaceholder = isTournamentPlaceholder(awayName, rawAway);
  const matchIsPlaceholder = isHomePlaceholder || isAwayPlaceholder;

  const leagueName = rawLeague || 'بطولة غير متوفرة';

  const homeTeam = {
    id: getTeamField(data.homeTeam || data.teams?.home, 'id'),
    name: homeName,
    logo: getTeamField(data.homeTeam || data.teams?.home, 'logo'),
    tla: getTeamField(data.homeTeam || data.teams?.home, 'tla'),
    isPlaceholder: isHomePlaceholder
  };

  const awayTeam = {
    id: getTeamField(data.awayTeam || data.teams?.away, 'id'),
    name: awayName,
    logo: getTeamField(data.awayTeam || data.teams?.away, 'logo'),
    tla: getTeamField(data.awayTeam || data.teams?.away, 'tla'),
    isPlaceholder: isAwayPlaceholder
  };

  const league = {
    id: getTeamField(data.league || data.competition, 'id'),
    name: leagueName,
    logo: getTeamField(data.league || data.competition, 'logo')
  };

  // Validation: Only hide if critical data is missing
  const identityResolved = (!!homeName && !!awayName) || matchIsPlaceholder;
  const isInvalid = !data.id || (!data.utcDate && !data.startTime);
  let hiddenReason = '';
  if (!data.id) hiddenReason = 'Missing Fixture ID';
  else if (!data.utcDate && !data.startTime) hiddenReason = 'Missing Temporal Data';
  
  if (isInvalid) {
    console.warn(`[ServerNormalizer] Match ${data.id} critically rejected: ${hiddenReason}`, { rawHome, rawAway, homeName, awayName });
  }

  // Use a safe regex-based lowercase replacement to build the slug path
  const sanitizeSlugPart = (name: string) => (name || 'team').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '');
  const homeSlug = sanitizeSlugPart(homeName);
  const awaySlug = sanitizeSlugPart(awayName);
  const slug = data.slug || `${homeSlug}-vs-${awaySlug}-${data.id || 'match'}`;

  // Temporal normalization (Handle Firestore Timestamps)
  const normalizeDate = (d: any) => {
    if (!d) return new Date().toISOString();
    if (typeof d === 'object') {
      if (d._seconds !== undefined) return new Date(d._seconds * 1000).toISOString();
      if (typeof d.toDate === 'function') return d.toDate().toISOString();
      if (d instanceof Date) return d.toISOString();
      // Try to construct from object if it has year/month etc (unlikely but safe)
      try { return new Date(d).toISOString(); } catch (e) {}
    }
    return String(d);
  };

  const dateValue = normalizeDate(data.utcDate || data.startTime);

  return {
    id: String(data.id || ''),
    homeTeam,
    awayTeam,
    homeName,
    awayName,
    homeScore: Number(data.homeScore ?? (data.score?.home ?? 0)),
    awayScore: Number(data.awayScore ?? (data.score?.away ?? 0)),
    status: data.status || 'NS',
    league,
    leagueName,
    utcDate: dateValue,
    slug: slug,
    isHidden: isInvalid,
    startTime: data.startTime || data.utcDate || null,
    isLive: data.isLive || data.status === 'LIVE' || data.status === 'IN_PLAY' || ['1H', '2H', 'HT', 'ET', 'P'].includes(data.status),
    metadata: {
      ...data.metadata,
      hiddenReason,
      identityResolved
    }
  };
};

export const normalizeTeam = (data: any) => ({
  id: String(data.id || ''),
  name: data.name || '',
  slug: data.slug || (data.name || 'team').toLowerCase().replace(/\s+/g, '-'),
});

export const normalizeLeague = (data: any) => ({
  id: String(data.id || ''),
  name: data.name || '',
  slug: data.slug || (data.name || 'league').toLowerCase().replace(/\s+/g, '-'),
});

export const normalizeNews = (data: any) => ({
  id: String(data.id || ''),
  title: data.title || '',
  slug: data.seo?.slug || data.slug || data.id,
});
