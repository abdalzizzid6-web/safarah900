import { firestore, isFirebaseQuotaError, setFirestoreQuotaExceeded } from "../firestore/collections";
import { serverCache } from "../utils/cache";

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

  // 2. Fallback to Firestore
  try {
    const docRef = firestore.collection(collectionName).doc(docId);
    const doc = await docRef.get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
  } catch (err: any) {
    if (isFirebaseQuotaError(err)) {
      setFirestoreQuotaExceeded(true);
      console.warn(`[Quota Exceeded] Firestore read failed for ${collectionName}/${docId}.`);
    } else {
      console.error(`[Firestore Error] Failed to read ${collectionName}/${docId}:`, err);
    }
  }

  return null;
}
