import { firestore } from '../firestore/collections';
import { getAuth } from 'firebase-admin/auth';
import { IApiConfigProvider, ApiProviderConfig } from '../../core-engine/contracts/infrastructure/IApiConfigProvider';

export interface ApiProviderDoc extends ApiProviderConfig {
  id: string;
  name: string;
  key: string;
  provider: 'API-Football' | 'SportMonks' | 'TheSportsDB' | 'Custom';
  quotaDaily: number;
  quotaMonthly: number;
  usedToday: number;
  usedMonth: number;
  priority: number;
  priorityType?: 'primary' | 'secondary' | 'fallback';
  active: boolean;
  fallbackProvider: string;
  status: 'healthy' | 'degraded' | 'suspended' | 'unauthorized';
  statusMessage?: string;
  latency?: number;
  costPerCall: number;
  updatedAt: string;
  categories?: string[];
}

export interface ApiRoutingDoc {
  worldCup: string;
  premierLeague: string;
  arabMatches: string;
  news: string;
  players: string;
  teams: string;
  stats: string;
  streaming: string;
}

export interface ApiLogV2Doc {
  id: string;
  providerId: string;
  providerName: string;
  endpoint: string;
  method: string;
  category: string;
  statusCode: number;
  latency: number;
  cost: number;
  status: 'success' | 'rate-limit' | 'auth-error' | 'network-error';
  errorMessage?: string;
  timestamp: string;
}

export function mapCategoryToUserCategory(category: string): string {
  const cat = (category || '').toLowerCase().trim();
  if (cat === 'worldcup' || cat === 'premierleague' || cat === 'leagues') return 'leagues';
  if (cat === 'arabmatches' || cat === 'stats' || cat === 'fixtures' || cat === 'matches') return 'matches';
  if (cat === 'teams') return 'teams';
  if (cat === 'players') return 'players';
  if (cat === 'news') return 'news';
  if (cat === 'predictions') return 'predictions';
  if (cat === 'streaming' || cat === 'live_stream') return 'live_stream';
  if (cat === 'ai_analysis' || cat === 'ai') return 'ai_analysis';
  return 'matches'; // default fallback
}

// In-memory caching for performance & rate-limiting Firestore reads/writes
class ApiManagerService implements IApiConfigProvider {
  providersCache: ApiProviderDoc[] = [];
  private routingCache: ApiRoutingDoc | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes (Increased from 30s to save quota)

