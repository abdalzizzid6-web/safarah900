import axios, { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { apiManager } from './apiManager';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  isRefreshing?: boolean;
}

export interface FetchOptions {
  category: string;
  providerOverride?: string;
  ttlSeconds?: number;
  forceRefresh?: boolean;
}

export class UnifiedApiManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();

  private cacheHits = 0;
  private cacheMisses = 0;
  private retryCount = 0;
  private timeoutCount = 0;

  public getCacheAndHealthStats() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: total > 0 ? parseFloat(((this.cacheHits / total) * 100).toFixed(1)) : 100,
      cacheMissRate: total > 0 ? parseFloat(((this.cacheMisses / total) * 100).toFixed(1)) : 0,
      retryCount: this.retryCount,
      timeoutCount: this.timeoutCount
    };
  }

  private generateCacheKey(url: string, params: any, headers: any): string {
    const data = JSON.stringify({ url, params, headers });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Fetches data with Smart Cache including Memory cache, TTL, deduplication, and Background Refresh.
   */
  public async fetchWithSmartCache<T>(
    url: string,
    options: FetchOptions,
    axiosConfig: AxiosRequestConfig = {}
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(url, axiosConfig.params, axiosConfig.headers);
    const ttl = (options.ttlSeconds || 60) * 1000;

    if (!options.forceRefresh) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        this.cacheHits++;
        // Trigger Background Refresh in a non-blocking way if cache age > 80% of TTL
        const age = Date.now() - cached.timestamp;
        if (age > cached.ttl * 0.8 && !cached.isRefreshing) {
          cached.isRefreshing = true;
          this.executeWithRetry<T>(url, options, axiosConfig)
            .then((freshData) => {
              cached.data = freshData;
              cached.timestamp = Date.now();
              cached.isRefreshing = false;
            })
            .catch((err) => {
              cached.isRefreshing = false;
              console.warn(`[UnifiedApiManager] Background refresh failed for ${url}:`, err.message);
            });
        }
        return cached.data;
      }
    }

    this.cacheMisses++;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = this.executeWithRetry<T>(url, options, axiosConfig).then((data) => {
      this.memoryCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
      });
      this.pendingRequests.delete(cacheKey);
      return data;
    }).catch((err) => {
      this.pendingRequests.delete(cacheKey);
      throw err;
    });

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * Prefetch important endpoints into memory cache.
   */
  public async prefetch<T>(url: string, options: FetchOptions, axiosConfig: AxiosRequestConfig = {}): Promise<void> {
    try {
      await this.fetchWithSmartCache<T>(url, { ...options, forceRefresh: true }, axiosConfig);
      console.log(`[UnifiedApiManager] Prefetched: ${url}`);
    } catch (err: any) {
      console.warn(`[UnifiedApiManager] Prefetch failed for ${url}:`, err.message);
    }
  }

  /**
   * Fetches RSS feed with multi-stage retry, caching, and custom proxy fallback under the gateway.
   */
  public async fetchRssFeed(
    url: string,
    options: { category: string; providerId: string; providerName: string }
  ): Promise<string> {
    const cacheKey = `rss:${url}`;
    const ttl = 5 * 60 * 1000; // 5 minutes standard cache for RSS

    const cached = this.memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this.executeRssFetch(url, options).then((data) => {
      this.memoryCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
      });
      this.pendingRequests.delete(cacheKey);
      return data;
    }).catch((err) => {
      this.pendingRequests.delete(cacheKey);
      throw err;
    });

    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }

  private async executeRssFetch(
    url: string,
    options: { category: string; providerId: string; providerName: string }
  ): Promise<string> {
    const start = Date.now();
    let responseText: string | null = null;
    
    // Stage 1: Try with default rssHeaders/custom browser headers
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };
      if (options.providerId === 'filgoal') {
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
        headers['Referer'] = 'https://www.filgoal.com/';
        headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
        headers['Accept-Language'] = 'en-US,en;q=0.5';
      }

      const res = await axios.get(url, { headers, timeout: 12000 });
      if (res.status === 200) {
        responseText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      }
    } catch (err: any) {
      // silent failure, proceed to Stage 2
    }

    // Stage 2: Try with simplified browser headers
    if (!responseText) {
      try {
        const simpleHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ar,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Referer': 'https://www.google.com/'
        };
        const res = await axios.get(url, { headers: simpleHeaders, timeout: 12000 });
        if (res.status === 200) {
          responseText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        }
      } catch (err: any) {
        // silent
      }
    }

    // Stage 3: Try with Googlebot
    if (!responseText) {
      try {
        const botHeaders = {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9'
        };
        const res = await axios.get(url, { headers: botHeaders, timeout: 12000 });
        if (res.status === 200) {
          responseText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        }
      } catch (err: any) {
        // silent
      }
    }

    // Stage 4: Using secure CORS/RSS proxy fallback
    if (!responseText) {
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://corsproxy.org/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://thingproxy.freeboard.io/fetch/${url}`
      ];

      for (const proxyUrl of proxies) {
        try {
          const res = await axios.get(proxyUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
            },
            timeout: 15000
          });
          if (res.status === 200) {
            responseText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
            break;
          }
        } catch (err) {
          // try next proxy
        }
      }
    }

    const latency = Date.now() - start;
    if (responseText) {
      apiManager.logApiCall({
        providerId: options.providerId,
        providerName: options.providerName,
        endpoint: url,
        method: 'GET',
        category: options.category,
        statusCode: 200,
        latency,
        cost: 0,
        status: 'success'
      });
      return responseText;
    } else {
      apiManager.logApiCall({
        providerId: options.providerId,
        providerName: options.providerName,
        endpoint: url,
        method: 'GET',
        category: options.category,
        statusCode: 500,
        latency,
        cost: 0,
        status: 'network-error'
      });
      throw new Error(`[UnifiedApiManager] Failed to fetch RSS feed for ${options.providerName} across all stages and proxies.`);
    }
  }

  /**
   * Serves as unified server-side getter for single Firestore documents.
   */
  public async dbGetDoc(collectionName: string, docId: string, ttlSeconds = 60): Promise<any | null> {
    const cacheKey = `db:${collectionName}:${docId}`;
    
    const cached = this.memoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < cached.ttl)) {
      const age = Date.now() - cached.timestamp;
      if (age > cached.ttl * 0.8 && !cached.isRefreshing) {
        cached.isRefreshing = true;
        this.executeDbRead(collectionName, docId).then((fresh) => {
          if (fresh) {
            cached.data = fresh;
            cached.timestamp = Date.now();
          }
          cached.isRefreshing = false;
        }).catch(() => { cached.isRefreshing = false; });
      }
      return cached.data;
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this.executeDbRead(collectionName, docId).then((data) => {
      if (data) {
        this.memoryCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: ttlSeconds * 1000
        });
      }
      this.pendingRequests.delete(cacheKey);
      return data;
    }).catch((err) => {
      this.pendingRequests.delete(cacheKey);
      throw err;
    });

    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }

  private async executeDbRead(collectionName: string, docId: string): Promise<any | null> {
    const { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } = require('../firestore/collections');
    if (isFirestoreQuotaExceeded || !firestore) {
      console.warn(`[UnifiedApiManager] Firestore quota exceeded. dbGetDoc bypassing read for ${collectionName}/${docId}.`);
      return null;
    }
    try {
      const docRef = firestore.collection(collectionName).doc(docId);
      const doc = await docRef.get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (err: any) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      }
      throw err;
    }
  }

  /**
   * Serves as unified server-side query executor for Firestore queries with caching and deduplication.
   */
  public async dbGetQuery(
    collectionName: string,
    queryParams: { field: string; op: any; value: any }[],
    limitVal = 20,
    ttlSeconds = 60
  ): Promise<any[]> {
    const cacheKey = `db_query:${collectionName}:${JSON.stringify({ queryParams, limitVal })}`;
    
    const cached = this.memoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < cached.ttl)) {
      return cached.data;
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this.executeDbQuery(collectionName, queryParams, limitVal).then((data) => {
      this.memoryCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: ttlSeconds * 1000
      });
      this.pendingRequests.delete(cacheKey);
      return data;
    }).catch((err) => {
      this.pendingRequests.delete(cacheKey);
      throw err;
    });

    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }

  private async executeDbQuery(collectionName: string, queryParams: any[], limitVal: number): Promise<any[]> {
    const { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } = require('../firestore/collections');
    if (isFirestoreQuotaExceeded || !firestore) return [];
    try {
      let q = firestore.collection(collectionName);
      for (const param of queryParams) {
        q = q.where(param.field, param.op, param.value);
      }
      if (limitVal > 0) {
        q = q.limit(limitVal);
      }
      const snapshot = await q.get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (err: any) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      }
      throw err;
    }
  }

  private async executeWithRetry<T>(
    url: string,
    options: FetchOptions,
    axiosConfig: AxiosRequestConfig,
    retries = 3
  ): Promise<T> {
    let attempt = 0;
    let lastError: any = null;

    while (attempt < retries) {
      attempt++;
      if (attempt > 1) {
        this.retryCount++;
      }
      try {
        const { key, targetProviderName, providerDoc } = await apiManager.getActiveKeyForCategory(options.category, options.providerOverride);

        let finalUrl = url;
        let finalHeaders: Record<string, any> = { ...axiosConfig.headers, 'Accept': 'application/json' };

        if (targetProviderName === 'API-Football') {
          const isApiSports = key.length === 32;
          const isRapidApiFootball = key.length === 50;
          
          if (isApiSports) {
             finalHeaders['x-apisports-key'] = key;
             finalHeaders['x-apisports-host'] = 'v3.football.api-sports.io';
             if (!finalUrl.startsWith('http')) finalUrl = `https://v3.football.api-sports.io${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
          } else if (isRapidApiFootball) {
             finalHeaders['x-rapidapi-key'] = key;
             finalHeaders['x-rapidapi-host'] = 'api-football-v1.p.rapidapi.com';
             if (!finalUrl.startsWith('http')) finalUrl = `https://api-football-v1.p.rapidapi.com${finalUrl.startsWith('/v3/') ? '' : '/v3'}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
          } else {
             finalHeaders['x-rapidapi-key'] = key;
             finalHeaders['x-rapidapi-host'] = 'free-api-live-football-data.p.rapidapi.com';
             if (!finalUrl.startsWith('http')) finalUrl = `https://free-api-live-football-data.p.rapidapi.com${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
          }
        } else if (targetProviderName === 'SportMonks') {
          if (!finalUrl.includes('api_token=')) {
              finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}api_token=${key}`;
          }
          if (!finalUrl.startsWith('http')) {
             finalUrl = `https://api.sportmonks.com/v3/football${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
          }
        } else if (targetProviderName === 'TheSportsDB') {
           if (!finalUrl.startsWith('http')) {
              finalUrl = `https://www.thesportsdb.com/api/v1/json/${key}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
           }
        }

        const start = Date.now();
        const response = await axios({
          ...axiosConfig,
          url: finalUrl,
          headers: finalHeaders as any,
          timeout: 15000,
        });
        const latency = Date.now() - start;

        apiManager.logApiCall({
          providerId: providerDoc.id,
          providerName: targetProviderName,
          endpoint: finalUrl,
          method: axiosConfig.method || 'GET',
          category: options.category,
          statusCode: response.status,
          latency,
          cost: providerDoc.costPerCall,
          status: 'success'
        });

        if (targetProviderName === 'API-Football' && response.data?.errors && Object.keys(response.data.errors).length > 0) {
            throw new Error(`API-Football logic error: ${JSON.stringify(response.data.errors)}`);
        }

        return response.data;
      } catch (err: any) {
        lastError = err;
        const statusCode = err.response?.status || 500;
        
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          this.timeoutCount++;
        }
        
        if (statusCode === 429 || statusCode === 403 || statusCode === 401 || err.message.includes('API-Football logic error:')) {
            console.warn(`[UnifiedApiManager] Auth/Quota/Logic error on attempt ${attempt}:`, err.message);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }

        console.warn(`[UnifiedApiManager] Network error on attempt ${attempt}:`, err.message);
        if (attempt >= retries) break;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error(`[UnifiedApiManager] Failed after ${retries} attempts. Last error: ${lastError?.message || lastError}`);
  }

  public invalidateCache(urlPattern?: string) {
    if (urlPattern) {
        const keysToDelete: string[] = [];
        this.memoryCache.forEach((value, key) => {
            if (key.includes(urlPattern)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(k => this.memoryCache.delete(k));
    } else {
        this.memoryCache.clear();
    }
  }
}

export const unifiedApiManager = new UnifiedApiManager();
