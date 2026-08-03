import { firestore, isFirebaseQuotaError, setFirestoreQuotaExceeded } from "../firestore/collections.js";
import { serverCache } from "../utils/cache.js";

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function getDocWithFallback(
  collectionName: string,
  docId: string,
  staticFilename: string
): Promise<any | null> {
  // 1. Try static cache FIRST
  const staticData = serverCache.readStaticFile<any[]>(staticFilename);
  if (staticData) {
    const item = staticData.find((item: any) => item.id === docId);
    if (item) return item;
  }

  // 2. Fallback to Firestore with 3s timeout
  try {
    const docRef = firestore.collection(collectionName).doc(docId);
    const doc = await withTimeout(docRef.get(), 3000);
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
  } catch (err: any) {
    if (isFirebaseQuotaError(err)) {
      setFirestoreQuotaExceeded(true);
      console.info(`[Quota Exceeded] Firestore read failed for ${collectionName}/${docId}.`);
    } else {
      console.info(`[Firestore Error/Timeout] Failed to read ${collectionName}/${docId}:`, err?.message || err);
    }
  }

  return null;
}

