// src/features/match-details/repositories/matchRepository.ts
import { matchesRepositoryV2 } from '../../../core/repository/MatchesRepositoryV2';
import { Match } from '../../../types';
import { getIdFromSlug } from '../../../utils/slugify';
import { worldCupService } from '../../../services/worldCupService';
import { normalizeMatch } from '../../../core/utils/matchNormalization';

const mapWCMatchToMatch = (wcMatch: any): Match => {
    return normalizeMatch(wcMatch.id, {
        ...wcMatch,
        source: 'world-cup',
        provider: 'Football-Data/OpenFootball',
        approved: true
    }) as Match;
};

// Re-export matchesRepositoryV2 methods as needed
export const {
    update: updateMatch,
    setById: createMatch,
    delete: deleteMatch,
    bulkUpdate,
    bulkDelete,
    mapFirestoreMatch,
    getMatches,
    subscribeToMatches
} = matchesRepositoryV2;

export const fetchMatch = async (id: string): Promise<Match | null> => {
    const realId = getIdFromSlug(id);
    
    // Check Firestore first
    const dbMatch = await matchesRepositoryV2.getMatch(realId);
    if (dbMatch) {
        return dbMatch;
    }
    
    // Fallback for World Cup
    if (realId.includes('2026-m-') || realId.includes('2022-m-') || realId.startsWith('wc-')) {
        const wcMatch = await worldCupService.getMatchDetails(realId);
        return wcMatch ? mapWCMatchToMatch(wcMatch) : null;
    }
    
    return null;
};

export const updateMatchLinks = async (id: string, streamingLinks: any[]) => {
    await matchesRepositoryV2.update(id, { streamingLinks });
};

export const incrementLinkClicks = async (id: string, fieldName: string, existingLinks: any[]) => {
    await matchesRepositoryV2.update(id, { [fieldName]: existingLinks } as any);
};
