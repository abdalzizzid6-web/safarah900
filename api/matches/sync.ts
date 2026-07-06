import { Request, Response } from 'express';
import { firestore } from '../../server/firestore/collections';
import { syncFromSource } from '../../server/services/syncService';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sourceId } = req.body;
  if (!sourceId) {
    return res.status(400).json({ error: 'sourceId is required' });
  }

  try {
    const doc = await firestore.collection('rss_sources').doc(sourceId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    await syncFromSource(doc.data());
    
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
