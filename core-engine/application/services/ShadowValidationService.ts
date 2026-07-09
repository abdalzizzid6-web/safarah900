import { Match } from '../../domain/entities/Match';
import { MatchRepository } from '../../infrastructure/repositories/MatchRepository';
import { ApiManagerAdapter } from '../../infrastructure/adapters/ApiManagerAdapter';
import { CacheManager } from '../../infrastructure/cache/CacheManager';
import { MatchNormalizer } from '../../infrastructure/normalization/MatchNormalizer';
import { NormalizedMatch } from '../../../server/utils/normalizer';
import { apiManager } from '../../../server/services/apiManager';

export class ShadowValidationService {
  constructor(private repo: MatchRepository) {}

  async validateLiveMatches(legacyMatches: NormalizedMatch[]) {
    try {
      const coreMatches = await this.repo.getLiveMatches();
      this.compare(legacyMatches, coreMatches);
    } catch (e) {
      console.error('[Shadow Validation] Error:', e);
    }
  }

  private compare(legacy: NormalizedMatch[], core: Match[]) {
    console.log('[Shadow Validation] Comparing...');
    let differences = 0;
    
    // Comparison Table Metrics
    let matchCount = legacy.length;
    let missingMatches = 0;
    let extraMatches = 0;
    let scoreDiff = 0;
    let statusDiff = 0;

    core.forEach(coreMatch => {
      const legacyMatch = legacy.find(l => String(l.id) === coreMatch.id);
      if (!legacyMatch) {
        missingMatches++;
        return;
      }
      
      // Deep field comparisons
      if (legacyMatch.status !== coreMatch.status) statusDiff++;
      if (Number(legacyMatch.homeScore ?? 0) !== coreMatch.homeScore) scoreDiff++;
      if (Number(legacyMatch.awayScore ?? 0) !== coreMatch.awayScore) scoreDiff++;
      
      differences += (legacyMatch.status !== coreMatch.status ? 1 : 0) + 
                     (Number(legacyMatch.homeScore ?? 0) !== coreMatch.homeScore ? 1 : 0) + 
                     (Number(legacyMatch.awayScore ?? 0) !== coreMatch.awayScore ? 1 : 0);
    });

    extraMatches = core.length - (legacy.length - missingMatches);

    const matchRate = legacy.length > 0 ? ((legacy.length - (missingMatches + extraMatches)) / legacy.length) * 100 : 100;

    console.log(`[Shadow Validation] Results:`);
    console.log(`- Total Matches: ${matchCount}`);
    console.log(`- Match Rate: ${matchRate.toFixed(2)}%`);
    console.log(`- Differences: ${differences}`);
    console.log(`- Missing Matches: ${missingMatches}`);
    console.log(`- Extra Matches: ${extraMatches}`);
    console.log(`- Score Mismatches: ${scoreDiff}`);
    console.log(`- Status Mismatches: ${statusDiff}`);
    
    if (matchRate < 99) {
      console.error('[Shadow Validation] CRITICAL: Match Rate < 99%.');
    }
  }
}
