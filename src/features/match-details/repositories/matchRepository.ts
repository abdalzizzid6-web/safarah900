// src/features/match-details/repositories/matchRepository.ts
import { matchesRepositoryV2 } from '../../../core/repository/MatchesRepositoryV2';
import { Match } from '../../../types';
import { getIdFromSlug } from '../../../utils/slugify';
import { worldCupService } from '../../../services/worldCupService';
import { translateTeamName, translateLeagueName } from '../../../utils/arabicTeamNames';
import { normalizeMatch } from '../../../core/utils/matchNormalization';

const mapWCMatchToMatch = (wcMatch: any): Match => {
    return normalizeMatch(wcMatch.id, {
        ...wcMatch,
        source: 'world-cup',
        provider: 'Football-Data/OpenFootball',
        approved: true
    }) as Match;
};

export const subscribeToMatch = (id: string, onUpdate: (match: Match) => void, onError: (error: Error) => void) => {
    const realId = getIdFromSlug(id);

    if (realId.includes('2026-m-') || realId.includes('2022-m-') || realId.startsWith('wc-')) {
        // WC matches might need periodic polling or specific WC logic if not in Firestore
        // For simplicity, we fallback to WC service if not found in Firestore via subscribeLiveMatch
        const unsub = matchesRepositoryV2.subscribeLiveMatch(realId, async (match) => {
            if (match) {
                onUpdate(match);
            } else {
                try {
                    const wcMatch = await worldCupService.getMatchDetails(realId);
                    if (wcMatch) onUpdate(mapWCMatchToMatch(wcMatch));
                } catch (e) {
                    onError(e as Error);
                }
            }
        });
        return unsub;
    }

    return matchesRepositoryV2.subscribeLiveMatch(realId, (match) => {
        if (match) onUpdate(match);
        else onError(new Error('Match not found'));
    });
};

export const fetchMatch = async (id: string): Promise<Match | null> => {
    const realId = getIdFromSlug(id);
    
    // Check Firestore first for ALL matches to respect admin updates, overrides, and avoid API fallback issues
    const dbMatch = await matchesRepositoryV2.getMatch(realId);
    if (dbMatch) {
        return dbMatch;
    }
    
    // If not found in Firestore, and it's a World Cup match, fetch from World Cup Service
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

export const subscribeToMatches = (callback: (matches: Match[]) => void) => {
    return matchesRepositoryV2.subscribeToMatches(callback);
};

export const getMatches = async (): Promise<Match[]> => {
    return await matchesRepositoryV2.getMatches();
};

export const updateMatch = async (id: string, data: Partial<Match>) => {
    return await matchesRepositoryV2.update(id, data);
};

export const createMatch = async (id: string, data: Partial<Match>) => {
    return await matchesRepositoryV2.setById(id, data);
};

export const deleteMatch = async (id: string) => {
    return await matchesRepositoryV2.delete(id);
};

export const bulkUpdate = async (ids: string[], data: Partial<Match>) => {
    return await matchesRepositoryV2.bulkUpdate(ids, data);
};

export const bulkDelete = async (ids: string[]) => {
    return await matchesRepositoryV2.bulkDelete(ids);
};

export const mapFirestoreMatch = (id: string, data: any): Match => {
    return matchesRepositoryV2.mapFirestoreMatch(id, data) as Match;
};
