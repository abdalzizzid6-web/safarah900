import { matchesRepositoryV2 } from '../core/repository/MatchesRepositoryV2';
import { LeagueStandings } from '../types';

export const standingsService = {
  /**
   * Fetch league standings - Uses Repository V2 (Network -> Firestore fallback)
   */
  async getStandings(leagueId: string | number, season?: string | number): Promise<LeagueStandings> {
    const apiLeagueId = String(leagueId).replace('apf-', '');
    const currentYear = season ? String(season) : String(new Date().getFullYear());
    
    try {
      const standings = await matchesRepositoryV2.getStandings(apiLeagueId);
      
      return {
        leagueId: Number(apiLeagueId),
        leagueName: 'جدول الترتيب',
        season: Number(currentYear),
        standings: standings || []
      };
    } catch (error) {
      console.error('[standingsService] Error fetching standings:', error);
      return {
        leagueId: Number(apiLeagueId),
        leagueName: 'جدول الترتيب',
        season: Number(currentYear),
        standings: []
      };
    }
  }
};
