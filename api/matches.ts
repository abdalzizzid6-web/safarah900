import { Request, Response } from 'express';
import { firestore, FieldValue } from '../server/firestore/collections';
import { syncMatchesForNotifications } from '../server/services/matchService';
import { syncFromSource } from '../server/services/syncService';

export default async function handler(req: Request, res: Response) {
  const action = req.query.action as string;

  // --- 1. CRON ROUTE ---
  if (action === 'cron') {
    try {
      await syncMatchesForNotifications();
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // --- 2. EVENTS ROUTE ---
  if (action === 'events') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { matchId, event, userId, userName } = req.body;
    if (!matchId || !event) {
      return res.status(400).json({ error: 'matchId and event are required' });
    }

    try {
      const matchRef = firestore.collection('matches').doc(matchId);
      
      // Atomically add event to the events array
      await matchRef.update({
        events: FieldValue.arrayUnion(event),
        updatedAt: new Date().toISOString()
      });

      await firestore.collection('match_audit_logs').add({
        matchId,
        userId: userId || 'system',
        userName: userName || 'System',
        action: 'EventAdded',
        details: `Event added: ${event.type} - ${event.detail}`,
        timestamp: FieldValue.serverTimestamp()
      });

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // --- 3. SYNC ROUTE ---
  if (action === 'sync') {
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

  return res.status(400).json({ error: 'Invalid or missing action parameter' });
}
