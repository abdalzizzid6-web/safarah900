import { playersRepositoryV2 } from '../core/repository/PlayersRepositoryV2';
import { PlayerDetail } from './playerMapper';

const playerCache = new Map<string, { data: any; timestamp: number }>();
const pendingRequests = new Map<string, Promise<any>>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const playerService = {
  /**
   * Fetch specific player's profile and stats from internal database
   */
  async getPlayerDetails(playerId: string | number, season?: number): Promise<PlayerDetail> {
    const apiId = String(playerId).replace('apf-', '');
    const cacheKey = `${apiId}_${season || 'all'}`;

    if (playerCache.has(cacheKey)) {
        const cached = playerCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }
    }

    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)!;
    }

    const promise = (async () => {
        try {
            const player = await playersRepositoryV2.getPlayerDetails(apiId);
            if (player) {
                playerCache.set(cacheKey, { data: player, timestamp: Date.now() });
                return player;
            }
            throw new Error('Not found');
        } catch (error) {
            console.error(`[playerService] Failed fetch ${apiId}:`, error);
            return {
                id: apiId,
                name: "لاعب محترف",
                teamName: "غير متوفر",
                position: "N/A"
            } as PlayerDetail;
        }
    })();

    pendingRequests.set(cacheKey, promise);
    try {
        return await promise;
    } finally {
        pendingRequests.delete(cacheKey);
    }
  },

  /**
   * Fetch squads of a team
   */
  async getTeamPlayers(teamId: string | number): Promise<any[]> {
    const apiId = String(teamId).replace('apf-', '');
    const cacheKey = `team_players_${apiId}`;

    if (playerCache.has(cacheKey)) {
        const cached = playerCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }
    }

    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)!;
    }

    const promise = (async () => {
        try {
            const players = await playersRepositoryV2.getTeamPlayers(apiId);
            if (players.length > 0) {
                playerCache.set(cacheKey, { data: players, timestamp: Date.now() });
            }
            return players;
        } catch (error) {
            console.error(`[playerService] Failed squad fetch ${apiId}:`, error);
            return [];
        }
    })();

    pendingRequests.set(cacheKey, promise);
    try {
        return await promise;
    } finally {
        pendingRequests.delete(cacheKey);
    }
  }
};
