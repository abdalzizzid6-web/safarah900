import { MatchRepository } from '../infrastructure/repositories/MatchRepository';
import { ApiManagerAdapter } from '../infrastructure/adapters/ApiManagerAdapter';
import { CacheManager } from '../infrastructure/cache/CacheManager';
import { MatchNormalizer } from '../infrastructure/normalization/MatchNormalizer';

async function testIntegration() {
  // Setup DI
  const adapter = new ApiManagerAdapter();
  const repo = new MatchRepository(adapter, new CacheManager(), new MatchNormalizer());
  
  // This will try to fetch live matches using the Real ApiManagerService under the hood
  try {
    const matches = await repo.getLiveMatches();
    console.log('Integration Test: Successfully fetched matches via Bridge Layer', matches.length);
  } catch (e) {
    console.error('Integration Test Failed:', e);
  }
}

testIntegration();
