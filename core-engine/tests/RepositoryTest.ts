import { MatchRepository } from '../infrastructure/repositories/MatchRepository';
import { ProviderManager } from '../infrastructure/providers/ProviderManager';
import { CacheManager } from '../infrastructure/cache/CacheManager';
import { MatchNormalizer } from '../infrastructure/normalization/MatchNormalizer';
import { MockApiFootballProvider } from '../infrastructure/providers/MockApiFootballProvider';

async function testRepository() {
  const provider = new MockApiFootballProvider();
  const pm = new ProviderManager();
  pm.registerProvider(provider);
  const repo = new MatchRepository(provider, new CacheManager(), new MatchNormalizer());
  
  const matches = await repo.getLiveMatches();
  console.assert(matches.length === 1, 'Repository test failed');
  console.log('Repository test passed');
}

testRepository();
