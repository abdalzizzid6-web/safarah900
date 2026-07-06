import { worldCupService } from './worldCupService';
import { syncMatch } from './syncEngine';
import { Match } from '../types';

export const syncWorldCupToFirestore = async (year: number = 2026) => {
  const matches = await worldCupService.getWorldCupMatches(year);
  const results = {
    received: matches.length,
    synced: 0,
    failed: 0,
    new: 0,
    updated: 0
  };

  for (const match of matches) {
    const syncResult = await syncMatch(
      match,
      'api-football', // Provider
      'world-cup',    // Source
      'world-cup',    // Competition Type
      (m: any): Partial<Match> => ({
        id: `wc-${m.id}`,
        homeTeam: { id: m.homeTeam.id || m.homeTeam.name || '', name: m.homeTeam.name, logo: m.homeTeam.crest || '' },
        awayTeam: { id: m.awayTeam.id || m.awayTeam.name || '', name: m.awayTeam.name, logo: m.awayTeam.crest || '' },
        status: m.status,
        utcDate: m.utcDate,
        startTime: m.utcDate,
        score: {
          home: m.score?.fullTime?.home ?? null,
          away: m.score?.fullTime?.away ?? null,
        },
        league: 'World Cup',
        competitionType: 'world-cup'
      })
    );
    
    if (syncResult.success) {
      results.synced++;
    } else {
      results.failed++;
    }
  }
  
  return results;
};

export const worldCupSyncService = {
  syncEditionData: async (year: number, customSyncUrl?: string) => {
    const result = await syncWorldCupToFirestore(year);
    return result.failed === 0;
  },
  syncWorldCupToFirestore
};
