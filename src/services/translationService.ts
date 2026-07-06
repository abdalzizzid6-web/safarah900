// src/services/translationService.ts
import { TEAMS_AR } from '../data/translations/teams.ar';
import { COUNTRIES_AR } from '../data/translations/countries.ar';
import { COMPETITIONS_AR } from '../data/translations/competitions.ar';
import { STADIUMS_AR } from '../data/translations/stadiums.ar';
import { STATISTICS_AR } from '../data/translations/statistics.ar';

// Maintain a global ledger of requested vs untranslated elements for real-time compliance reporting
const untranslatedSet = new Set<string>();
const translatedSet = new Set<string>();

function normalizeName(name: string): string {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
}

// Clean names from common English prefixes/suffixes to find more flexible translation matches
function cleanSuffixes(name: string): string {
  return name
    .replace(/\b(FC|CF|SC|RC|FK|AC|UD|RCD|VfL|VfB|TSG|OGC|RS|RSB|CAF|UEFA|AFC|FIFA)\b/g, '')
    .replace(/\b(United|City|Town|Hotspur|Wanderers|Albion|Athletic|Club|Saint-Germain|Munich|Dortmund|Madrid|Barca|Barcelona|Saint Etienne|Brestois|Brest|Olimpico|Olympiastadion|Metropolitano|Arena|Stadium|Pro League|Premier|Cup|World Cup|Euro)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export const translationService = {
  /**
   * Translates a football team name
   */
  translateTeam(name: string | undefined | null): string {
    if (!name) return '';
    const original = String(name);
    const normalized = normalizeName(original);

    // 1. Direct match check in TEAMS_AR
    if (TEAMS_AR[normalized]) {
      translatedSet.add(normalized);
      return TEAMS_AR[normalized];
    }

    // 2. Case-insensitive check
    const matchedKey = Object.keys(TEAMS_AR).find(
      (key) => key.toLowerCase() === normalized.toLowerCase()
    );
    if (matchedKey) {
      translatedSet.add(normalized);
      return TEAMS_AR[matchedKey];
    }

    // 3. Fallback check in COUNTRIES_AR (since international teams often use country names)
    if (COUNTRIES_AR[normalized]) {
      translatedSet.add(normalized);
      return COUNTRIES_AR[normalized];
    }

    // 4. Clean suffix match check
    const cleaned = cleanSuffixes(normalized);
    if (cleaned && cleaned !== normalized) {
      if (TEAMS_AR[cleaned]) {
        translatedSet.add(normalized);
        return TEAMS_AR[cleaned];
      }
      const matchedCleanedKey = Object.keys(TEAMS_AR).find(
        (key) => key.toLowerCase() === cleaned.toLowerCase()
      );
      if (matchedCleanedKey) {
        translatedSet.add(normalized);
        return TEAMS_AR[matchedCleanedKey];
      }
    }

    // Dynamic translation rules for national teams (e.g. "Germany U21" -> "ألمانيا تحت 21 سنة")
    if (normalized.toLowerCase().includes(' u21')) {
      const baseCountry = normalized.replace(/ u21/gi, '').trim();
      return `${this.translateTeam(baseCountry)} تحت 21 سنة`;
    }
    if (normalized.toLowerCase().includes(' u23')) {
      const baseCountry = normalized.replace(/ u23/gi, '').trim();
      return `${this.translateTeam(baseCountry)} تحت 23 سنة`;
    }
    if (normalized.toLowerCase().includes(' u19')) {
      const baseCountry = normalized.replace(/ u19/gi, '').trim();
      return `${this.translateTeam(baseCountry)} تحت 19 سنة`;
    }
    if (normalized.toLowerCase().includes(' women')) {
      const baseCountry = normalized.replace(/ women/gi, '').trim();
      return `سيدات ${this.translateTeam(baseCountry)}`;
    }

    untranslatedSet.add(normalized);
    return original;
  },

  /**
   * Translates an international country or nationality name
   */
  translateCountry(name: string | undefined | null): string {
    if (!name) return '';
    const original = String(name);
    const normalized = normalizeName(original);

    if (COUNTRIES_AR[normalized]) {
      translatedSet.add(normalized);
      return COUNTRIES_AR[normalized];
    }

    const matchedKey = Object.keys(COUNTRIES_AR).find(
      (key) => key.toLowerCase() === normalized.toLowerCase()
    );
    if (matchedKey) {
      translatedSet.add(normalized);
      return COUNTRIES_AR[matchedKey];
    }

    untranslatedSet.add(normalized);
    return original;
  },

  /**
   * Translates a football tournament or league
   */
  translateCompetition(name: string | undefined | null): string {
    if (!name) return '';
    const original = String(name);
    const normalized = normalizeName(original);

    if (COMPETITIONS_AR[normalized]) {
      translatedSet.add(normalized);
      return COMPETITIONS_AR[normalized];
    }

    const matchedKey = Object.keys(COMPETITIONS_AR).find(
      (key) => key.toLowerCase() === normalized.toLowerCase()
    );
    if (matchedKey) {
      translatedSet.add(normalized);
      return COMPETITIONS_AR[matchedKey];
    }

    // Dynamic match translation rules (e.g., "La Liga - Round 14" -> "الدوري الإسباني - الجولة 14")
    const roundMatch = normalized.match(/(.*)\s*-\s*Round\s*(\d+)/i);
    if (roundMatch) {
      const baseComp = this.translateCompetition(roundMatch[1]);
      return `${baseComp} - الجولة ${roundMatch[2]}`;
    }

    const groupMatch = normalized.match(/Group\s*([A-H])/i);
    if (groupMatch) {
      const groupLetter = groupMatch[1];
      const translatedGroup = COMPETITIONS_AR[`Group ${groupLetter}`] || `المجموعة ${groupLetter}`;
      return translatedGroup;
    }

    untranslatedSet.add(normalized);
    return original;
  },

  /**
   * Translates a stadium name or stadium location
   */
  translateStadium(name: string | undefined | null): string {
    if (!name) return '';
    const original = String(name);
    const normalized = normalizeName(original);

    if (STADIUMS_AR[normalized]) {
      translatedSet.add(normalized);
      return STADIUMS_AR[normalized];
    }

    const matchedKey = Object.keys(STADIUMS_AR).find(
      (key) => key.toLowerCase() === normalized.toLowerCase()
    );
    if (matchedKey) {
      translatedSet.add(normalized);
      return STADIUMS_AR[matchedKey];
    }

    untranslatedSet.add(normalized);
    return original;
  },

  /**
   * Translates football match statistics and numerical data titles
   */
  translateStatistic(name: string | undefined | null): string {
    if (!name) return '';
    const original = String(name);
    const normalized = normalizeName(original);

    if (STATISTICS_AR[normalized]) {
      translatedSet.add(normalized);
      return STATISTICS_AR[normalized];
    }

    const matchedKey = Object.keys(STATISTICS_AR).find(
      (key) => key.toLowerCase() === normalized.toLowerCase()
    );
    if (matchedKey) {
      translatedSet.add(normalized);
      return STATISTICS_AR[matchedKey];
    }

    untranslatedSet.add(normalized);
    return original;
  },

  /**
   * Translates a match live-status code (FT, HT, NS, IN_PLAY, etc.)
   */
  translateStatus(status: string | undefined | null): string {
    if (!status) return '';
    const original = String(status);
    const normalized = normalizeName(original);

    if (STATISTICS_AR[normalized]) {
      return STATISTICS_AR[normalized];
    }

    const matchedKey = Object.keys(STATISTICS_AR).find(
      (key) => key.toLowerCase() === normalized.toLowerCase()
    );
    if (matchedKey) {
      return STATISTICS_AR[matchedKey];
    }

    return original;
  },

  /**
   * Translates a player tactical position (Goalkeeper, G, Midfielder, etc.)
   */
  translatePosition(pos: string | undefined | null): string {
    if (!pos) return '';
    const original = String(pos);
    const normalized = normalizeName(original);

    if (STATISTICS_AR[normalized]) {
      return STATISTICS_AR[normalized];
    }

    const matchedKey = Object.keys(STATISTICS_AR).find(
      (key) => key.toLowerCase() === normalized.toLowerCase()
    );
    if (matchedKey) {
      return STATISTICS_AR[matchedKey];
    }

    return original;
  },

  /**
   * Translates a complex block of text or news headline by replacing team, country, and tournament keywords with Arabic equivalents.
   */
  translateText(text: string | undefined | null): string {
    if (!text) return '';
    let result = String(text);

    // Translate any known competitions
    Object.keys(COMPETITIONS_AR).forEach((en) => {
      const ar = COMPETITIONS_AR[en];
      const regex = new RegExp(`\\b${en}\\b`, 'gi');
      result = result.replace(regex, ar);
    });

    // Translate any known teams
    Object.keys(TEAMS_AR).forEach((en) => {
      const ar = TEAMS_AR[en];
      const regex = new RegExp(`\\b${en}\\b`, 'gi');
      result = result.replace(regex, ar);
    });

    // Translate any known countries
    Object.keys(COUNTRIES_AR).forEach((en) => {
      const ar = COUNTRIES_AR[en];
      const regex = new RegExp(`\\b${en}\\b`, 'gi');
      result = result.replace(regex, ar);
    });

    // Handle standard English terms inside news blocks
    result = result
      .replace(/\bvs\b/gi, 'ضد')
      .replace(/\band\b/gi, 'و')
      .replace(/\bwins\b/gi, 'يفوز على')
      .replace(/\bdraws\b/gi, 'يتعادل مع')
      .replace(/\bloses to\b/gi, 'يخسر أمام')
      .replace(/\bmatch\b/gi, 'مباراة')
      .replace(/\bgoal\b/gi, 'هدف')
      .replace(/\bgoals\b/gi, 'أهداف');

    return result;
  },

  /**
   * Backward-compatible promise-based translate helper.
   */
  async translate(name: string, type: 'team' | 'country' | 'league' | 'stadium'): Promise<string> {
    if (!name) return '';
    switch (type) {
      case 'team':
        return this.translateTeam(name);
      case 'country':
        return this.translateCountry(name);
      case 'league':
        return this.translateCompetition(name);
      case 'stadium':
        return this.translateStadium(name);
      default:
        return name;
    }
  },

  /**
   * Calculates translation coverage diagnostics
   */
  getDiagnostics() {
    const totalRequests = translatedSet.size + untranslatedSet.size;
    const coveragePercentage = totalRequests > 0 ? Math.round((translatedSet.size / totalRequests) * 100) : 100;
    return {
      translatedCount: translatedSet.size,
      untranslatedCount: untranslatedSet.size,
      untranslatedElements: Array.from(untranslatedSet),
      coveragePercentage
    };
  }
};
