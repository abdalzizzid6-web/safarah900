
import { firestore as rawFirestore, auth, messaging, isFirebaseAdminReady, FieldValue } from '../../src/lib/firebase-admin.js';

export let isFirestoreQuotaExceeded = false;
let resetTimer: NodeJS.Timeout | null = null;

export function setFirestoreQuotaExceeded(val: boolean) {
  isFirestoreQuotaExceeded = val;
  if (val) {
    console.info('[Firestore Quota Protection] Global isFirestoreQuotaExceeded flag set to true. Server-side will run in localized cache-only mode.');
    
    // Automatically reset after 1 hour to retry Firestore connectivity
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
        isFirestoreQuotaExceeded = false;
        console.info('[Firestore Quota Protection] Quota exceeded flag reset. Retrying Firestore connectivity.');
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

const createDummyDoc = (docId?: string) => {
  const docObj: any = {
    id: docId || 'mock-id',
    ref: null,
    get: () => Promise.resolve({ exists: false, id: docId || 'mock-id', data: () => undefined }),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    collection: () => createDummyMock(),
  };
  docObj.ref = docObj;
  return docObj;
};

const createDummyMock = () => {
  const dummyQuery: any = (...args: any[]): any => dummyQuery;
  dummyQuery.where = () => dummyQuery;
  dummyQuery.orderBy = () => dummyQuery;
  dummyQuery.limit = () => dummyQuery;
  dummyQuery.select = () => dummyQuery;
  dummyQuery.startAfter = () => dummyQuery;
  dummyQuery.endAt = () => dummyQuery;
  dummyQuery.get = () => Promise.resolve({ docs: [], forEach: (cb: any) => {}, size: 0, empty: true });
  dummyQuery.set = () => Promise.resolve(dummyQuery);
  dummyQuery.update = () => Promise.resolve(dummyQuery);
  dummyQuery.delete = () => Promise.resolve(dummyQuery);
  dummyQuery.add = () => Promise.resolve({ id: 'mock-id', get: () => Promise.resolve({ exists: false, data: () => undefined }) });
  dummyQuery.commit = () => Promise.resolve([]);

  dummyQuery.then = (resolve: any) => Promise.resolve({ exists: false, id: 'mock-id', data: () => undefined, docs: [], forEach: (cb: any) => {}, size: 0, empty: true }).then(resolve);
  dummyQuery.catch = (reject: any) => Promise.resolve().catch(reject);

  dummyQuery.doc = (docId?: string) => createDummyDoc(docId);
  dummyQuery.collection = () => createDummyMock();
  return dummyQuery;
};

const createDummyBatch = () => {
  const batch: any = {
    set: () => batch,
    update: () => batch,
    delete: () => batch,
    commit: () => Promise.resolve([]),
  };
  return batch;
};

const createDummyTransaction = () => {
  const dummyDoc = (docId?: string) => ({
    exists: false,
    id: docId || 'mock-id',
    data: () => undefined,
  });
  const tx: any = {
    get: async (docRef: any) => {
      if (docRef && typeof docRef.get === 'function') {
        return docRef.get();
      }
      return dummyDoc();
    },
    set: (docRef: any, data: any, options?: any) => tx,
    update: (docRef: any, data: any) => tx,
    delete: (docRef: any) => tx,
  };
  return tx;
};

function wrapQuery(queryObj: any): any {
  if (!queryObj || typeof queryObj !== 'object') return queryObj;
  
  const wrapped: any = new Proxy(queryObj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === 'get') {
        return async (...args: any[]) => {
          if (isFirestoreQuotaExceeded) {
            return { docs: [], forEach: (cb: any) => {}, size: 0, empty: true };
          }
          try {
            return await value.apply(target, args);
          } catch (err) {
            if (isFirebaseQuotaError(err)) {
              setFirestoreQuotaExceeded(true);
              console.info('[Firestore Quota Protection] Intercepted quota error during query .get(). Falling back to empty result.');
              return { docs: [], forEach: (cb: any) => {}, size: 0, empty: true };
            }
            throw err;
          }
        };
      }
      if (prop === 'where' || prop === 'orderBy' || prop === 'limit' || prop === 'select' || prop === 'startAfter' || prop === 'endAt') {
        return (...args: any[]) => {
          try {
            const res = value.apply(target, args);
            return wrapQuery(res);
          } catch (err) {
            if (isFirebaseQuotaError(err)) {
              setFirestoreQuotaExceeded(true);
              return wrapped;
            }
            throw err;
          }
        };
      }
      if (prop === 'doc') {
        return (docPath?: string) => {
          try {
            const docRes = value.call(target, docPath);
            return wrapDoc(docRes);
          } catch (err) {
            if (isFirebaseQuotaError(err)) {
              setFirestoreQuotaExceeded(true);
              return createDummyDoc(docPath);
            }
            throw err;
          }
        };
      }
      if (prop === 'add') {
        return async (...args: any[]) => {
          if (isFirestoreQuotaExceeded) {
            return { id: 'mock-id', get: () => Promise.resolve({ exists: false, data: () => undefined }) };
          }
          try {
            return await value.apply(target, args);
          } catch (err) {
            if (isFirebaseQuotaError(err)) {
              setFirestoreQuotaExceeded(true);
              return { id: 'mock-id', get: () => Promise.resolve({ exists: false, data: () => undefined }) };
            }
            throw err;
          }
        };
      }
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    }
  });

  return wrapped;
}

