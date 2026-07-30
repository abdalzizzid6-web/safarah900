
import { apiManager } from './services/apiManager.js';
import { ApiManagerAdapter } from '../core-engine/infrastructure/adapters/ApiManagerAdapter.js';
import { CacheManager } from '../core-engine/infrastructure/cache/CacheManager.js';
import { MatchNormalizer } from '../core-engine/infrastructure/normalization/MatchNormalizer.js';
import { MatchRepository } from '../core-engine/infrastructure/repositories/MatchRepository.js';
import { ShadowValidationService } from '../core-engine/application/services/ShadowValidationService.js';

// Infrastructure
const apiAdapter = new ApiManagerAdapter(apiManager);
const cacheManager = new CacheManager();
const matchNormalizer = new MatchNormalizer();

// Repositories
export const matchRepository = new MatchRepository(apiAdapter, cacheManager, matchNormalizer);

// Application Services
export const shadowValidationService = new ShadowValidationService(matchRepository);
