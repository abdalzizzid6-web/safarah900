import { CacheManager } from '../infrastructure/cache/CacheManager';

async function testCache() {
  const cache = new CacheManager();
  await cache.set('key', { data: 'test' }, 1);
  const result = await cache.get<{ data: string }>('key');
  console.assert(result?.data === 'test', 'Cache test failed');
  console.log('Cache test passed');
}

testCache();
