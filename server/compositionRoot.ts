
import { apiManager } from './services/apiManager';
import { ApiManagerAdapter } from '../core-engine/infrastructure/adapters/ApiManagerAdapter';
import { CacheManager } from '../core-engine/infrastructure/cache/CacheManager';
import { MatchNormalizer } from '../core-engine/infrastructure/normalization/MatchNormalizer';
import { MatchRepository } from '../core-engine/infrastructure/repositories/MatchRepository';
import { ShadowValidationService } from '../core-engine/application/services/ShadowValidationService';

// Infrastructure
const apiAdapter = new ApiManagerAdapter(apiManager);
const cacheManager = new CacheManager();
const matchNormalizer = new MatchNormalizer();

// Repositories
export const matchRepository = new MatchRepository(apiAdapter, cacheManager, matchNormalizer);

// Application Services
export const shadowValidationService = new ShadowValidationService(matchRepository);
