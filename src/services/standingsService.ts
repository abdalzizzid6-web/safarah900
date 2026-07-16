import { matchesRepositoryV2 } from '../core/repository/MatchesRepositoryV2';
import { LeagueStandings } from '../types';
import apiClient from '../api/apiClient';

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
  },

  async fetchAndUpdateLeagueStandings(leagueId: string): Promise<boolean> {
    try {
      // 1. Get league association details from localStorage falling back to environment
      let apiLeagueId = '';
      let apiSeason = String(new Date().getFullYear());

      try {
        const localSaved = localStorage.getItem(`kora90_league_mappings_${leagueId}`);
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          apiLeagueId = parsed.apiLeagueId ? String(parsed.apiLeagueId) : '';
          apiSeason = parsed.apiSeason ? String(parsed.apiSeason) : apiSeason;
        }
      } catch(e){}

      // Fallbacks if not mapped locally, standard IDs
      if (!apiLeagueId) {
        if (leagueId === '39') apiLeagueId = '39';
        else if (leagueId === '140') apiLeagueId = '140';
        else if (leagueId === '307') apiLeagueId = '307';
        else if (leagueId === '2') apiLeagueId = '2';
        else apiLeagueId = leagueId;
      }

      // 2. Fetch via independent standings service (which uses Axios and Cache)
      const result = await this.getStandings(apiLeagueId, apiSeason);
      
      if (result && result.standings && result.standings.length > 0) {
        console.log(`[standingsService] Standings successfully populated & cached for league ${leagueId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error fetching standings:", error);
      return false;
    }
  },

  async fetchAndUpdateAllMatchedLeagues(): Promise<{success: number, failed: number}> {
    let successCount = 0;
    let failedCount = 0;
    
    try {
      // Standard matched leagues and any custom local files
      const leaguesToSync = ['39', '140', '307', '2'];
      for (const leagueId of leaguesToSync) {
        const success = await this.fetchAndUpdateLeagueStandings(leagueId);
        if (success) successCount++;
        else failedCount++;
      }
    } catch (err) {
      console.error("Error fetching all standings:", err);
    }
    
    return { success: successCount, failed: failedCount };
  }
};
