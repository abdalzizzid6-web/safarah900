import { Request, Response } from 'express';
import { firestore } from '../../server/firestore/collections';
import { FieldValue } from '../../server/firestore/collections';

export default async function handler(req: Request, res: Response) {
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
