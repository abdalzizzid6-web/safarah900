import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  console.log('[MODULE LOAD START] Loading modules for rss.ts');
  let firestore;
  try {
    const collectionsMod = await import('../server/firestore/collections');
    firestore = collectionsMod.firestore;
    console.log('[MODULE LOAD SUCCESS] Modules loaded for rss.ts');
  } catch (e) {
    console.error('[MODULE LOAD FAILED] Modules failed to load for rss.ts', e);
    throw e;
  }
  
  const action = req.query.action as string;

  // --- 1. SYNC ROUTE ---
  if (action === 'sync') {
    return res.json({ message: 'RSS Sync' });
  }

  // --- 2. PROVIDERS ROUTE (DEFAULT OR ACTION providers) ---
  if (req.method === 'GET') {
    try {
      const snapshot = await firestore.collection("rss_sources").get();
      const providers = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      return res.json(providers);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'POST') {
    try {
      const provider = req.body;
      const docId = provider.id || provider.name.replace(/\s+/g, '_').toLowerCase();
      const payload = {
        name: provider.name,
        logo: provider.logo || "",
        url: provider.url || provider.feedUrl,
        language: provider.language || "العربية",
        country: provider.country || "عالمي",
        sport: provider.sport || "كرة القدم",
        category: provider.category || "عام",
        enabled: provider.enabled !== false,
        updateInterval: Number(provider.updateInterval || 30),
        lastSync: provider.lastSync || null,
        lastError: provider.lastError || null,
        status: provider.status || "ACTIVE",
        updatedAt: new Date().toISOString()
      };

      await firestore.collection("rss_sources").doc(docId).set(payload, { merge: true });
      return res.json({ success: true, id: docId, provider: payload });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
