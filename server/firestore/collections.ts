
import { firestore as rawFirestore, auth, messaging, isFirebaseAdminReady, FieldValue } from '../../src/lib/firebase-admin';

export let isFirestoreQuotaExceeded = false;
let resetTimer: NodeJS.Timeout | null = null;

export function setFirestoreQuotaExceeded(val: boolean) {
  isFirestoreQuotaExceeded = val;
  if (val) {
    console.warn('[Firestore Quota Protection] Global isFirestoreQuotaExceeded flag set to true. Server-side will run in localized cache-only mode.');
    
    // Automatically reset after 1 hour to retry Firestore connectivity
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
        isFirestoreQuotaExceeded = false;
        console.warn('[Firestore Quota Protection] Quota exceeded flag reset. Retrying Firestore connectivity.');
    }, 60 * 60 * 1000); // 1 hour
  } else {
    if (resetTimer) clearTimeout(resetTimer);
  }
}

export function checkFirestoreQuota() {
  if (isFirestoreQuotaExceeded) {
    const e = new Error('Quota exceeded - Firestore blocked');
    (e as any).code = 'RESOURCE_EXHAUSTED';
    throw e;
  }
}

// Helper to check if an error is a Firebase/Firestore quota limit error
export function isFirebaseQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return (
    msg.includes('quota') ||
    msg.includes('exhausted') ||
    msg.includes('resource_exhausted') ||
    err.code === 8 ||
    err.code === 'resource-exhausted'
  );
}

// Proxy Firestore to block calls when quota is exceeded, with a fallback target to prevent TypeError if rawFirestore is undefined during module load
console.log(`[DIAGNOSTIC-LOG] [Module Loading] [collections.ts] Module loading started. rawFirestore exists: ${!!rawFirestore}, isFirebaseAdminReady: ${isFirebaseAdminReady}`);

const createDummyMock = () => {
  const dummyQuery: any = (...args: any[]): any => dummyQuery;
  dummyQuery.where = () => dummyQuery;
  dummyQuery.orderBy = () => dummyQuery;
  dummyQuery.limit = () => dummyQuery;
  dummyQuery.select = () => dummyQuery;
  dummyQuery.startAfter = () => dummyQuery;
  dummyQuery.endAt = () => dummyQuery;
  dummyQuery.get = () => Promise.resolve({ docs: [], forEach: (cb: any) => {}, size: 0, empty: true });
  dummyQuery.set = () => Promise.resolve();
  dummyQuery.update = () => Promise.resolve();
  dummyQuery.delete = () => Promise.resolve();
  dummyQuery.doc = (docId?: string) => ({
    get: () => Promise.resolve({ exists: false, id: docId || 'mock-id', data: () => undefined }),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    collection: () => dummyQuery,
  });
  dummyQuery.collection = () => dummyQuery;
  return dummyQuery;
};

const firestore = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!rawFirestore) {
      if (prop === 'collection' || prop === 'doc' || prop === 'batch' || prop === 'runTransaction') {
        console.warn(`[collections.ts Proxy] Property "${String(prop)}" accessed but rawFirestore is not ready. Returning safe mock.`);
        return createDummyMock();
      }
      return undefined;
    }

    const value = Reflect.get(rawFirestore, prop, receiver);

    // Only intercept top-level methods that interact with Firestore collections/docs
    if (isFirestoreQuotaExceeded && (prop === 'collection' || prop === 'doc' || prop === 'batch' || prop === 'runTransaction')) {
      console.warn(`[DIAGNOSTIC-LOG] [collections.ts Proxy] Firestore blocked due to exceeded quota during property: "${String(prop)}". Returning mock.`);
      return createDummyMock();
    }
    
    // Bind functions to rawFirestore to ensure 'this' is correct
    if (typeof value === 'function') {
        return value.bind(rawFirestore);
    }
    return value;
  }
});

export { firestore, auth, messaging, isFirebaseAdminReady, FieldValue };

export function handleFirestoreError(err: any): boolean {
  if (isFirebaseQuotaError(err)) {
    setFirestoreQuotaExceeded(true);
    return true;
  }
  return false;
}

// Helper to access common collections with type safety or labels if needed
export const collections = {
  matches: () => firestore.collection('matches'),
  news: () => firestore.collection('news'),
  users: () => firestore.collection('users'),
  predictions: () => firestore.collection('predictions'),
  userPoints: () => firestore.collection('user_points'),
  rssSources: () => firestore.collection('rss_sources'),
  socialQueue: () => firestore.collection('social_queue'),
  socialAccounts: () => firestore.collection('social_accounts'),
  socialLogs: () => firestore.collection('social_logs'),
  securityAudits: () => firestore.collection('security_audits'),
  systemSettings: () => firestore.collection('system_settings'),
  sources: () => firestore.collection('sources'),
  leagues: () => firestore.collection('leagues'),
  teams: () => firestore.collection('teams'),
  players: () => firestore.collection('players'),
  cmsLeagues: () => firestore.collection('cms_leagues'),
  cmsServers: () => firestore.collection('cms_channels_servers'),
  worldCupCache: () => firestore.collection('worldcup_cache'),
};
