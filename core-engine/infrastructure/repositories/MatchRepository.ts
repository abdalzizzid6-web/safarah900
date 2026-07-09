import { IMatchRepository } from '../../contracts/repositories/IMatchRepository';
import { Match } from '../../domain/entities/Match';
import { IProvider } from '../../contracts/providers/IProvider';
import { CacheManager } from '../cache/CacheManager';
import { MatchNormalizer } from '../normalization/MatchNormalizer';

export class MatchRepository implements IMatchRepository {
  constructor(
    private provider: IProvider,
    private cacheManager: CacheManager,
    private normalizer: MatchNormalizer
  ) {}

  async getLiveMatches(): Promise<Match[]> {
    const cacheKey = 'live_matches';
    const cached = await this.cacheManager.get<Match[]>(cacheKey);
    if (cached) {
      console.log(`[Forensic] MatchRepository returning ${cached.length} matches from cache.`);
      return cached;
    }

    const matches = await this.provider.fetchLiveMatches();
    console.log(`[Forensic] MatchRepository received ${matches.length} matches from provider.`);
    await this.cacheManager.set(cacheKey, matches, 60);
    return matches;
  }

  async getMatchesByDate(date: Date): Promise<Match[]> {
    const cacheKey = `matches_${date.toISOString().split('T')[0]}`;
    const cached = await this.cacheManager.get<Match[]>(cacheKey);
    if (cached) return cached;

    const matches = await this.provider.fetchMatchesByDate(date);
    await this.cacheManager.set(cacheKey, matches, 3600);
    return matches;
  }

  async getMatchDetails(id: string): Promise<Match | null> {
    const cacheKey = `match_${id}`;
    const cached = await this.cacheManager.get<Match>(cacheKey);
    if (cached) return cached;

    const match = await this.provider.fetchMatch(id);
    if (match) await this.cacheManager.set(cacheKey, match, 300);
    return match;
  }

  async refreshMatch(id: string): Promise<Match> {
    const match = await this.provider.fetchMatch(id);
    if (!match) throw new Error('Match not found');
    await this.cacheManager.set(`match_${id}`, match, 300);
    return match;
  }

  async searchMatches(query: string): Promise<Match[]> { return []; }
  async getLeagueMatches(leagueId: string): Promise<Match[]> { return []; }
}
