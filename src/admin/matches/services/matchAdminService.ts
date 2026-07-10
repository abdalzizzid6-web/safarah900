import { Match } from '@/types';
import { matchesRepositoryV2, MatchStatus, MatchVersion, MatchAuditLog } from '@/core/repository/MatchesRepositoryV2';

export { MatchStatus };
export type { MatchVersion, MatchAuditLog };

export const matchAdminService = {
  // Subscriptions
  subscribeToMatches: (callback: (matches: Match[]) => void) => {
    return matchesRepositoryV2.subscribeToMatches(callback);
  },

  // Basic CRUD
  getMatches: async (): Promise<Match[]> => {
    return await matchesRepositoryV2.getMatches();
  },

  updateMatch: async (id: string, data: Partial<Match>) => {
    return await matchesRepositoryV2.update(id, data);
  },

  createMatch: async (id: string, data: Partial<Match>) => {
    return await matchesRepositoryV2.setById(id, data);
  },

  deleteMatch: async (id: string) => {
    return await matchesRepositoryV2.delete(id);
  },

  bulkUpdate: async (ids: string[], data: Partial<Match>) => {
    return await matchesRepositoryV2.bulkUpdate(ids, data);
  },

  bulkDelete: async (ids: string[]) => {
    return await matchesRepositoryV2.bulkDelete(ids);
  },

  // Enterprise Features
  async logAction(log: Omit<MatchAuditLog, 'id' | 'timestamp'>) {
    await matchesRepositoryV2.logAction(log);
  },

  async createVersion(matchId: string, data: any, editorId: string, editorName: string, previousData?: any, note?: string) {
    await matchesRepositoryV2.createVersion(matchId, data, editorId, editorName, previousData, note);
  },

  async getVersions(matchId: string) {
    return await matchesRepositoryV2.getVersions(matchId);
  },

  async getAuditLogs(matchId: string) {
    return await matchesRepositoryV2.getAuditLogs(matchId);
  },

  async acquireLock(matchId: string, userId: string, userName: string) {
    return await matchesRepositoryV2.acquireLock(matchId, userId, userName);
  },

  async releaseLock(matchId: string, userId: string) {
    await matchesRepositoryV2.releaseLock(matchId, userId);
  },

  async forceUnlock(matchId: string) {
    await matchesRepositoryV2.forceUnlock(matchId);
  },

  async softDelete(matchId: string, userId: string, userName: string) {
    await matchesRepositoryV2.softDelete(matchId, userId, userName);
  },

  async restoreMatch(matchId: string, userId: string, userName: string) {
    await matchesRepositoryV2.restoreMatch(matchId, userId, userName);
  },

  async addMatchEvent(matchId: string, event: any, userId: string, userName: string) {
    await matchesRepositoryV2.addMatchEvent(matchId, event, userId, userName);
  },

  // Import / Export
  exportMatches(matches: Match[], format: 'csv' | 'json') {
    if (format === 'json') {
      return JSON.stringify(matches, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['id', 'homeTeam', 'awayTeam', 'status', 'startTime', 'league', 'score'];
      const rows = matches.map(m => {
        const homeName = typeof m.homeTeam === 'string' ? m.homeTeam : (m.homeTeam as any)?.name || '';
        const awayName = typeof m.awayTeam === 'string' ? m.awayTeam : (m.awayTeam as any)?.name || '';
        return [
          m.id,
          homeName,
          awayName,
          m.status,
          m.startTime || '',
          typeof m.league === 'string' ? m.league : (m.league as any)?.name || '',
          `${m.score?.home || 0}-${m.score?.away || 0}`
        ].join(',');
      });
      
      return [headers.join(','), ...rows].join('\n');
    }
    
    return '';
  }
};