function wrapDoc(docObj: any): any {
  if (!docObj || typeof docObj !== 'object') return docObj;
  
  const wrapped: any = new Proxy(docObj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === 'get') {
        return async (...args: any[]) => {
          if (isFirestoreQuotaExceeded) {
            return { exists: false, id: target.id || 'mock-id', data: () => undefined };
          }
          try {
            return await value.apply(target, args);
          } catch (err) {
            if (isFirebaseQuotaError(err)) {
              setFirestoreQuotaExceeded(true);
              console.info('[Firestore Quota Protection] Intercepted quota error during doc .get(). Falling back to non-existent doc.');
              return { exists: false, id: target.id || 'mock-id', data: () => undefined };
            }
            throw err;
          }
        };
      }
      if (prop === 'set' || prop === 'update' || prop === 'delete') {
        return async (...args: any[]) => {
          if (isFirestoreQuotaExceeded) {
            return target;
          }
          try {
            return await value.apply(target, args);
          } catch (err) {
            if (isFirebaseQuotaError(err)) {
              setFirestoreQuotaExceeded(true);
              console.info(`[Firestore Quota Protection] Intercepted quota error during doc .${String(prop)}(). Skipping write operation.`);
              return target;
            }
            throw err;
          }
        };
      }
      if (prop === 'collection') {
        return (colPath: string) => {
          try {
            const colRes = value.call(target, colPath);
            return wrapQuery(colRes);
          } catch (err) {
            if (isFirebaseQuotaError(err)) {
              setFirestoreQuotaExceeded(true);
              return createDummyMock();
            }
            throw err;
          }
        };
      }
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    }
  });

  return wrapped;
}

