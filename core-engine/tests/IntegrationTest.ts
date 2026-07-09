import { matchRepository } from '../../server/compositionRoot';

async function testIntegration() {
  // Use centralized dependencies from Composition Root
  const repo = matchRepository;
  
  // This will try to fetch live matches using the Real ApiManagerService under the hood
  try {
    const matches = await repo.getLiveMatches();
    console.log('Integration Test: Successfully fetched matches via Bridge Layer', matches.length);
  } catch (e) {
    console.error('Integration Test Failed:', e);
  }
}

testIntegration();
