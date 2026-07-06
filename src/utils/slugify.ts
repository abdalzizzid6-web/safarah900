/**
 * Safely extracts a string from any input, even if it is an object.
 * This completely prevents [object Object] leaks.
 */
export function safeExtractString(val: any): string {
  if (!val) return "";
  if (typeof val === 'string') {
    if (val.includes('[object Object]') || val.includes('object-object')) {
      return "team";
    }
    return val;
  }
  if (typeof val === 'object') {
    return getSafeTeamName(val);
  }
  return String(val);
}

/**
 * Safely extracts a team name from a team object with a fallback hierarchy.
 */
export function getSafeTeamName(team: any): string {
  if (!team) return "team";
  if (typeof team === 'string') return team;
  return team.name || team.arabicName || team.shortName || team.englishName || "team";
}

/**
 * Converts a string into an SEO-friendly slug.
 * Supports Arabic characters by preserving them while removing special characters.
 */
export function slugify(text: any): string {
  const cleanText = safeExtractString(text);
  if (!cleanText) return "";
  
  return cleanText
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\u0621-\u064A-]+/g, '') // Remove all non-word chars (preserving Arabic)
    .replace(/--+/g, '-')           // Replace multiple - with single -
    .replace(/^-+/, '')               // Trim - from start of text
    .replace(/-+$/, '');              // Trim - from end of text
}

/**
 * Extracts ID from a slugged URL (e.g., "my-title-123" -> "123")
 * If the string doesn't follow the slug-id pattern (no numeric ID at end),
 * it returns the whole string to allow name-based lookups.
 * Handles prefixes like wc-, api-, manual-, live-.
 */
export function getIdFromSlug(slug: string): string {
  if (!slug) return "";
  
  // 1. Pure numeric ID (likely from API Football)
  if (/^\d+$/.test(slug)) return slug;

  // 2. If it contains hyphens, it's likely a slug (or a prefixed ID)
  if (slug.includes('-')) {
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    
    // Case 1: Prefixed IDs at the end (api-123, manual-123, live-123)
    if (parts.length >= 2) {
      const secondToLast = parts[parts.length - 2];
      if (['api', 'manual', 'live'].includes(secondToLast)) {
        return `${secondToLast}-${lastPart}`;
      }
    }
    
    // Case 2: World Cup pattern (contains 'wc' followed by tournament/match segments)
    // We look for 'wc' and join everything from there to the end
    for (let i = parts.length - 2; i >= 0; i--) {
      if (parts[i] === 'wc') {
        return parts.slice(i).join('-');
      }
    }

    // Case 3: Year-based World Cup segment (e.g. 2026-m-12, 2022-m-1)
    // If a part is a 4-digit year followed by 'm' or 'fallback' or 'match'
    for (let i = parts.length - 3; i >= 0; i--) {
      if (/^\d{4}$/.test(parts[i]) && ['m', 'fallback', 'match'].includes(parts[i + 1])) {
        return parts.slice(i).join('-');
      }
    }

    // Fallback for standard slugs: extract the last part if it looks like an ID
    if (/^\d+$/.test(lastPart) || (lastPart.length >= 10 && /^[a-zA-Z0-9_]+$/.test(lastPart))) {
      return lastPart;
    }
    
    // If it's a direct World Cup slug pattern that didn't match the loop
    if (slug.startsWith('wc-')) return slug;
  }
  
  // 3. Likely a direct Firestore ID (no spaces, alphanumeric, usually 15+ chars)
  // We exclude strings that look like slugs (handled above)
  if (slug.length >= 15 && /^[a-zA-Z0-9_-]+$/.test(slug) && !slug.includes(' ') && !slug.includes('-')) {
    return slug;
  }
  
  // Otherwise, return the whole slug
  return slug;
}

/**
 * Creates a combined slug-id format for compatibility (e.g., "title-123")
 */
export function createSlugPath(titleOrTeams: any, id: string | number): string {
  let title = titleOrTeams;
  if (typeof titleOrTeams === 'object' && titleOrTeams !== null) {
      if (titleOrTeams.homeTeam && titleOrTeams.awayTeam) {
          title = `${getSafeTeamName(titleOrTeams.homeTeam)}-vs-${getSafeTeamName(titleOrTeams.awayTeam)}`;
      } else {
          title = getSafeTeamName(titleOrTeams);
      }
  }
  
  if (typeof title === 'string' && (title.includes('[object') || title.includes('object-object'))) {
    // String interpolation already leaked. Let's repair it by returning a fallback
    return `match-${id}`;
  }
  const base = slugify(title);
  if (!base || base === 'object' || base === 'object-object') return id.toString();
  return `${base}-${id}`;
}
