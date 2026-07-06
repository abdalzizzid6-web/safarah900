import { matchesRepositoryV2, MatchStatus } from '../../../core/repository/MatchesRepositoryV2';
import { Match } from '../../../types';

export { MatchStatus };

export interface MatchVersion {
  id: string;
  matchId: string;
  editorId: string;
  editorName: string;
  timestamp: any;
  data: any;
  previousData?: any;
  changedFields: string[];
  note?: string;
}

export interface MatchAuditLog {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  action: 'Create' | 'Update' | 'Delete' | 'Publish' | 'Archive' | 'Restore' | 'Approve' | 'Reject' | 'Duplicate' | 'BulkAction' | 'ScoreUpdate' | 'LiveUpdate' | 'StatisticsUpdate' | 'QuickEdit' | 'EventAdded';
  details: string;
  timestamp: any;
}

export interface MatchLock {
  matchId: string;
  userId: string;
  userName: string;
  expiresAt: any;
  editingSince: any;
}

export const matchEnterpriseService = {
  // Audit Logging
  async logAction(log: Omit<MatchAuditLog, 'id' | 'timestamp'>) {
    await matchesRepositoryV2.logAction(log);
  },

  // Versioning
  async createVersion(matchId: string, data: any, editorId: string, editorName: string, previousData?: any, note?: string) {
    await matchesRepositoryV2.createVersion(matchId, data, editorId, editorName, previousData, note);
  },

  async getVersions(matchId: string) {
    return await matchesRepositoryV2.getVersions(matchId);
  },

  async getAuditLogs(matchId: string) {
    return await matchesRepositoryV2.getAuditLogs(matchId);
  },

  // Locking
  async acquireLock(matchId: string, userId: string, userName: string) {
    return await matchesRepositoryV2.acquireLock(matchId, userId, userName);
  },

  async releaseLock(matchId: string, userId: string) {
    await matchesRepositoryV2.releaseLock(matchId, userId);
  },

  async forceUnlock(matchId: string) {
    await matchesRepositoryV2.forceUnlock(matchId);
  },

  // Soft Delete
  async softDelete(matchId: string, userId: string, userName: string) {
    await matchesRepositoryV2.softDelete(matchId, userId, userName);
  },

  async restoreMatch(matchId: string, userId: string, userName: string) {
    await matchesRepositoryV2.restoreMatch(matchId, userId, userName);
  },

  // Bulk Actions
  async bulkUpdateStatus(ids: string[], status: MatchStatus, userId: string, userName: string) {
    await matchesRepositoryV2.bulkUpdate(ids, { status: status as any });

    for (const id of ids) {
      await this.logAction({
        matchId: id,
        userId,
        userName,
        action: 'BulkAction',
        details: `Bulk status update to ${status}`
      });
    }
  },

  async addMatchEvent(matchId: string, event: any, userId: string, userName: string) {
    await matchesRepositoryV2.addMatchEvent(matchId, event, userId, userName);
  },

  async updateMatchStatus(matchId: string, status: MatchStatus, userId: string, userName: string) {
    await matchesRepositoryV2.update(matchId, { status: status as any });

    await this.logAction({
      matchId,
      userId,
      userName,
      action: 'Update',
      details: `Match status updated to ${status}`
    });
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