  // Pending counter increments to flush asynchronously in batches
  private pendingIncrements: Record<string, { today: number; month: number }> = {};
  private pendingLogs: ApiLogV2Doc[] = [];
  private pendingLatencyUpdates: Record<string, number> = {};
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushInterval();
  }

  private startFlushInterval() {
    const isVercel = process.env.VERCEL === '1' || !!process.env.NOW_REGION || (process.env.NODE_ENV === 'production' && !process.env.PORT);
    if (isVercel) {
      console.log('[ApiManager] Vercel environment detected. Background flush timer will NOT be started.');
      return;
    }
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(() => this.flushDataToFirestore(), 5 * 60 * 1000); // Flush every 5 minutes
  }

  public getProvidersCache(): ApiProviderConfig[] {
    return this.providersCache;
  }

  /**
   * Loads configurations from Firestore with a localized short-lived cache.
   */
  public async loadConfig(force = false): Promise<void> {
    const now = Date.now();
    if (!force && this.providersCache.length > 0 && now - this.lastFetchTime < this.CACHE_TTL) {
      return;
    }

    const defaultProviders: ApiProviderDoc[] = [
      {
        id: 'api-football-primary',
        name: 'API-Football المفتاح الرئيسي',
        key: process.env.VITE_API_KEY || '6ca2df456728038b3401fbba80a13344',
        provider: 'API-Football',
        quotaDaily: 100,
        quotaMonthly: 3000,
        usedToday: 0,
        usedMonth: 0,
        priority: 1,
        priorityType: 'primary',
        active: true,
        fallbackProvider: 'api-football-backup',
        status: 'healthy',
        costPerCall: 0.0001,
        updatedAt: new Date().toISOString(),
        categories: ['matches', 'leagues', 'teams', 'players', 'predictions', 'ai_analysis']
      },
      {
        id: 'api-football-backup',
        name: 'API-Football الاحتياطي الطارئ',
        key: 'free-api-live-football-data-backup-key-rapid',
        provider: 'API-Football',
        quotaDaily: 100,
        quotaMonthly: 3000,
        usedToday: 0,
        usedMonth: 0,
        priority: 2,
        priorityType: 'secondary',
        active: true,
        fallbackProvider: 'none',
        status: 'healthy',
        costPerCall: 0.0002,
        updatedAt: new Date().toISOString(),
        categories: ['matches', 'leagues', 'teams', 'players']
      },
      {
        id: 'thesportsdb-default',
        name: 'TheSportsDB Free API',
        key: '3',
        provider: 'TheSportsDB',
        quotaDaily: 1000,
        quotaMonthly: 30000,
        usedToday: 0,
        usedMonth: 0,
        priority: 3,
        priorityType: 'fallback',
        active: true,
        fallbackProvider: 'none',
        status: 'healthy',
        costPerCall: 0.00005,
        updatedAt: new Date().toISOString(),
        categories: ['matches', 'leagues', 'teams', 'news']
      }
    ];

    const defaultRouting: ApiRoutingDoc = {
      worldCup: 'API-Football',
      premierLeague: 'API-Football',
      arabMatches: 'TheSportsDB',
      news: 'Custom',
      players: 'API-Football',
      teams: 'API-Football',
      stats: 'API-Football', // Force stats to use API-Football if SportMonks is unavailable or as a robust route
      streaming: 'Custom'
    };

    try {
      // 1. Fetch Providers
      const providersSnap = await firestore.collection('api_providers').get();
      const providers: ApiProviderDoc[] = [];
      providersSnap.forEach((doc: any) => {
        providers.push({ id: doc.id, ...doc.data() } as ApiProviderDoc);
      });

      // Seeding fallback keys if database is totally empty
      if (providers.length === 0) {
        try {
          await this.seedDefaultKeys();
          return this.loadConfig(true);
        } catch (seedErr) {
          console.warn('[ApiManager] Failed to seed default keys to Firestore, using local defaults.', seedErr);
          this.providersCache = defaultProviders;
          this.routingCache = defaultRouting;
          this.lastFetchTime = now;
          return;
        }
      }

      this.providersCache = providers;

      // 2. Fetch Routing
      const routingDoc = await firestore.collection('settings').doc('api_routing').get();
      if (routingDoc.exists) {
        this.routingCache = routingDoc.data() as ApiRoutingDoc;
      } else {
        await firestore.collection('settings').doc('api_routing').set(defaultRouting).catch(() => {});
        this.routingCache = defaultRouting;
      }

      this.lastFetchTime = now;
    } catch (err: any) {
      const isQuota = err?.message?.toLowerCase().includes('quota') || 
                      err?.message?.toLowerCase().includes('exhausted') || 
                      err?.code === 8 ||
                      err?.code === 'resource-exhausted';
      if (isQuota) {
        console.warn('[ApiManager] Firestore Quota exhausted! Using static in-memory fallback API providers & routing.');
      } else {
        console.error('[ApiManager] Failed to load config from Firestore:', err);
      }
      // Populate memory cache with default configurations to allow API-Football proxy requests to succeed
      this.providersCache = defaultProviders;
      this.routingCache = defaultRouting;
      this.lastFetchTime = now;
    }
  }

  /**
   * Seeds default providers into Firestore if none exist.
   */
  private async seedDefaultKeys() {
    const defaultProviders: ApiProviderDoc[] = [
      {
        id: 'api-football-primary',
        name: 'API-Football المفتاح الرئيسي',
        key: process.env.VITE_API_KEY || '6ca2df456728038b3401fbba80a13344',
        provider: 'API-Football',
        quotaDaily: 100,
        quotaMonthly: 3000,
        usedToday: 0,
        usedMonth: 0,
        priority: 1,
        priorityType: 'primary',
        active: true,
        fallbackProvider: 'api-football-backup',
        status: 'healthy',
        costPerCall: 0.0001,
        updatedAt: new Date().toISOString(),
        categories: ['matches', 'leagues', 'teams', 'players', 'predictions', 'ai_analysis']
      },
      {
        id: 'api-football-backup',
        name: 'API-Football الاحتياطي الطارئ',
        key: 'free-api-live-football-data-backup-key-rapid',
        provider: 'API-Football',
        quotaDaily: 100,
        quotaMonthly: 3000,
        usedToday: 0,
        usedMonth: 0,
        priority: 2,
        priorityType: 'secondary',
        active: true,
        fallbackProvider: 'none',
        status: 'healthy',
        costPerCall: 0.0002,
        updatedAt: new Date().toISOString(),
        categories: ['matches', 'leagues', 'teams', 'players']
      },
      {
        id: 'thesportsdb-default',
        name: 'TheSportsDB Free API',
        key: '3',
        provider: 'TheSportsDB',
        quotaDaily: 1000,
        quotaMonthly: 30000,
        usedToday: 0,
        usedMonth: 0,
        priority: 3,
        priorityType: 'fallback',
        active: true,
        fallbackProvider: 'none',
        status: 'healthy',
        costPerCall: 0.00005,
        updatedAt: new Date().toISOString(),
        categories: ['matches', 'leagues', 'teams', 'news']
      }
    ];

    const batch = firestore.batch();
    for (const prov of defaultProviders) {
      const ref = firestore.collection('api_providers').doc(prov.id);
      batch.set(ref, prov);
    }
    await batch.commit();
  }

  /**
   * Adds a new provider configuration.
   */
  public async addProvider(provider: ApiProviderDoc): Promise<void> {
    await firestore.collection('api_providers').doc(provider.id).set(provider);
    await this.loadConfig(true);
  }

  /**
   * Updates an existing provider configuration.
   */
  public async updateProvider(providerId: string, updates: Partial<ApiProviderDoc>): Promise<void> {
    await firestore.collection('api_providers').doc(providerId).update(updates);
    await this.loadConfig(true);
  }

  /**
   * Deletes a provider configuration.
   */
  public async deleteProvider(providerId: string): Promise<void> {
    await firestore.collection('api_providers').doc(providerId).delete();
    await this.loadConfig(true);
  }

  /**
   * Updates routing configuration.
   */
  public async updateRoute(category: string, providerName: string): Promise<void> {
    const routing = { ...this.routingCache, [category]: providerName };
    await firestore.collection('settings').doc('api_routing').set(routing, { merge: true });
    this.routingCache = routing as ApiRoutingDoc;
  }

  /**
   * Resolves the best key and provider for a category.
   */
  public async getActiveKeyForCategory(category: string, forcedProvider?: string): Promise<{ key: string; providerDoc: ApiProviderDoc; targetProviderName: string }> {
    await this.loadConfig();

    const targetProviderName = forcedProvider || (this.routingCache as any)?.[category] || 'API-Football';
    const systemCategory = mapCategoryToUserCategory(category);
    
    // Check if key has quota remaining
    const checkQuota = (p: ApiProviderDoc): boolean => {
      const currentPending = this.pendingIncrements[p.id] || { today: 0, month: 0 };
      const projectedToday = p.usedToday + currentPending.today;
      const projectedMonth = p.usedMonth + currentPending.month;
      return projectedToday < p.quotaDaily && projectedMonth < p.quotaMonthly;
    };

    // 1. Primary choice: Target provider, active, healthy status, matching category, and has quota
    let pool = this.providersCache.filter(p => 
      p.provider === targetProviderName &&
      p.active &&
      p.status === 'healthy' &&
      (!p.categories || p.categories.length === 0 || p.categories.includes(systemCategory)) &&
      checkQuota(p)
    );

    // 2. Secondary choice: Target provider, active, degraded status, matching category, and has quota
    if (pool.length === 0) {
      pool = this.providersCache.filter(p => 
        p.provider === targetProviderName &&
        p.active &&
        p.status === 'degraded' &&
        (!p.categories || p.categories.length === 0 || p.categories.includes(systemCategory)) &&
        checkQuota(p)
      );
    }

    // 3. Fallback choice: API-Football, active, healthy status, matching category, and has quota
    if (pool.length === 0) {
      pool = this.providersCache.filter(p => 
        p.provider === 'API-Football' &&
        p.active &&
        p.status === 'healthy' &&
        (!p.categories || p.categories.length === 0 || p.categories.includes(systemCategory)) &&
        checkQuota(p)
      );
    }

    // 4. Emergency choice: API-Football, active, degraded status, matching category, and has quota
    if (pool.length === 0) {
      pool = this.providersCache.filter(p => 
        p.provider === 'API-Football' &&
        p.active &&
        p.status === 'degraded' &&
        (!p.categories || p.categories.length === 0 || p.categories.includes(systemCategory)) &&
        checkQuota(p)
      );
    }

    // 5. Emergency choice 2: TheSportsDB, active, healthy or degraded status, matching category, and has quota
    if (pool.length === 0) {
      pool = this.providersCache.filter(p => 
        p.provider === 'TheSportsDB' &&
        p.active &&
        (p.status === 'healthy' || p.status === 'degraded') &&
        (!p.categories || p.categories.length === 0 || p.categories.includes(systemCategory)) &&
        checkQuota(p)
      );
    }

    // 6. Absolute Ultimate Fallback: ANY active provider with healthy/degraded status that has remaining quota
    if (pool.length === 0) {
      pool = this.providersCache.filter(p => 
        p.active &&
        (p.status === 'healthy' || p.status === 'degraded') &&
        checkQuota(p)
      );
    }

    if (pool.length === 0) {
      throw new Error(`[ApiManager] No healthy keys or quota remaining in pool for any provider (Target: ${targetProviderName}, Category: ${systemCategory})`);
    }

    // Sort by priorityType (primary -> 1, secondary -> 2, fallback -> 3) then by numeric priority then by usage
    pool.sort((a, b) => {
      const getPriorityVal = (p: ApiProviderDoc) => {
        if (p.priorityType === 'primary') return 1;
        if (p.priorityType === 'secondary') return 2;
        if (p.priorityType === 'fallback') return 3;
        return p.priority || 1;
      };
      
      const pA = getPriorityVal(a);
      const pB = getPriorityVal(b);
      if (pA !== pB) return pA - pB;
      
      const usageA = a.usedToday + (this.pendingIncrements[a.id]?.today || 0);
      const usageB = b.usedToday + (this.pendingIncrements[b.id]?.today || 0);
      return usageA - usageB;
    });

    const selected = pool[0];
    
    // Track usage in-memory
    if (!this.pendingIncrements[selected.id]) {
      this.pendingIncrements[selected.id] = { today: 0, month: 0 };
    }
    this.pendingIncrements[selected.id].today += 1;
    this.pendingIncrements[selected.id].month += 1;

    const isVercel = process.env.VERCEL === '1' || !!process.env.NOW_REGION || (process.env.NODE_ENV === 'production' && !process.env.PORT);
    if (isVercel) {
      // Flush increments to Firestore immediately on Vercel to preserve usage tracking across stateless executions
      this.flushDataToFirestore().catch(err => console.error('[ApiManager] Failed to flush in-memory increments on Vercel request:', err));
    }

    return {
      key: selected.key,
      providerDoc: selected,
      targetProviderName: selected.provider // Return the actually selected provider name to match the key format
    };
  }

  /**
   * Reports a failure on a key (e.g., if a 429 or 403 occurs at call time).
   */
  public async reportKeyFailure(providerId: string, status: 'degraded' | 'suspended' | 'unauthorized', message: string) {
    console.warn(`[ApiManager] Key failure reported for ${providerId}: ${status} - ${message}`);
    
    // Update in memory cache immediately
    const found = this.providersCache.find(p => p.id === providerId);
    if (found) {
      found.status = status;
      found.statusMessage = message;
    }

    try {
      await firestore.collection('api_providers').doc(providerId).update({
        status,
        statusMessage: message,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('[ApiManager] Failed to update key status in Firestore:', err);
    }
  }

  /**
   * Logs an API execution for analytics, health and cost dashboards.
   */
  public async logApiCall(log: Omit<ApiLogV2Doc, 'id' | 'timestamp'>) {
    const id = Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();
    const fullLog: ApiLogV2Doc = { ...log, id, timestamp };

    // Buffer logs for batching instead of writing immediately
    this.pendingLogs.push(fullLog);
    // Limit buffer size to prevent memory issues
    const isVercel = process.env.VERCEL === '1' || !!process.env.NOW_REGION || (process.env.NODE_ENV === 'production' && !process.env.PORT);
    if (isVercel || this.pendingLogs.length > 100) {
      this.flushDataToFirestore();
    }

    // Also update latency and health check for the provider in memory
    if (log.latency > 0) {
      const found = this.providersCache.find(p => p.id === log.providerId);
      if (found) {
        found.latency = log.latency;
        // Buffer latency update
        this.pendingLatencyUpdates[log.providerId] = log.latency;

        // Smart Circuit Breaker Engine: Automatically degrade providers with extremely high latency
        if (log.latency > 5000 && found.status === 'healthy') {
             console.warn(`[Circuit Breaker] Provider ${found.name} latency spiked to ${log.latency}ms. Marking as degraded.`);
             this.reportKeyFailure(found.id, 'degraded', `High latency detected: ${log.latency}ms`);
        } else if (log.latency < 2000 && found.status === 'degraded') {
             // Auto-recover if it's currently just degraded
             found.status = 'healthy';
             found.statusMessage = 'Recovered from high latency';
             firestore.collection('api_providers').doc(found.id).update({
                 status: 'healthy',
                 statusMessage: 'Recovered from high latency',
                 updatedAt: new Date().toISOString()
             }).catch((e: any) => console.error('[Circuit Breaker] Auto-recovery update failed:', e));
        }
      }
    }
  }

  /**
   * Periodically flushes buffered usage stats to Firestore in transaction-safe batch writes.
   */
  private async firestoreUsageUpdate(providerId: string, incToday: number, incMonth: number) {
    const docRef = firestore.collection('api_providers').doc(providerId);
    try {
      await firestore.runTransaction(async (transaction: any) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists) return;
        const data = docSnap.data() as ApiProviderDoc;
        
        const newToday = (data.usedToday || 0) + incToday;
        const newMonth = (data.usedMonth || 0) + incMonth;

        transaction.update(docRef, {
          usedToday: newToday,
          usedMonth: newMonth,
          updatedAt: new Date().toISOString()
        });
      });
    } catch (err) {
      console.error(`[ApiManager] Failed transactional flush for provider: ${providerId}`, err);
    }
  }

  private async flushDataToFirestore() {
    const increments = { ...this.pendingIncrements };
    const logs = [...this.pendingLogs];
    const latencyUpdates = { ...this.pendingLatencyUpdates };

    this.pendingIncrements = {};
    this.pendingLogs = [];
    this.pendingLatencyUpdates = {};

    // 1. Flush Usage Increments
    const incKeys = Object.keys(increments);
    if (incKeys.length > 0) {
      for (const providerId of incKeys) {
        const { today, month } = increments[providerId];
        if (today > 0 || month > 0) {
          await this.firestoreUsageUpdate(providerId, today, month);
        }
      }
    }

    // 2. Flush Logs in batches
    if (logs.length > 0) {
      const BATCH_SIZE = 400; // Firestore limit is 500
      for (let i = 0; i < logs.length; i += BATCH_SIZE) {
        const chunk = logs.slice(i, i + BATCH_SIZE);
        const batch = firestore.batch();
        chunk.forEach(log => {
          const ref = firestore.collection('api_logs_v2').doc(log.id);
          batch.set(ref, log);
        });
        await batch.commit().catch((err: any) => console.error('[ApiManager] Batch log write failed:', err));
      }
    }

    // 3. Flush Latency Updates
    const latKeys = Object.keys(latencyUpdates);
    if (latKeys.length > 0) {
      const batch = firestore.batch();
      for (const providerId of latKeys) {
        const ref = firestore.collection('api_providers').doc(providerId);
        batch.update(ref, {
          latency: latencyUpdates[providerId],
          updatedAt: new Date().toISOString()
        });
      }
      await batch.commit().catch((err: any) => console.error('[ApiManager] Batch latency update failed:', err));
    }

    // Refresh memory cache in the background after flushing to stay synced with Firestore limits
    await this.loadConfig(true);
  }

  /**
   * Resets today's quotas (intended to be called daily, or on-demand).
   */
  public async resetDailyQuotas() {
    const providersSnap = await firestore.collection('api_providers').get();
    const batch = firestore.batch();
    
    providersSnap.forEach((doc: any) => {
      batch.update(doc.ref, {
        usedToday: 0,
        status: 'healthy',
        statusMessage: '',
        updatedAt: new Date().toISOString()
      });
    });

    await batch.commit();
    await this.loadConfig(true);
  }
}

export const apiManager = new ApiManagerService();
