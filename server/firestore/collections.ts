
import { firestore, auth, messaging, isFirebaseAdminReady, FieldValue } from '../../src/lib/firebase-admin';

export { firestore, auth, messaging, isFirebaseAdminReady, FieldValue };

export let isFirestoreQuotaExceeded = false;
export function setFirestoreQuotaExceeded(val: boolean) {
  isFirestoreQuotaExceeded = val;
  if (val) {
    console.warn('[Firestore Quota Protection] Global isFirestoreQuotaExceeded flag set to true. Server-side will run in localized cache-only mode.');
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
