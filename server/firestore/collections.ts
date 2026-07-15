
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

// Proxy Firestore to block calls when quota is exceeded
const firestore = new Proxy(rawFirestore, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);

    // Only intercept top-level methods that interact with Firestore collections/docs
    if (isFirestoreQuotaExceeded && (prop === 'collection' || prop === 'doc' || prop === 'batch' || prop === 'runTransaction')) {
      const e = new Error('Quota exceeded - Firestore blocked');
      (e as any).code = 'RESOURCE_EXHAUSTED';
      throw e;
    }
    
    // Bind functions to the target to ensure 'this' is correct
    if (typeof value === 'function') {
        return value.bind(target);
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