const firestore = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (!rawFirestore || isFirestoreQuotaExceeded) {
      if (prop === 'batch') {
        console.info(`[collections.ts Proxy] Quota exceeded or rawFirestore not ready. Returning mock batch.`);
        return () => createDummyBatch();
      }
      if (prop === 'runTransaction') {
        console.info(`[collections.ts Proxy] Quota exceeded or rawFirestore not ready. Returning mock transaction.`);
        return async (updateFunction: any) => updateFunction(createDummyTransaction());
      }
      if (prop === 'collection' || prop === 'doc') {
        return createDummyMock();
      }
      return undefined;
    }

    const value = Reflect.get(rawFirestore, prop, receiver);

    if (prop === 'collection') {
      return (collectionPath: string) => {
        try {
          const colRef = value.call(rawFirestore, collectionPath);
          return wrapQuery(colRef);
        } catch (err) {
          if (isFirebaseQuotaError(err)) {
            setFirestoreQuotaExceeded(true);
            return createDummyMock();
          }
          throw err;
        }
      };
    }

    if (prop === 'doc') {
      return (docPath: string) => {
        try {
          const docRef = value.call(rawFirestore, docPath);
          return wrapDoc(docRef);
        } catch (err) {
          if (isFirebaseQuotaError(err)) {
            setFirestoreQuotaExceeded(true);
            return createDummyDoc(docPath);
          }
          throw err;
        }
      };
    }

    if (prop === 'runTransaction') {
      return async (updateFunction: any) => {
        try {
          return await value.call(rawFirestore, async (transaction: any) => {
            const wrappedTx = {
              get: async (docRef: any) => {
                if (isFirestoreQuotaExceeded) return { exists: false, data: () => undefined };
                try {
                  return await transaction.get(docRef);
                } catch (err) {
                  if (isFirebaseQuotaError(err)) {
                    setFirestoreQuotaExceeded(true);
                    return { exists: false, data: () => undefined };
                  }
                  throw err;
                }
              },
              set: (docRef: any, data: any, options?: any) => {
                if (isFirestoreQuotaExceeded) return transaction;
                try {
                  return transaction.set(docRef, data, options);
                } catch (err) {
                  if (isFirebaseQuotaError(err)) {
                    setFirestoreQuotaExceeded(true);
                    return transaction;
                  }
                  throw err;
                }
              },
              update: (docRef: any, data: any) => {
                if (isFirestoreQuotaExceeded) return transaction;
                try {
                  return transaction.update(docRef, data);
                } catch (err) {
                  if (isFirebaseQuotaError(err)) {
                    setFirestoreQuotaExceeded(true);
                    return transaction;
                  }
                  throw err;
                }
              },
              delete: (docRef: any) => {
                if (isFirestoreQuotaExceeded) return transaction;
                try {
                  return transaction.delete(docRef);
                } catch (err) {
                  if (isFirebaseQuotaError(err)) {
                    setFirestoreQuotaExceeded(true);
                    return transaction;
                  }
                  throw err;
                }
              }
            };
            return await updateFunction(wrappedTx);
          });
        } catch (err) {
          if (isFirebaseQuotaError(err)) {
            setFirestoreQuotaExceeded(true);
            return updateFunction(createDummyTransaction());
          }
          throw err;
        }
      };
    }

    if (prop === 'batch') {
      return () => {
        try {
          const batch = value.call(rawFirestore);
          return {
            set: (docRef: any, data: any, options?: any) => {
              if (isFirestoreQuotaExceeded) return batch;
              try { return batch.set(docRef, data, options); } catch (e) { if (isFirebaseQuotaError(e)) { setFirestoreQuotaExceeded(true); } return batch; }
            },
            update: (docRef: any, data: any) => {
              if (isFirestoreQuotaExceeded) return batch;
              try { return batch.update(docRef, data); } catch (e) { if (isFirebaseQuotaError(e)) { setFirestoreQuotaExceeded(true); } return batch; }
            },
            delete: (docRef: any) => {
              if (isFirestoreQuotaExceeded) return batch;
              try { return batch.delete(docRef); } catch (e) { if (isFirebaseQuotaError(e)) { setFirestoreQuotaExceeded(true); } return batch; }
            },
            commit: async () => {
              if (isFirestoreQuotaExceeded) return [];
              try {
                return await batch.commit();
              } catch (err) {
                if (isFirebaseQuotaError(err)) {
                  setFirestoreQuotaExceeded(true);
                  console.info('[Firestore Quota Protection] Intercepted quota error during batch.commit(). Returning empty.');
                  return [];
                }
                throw err;
              }
            }
          };
        } catch (err) {
          if (isFirebaseQuotaError(err)) {
            setFirestoreQuotaExceeded(true);
            return createDummyBatch();
          }
          throw err;
        }
      };
    }

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
