export const metrics = {
  firestoreReads: 0,
  firestoreWrites: 0,
  apiCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  retryCount: 0,
  realtimeListeners: 0,
  averageResponseTime: 0,
  totalResponseTime: 0,
  responseTimeCount: 0,
  isQuotaExceeded: (() => {
    try {
      const stored = localStorage.getItem('firestore_quota_exceeded');
      if (stored) {
        const { exceeded, timestamp } = JSON.parse(stored);
        // Reset if it's more than 12 hours old
        if (exceeded && Date.now() - timestamp < 12 * 60 * 60 * 1000) {
          return true;
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return false;
  })(),
  errors: [] as { timestamp: number; message: string; type: string }[]
};

export const telemetry = {
  isFirestoreQuotaExceeded() {
    return metrics.isQuotaExceeded;
  },
  setFirestoreQuotaExceeded(exceeded: boolean) {
    metrics.isQuotaExceeded = exceeded;
    try {
      localStorage.setItem('firestore_quota_exceeded', JSON.stringify({
        exceeded,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Ignore
    }
    if (exceeded) {
      console.warn('[TELEMETRY]: Firestore Quota Exceeded state activated.');
    }
  },
  logFirestoreRead(collection: string) { 
    metrics.firestoreReads++;
    console.log(`[TELEMETRY]: Firestore Read - ${collection}`); 
  },
  logFirestoreWrite(collection: string) { 
    metrics.firestoreWrites++;
    console.log(`[TELEMETRY]: Firestore Write - ${collection}`); 
  },
  logApiCall(endpoint: string) { 
    metrics.apiCalls++;
    console.log(`[TELEMETRY]: API Call - ${endpoint}`); 
  },
  logCacheHit(key: string) { 
    metrics.cacheHits++;
    console.log(`[TELEMETRY]: Cache Hit - ${key}`); 
  },
  logCacheMiss(key: string) { 
    metrics.cacheMisses++;
    console.log(`[TELEMETRY]: Cache Miss - ${key}`); 
  },
  logRetry() {
    metrics.retryCount++;
    console.log(`[TELEMETRY]: Retry Attempt`);
  },
  logRealtimeListener(action: 'add' | 'remove') {
    if (action === 'add') {
      metrics.realtimeListeners++;
    } else {
      metrics.realtimeListeners = Math.max(0, metrics.realtimeListeners - 1);
    }
    console.log(`[TELEMETRY]: Realtime Listeners Count: ${metrics.realtimeListeners}`);
  },
  logResponseTime(ms: number) {
    metrics.responseTimeCount++;
    metrics.totalResponseTime += ms;
    metrics.averageResponseTime = Math.round(metrics.totalResponseTime / metrics.responseTimeCount);
    console.log(`[TELEMETRY]: Response Time - ${ms}ms (Avg: ${metrics.averageResponseTime}ms)`);
  },
  logError(type: string, error: any) { 
    metrics.errors.push({ timestamp: Date.now(), message: String(error), type });
    console.error(`[TELEMETRY]: Error -`, error); 
  }
};
