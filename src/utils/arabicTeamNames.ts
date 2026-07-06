import { translationService } from '../services/translationService';

/**
 * Legacy translation map, kept empty as we now use the central translation service.
 */
export const ARABIC_TEAM_NAMES: Record<string, string> = {};

/**
 * Translates a team name if it exists in the mapping.
 */
export function translateTeamName(name: string): string {
  return translationService.translateTeam(name);
}

/**
 * Translates a league name if it exists in the mapping.
 */
export function translateLeagueName(name: string): string {
  return translationService.translateCompetition(name);
}
