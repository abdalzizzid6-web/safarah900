import { Request, Response } from 'express';
import { firestore } from '../server/firestore/collections';
import { generateMatchContent } from '../server/services/aiContentService';

const TIME_7_DAYS = 7 * 24 * 60 * 60 * 1000;
const TIME_30_DAYS = 30 * 24 * 60 * 60 * 1000;

function isCacheExpired(contentData: any): boolean {
  if (!contentData || !contentData.generatedAt) return true;
  const generatedAtMs = new Date(contentData.generatedAt).getTime();
  if (isNaN(generatedAtMs)) return true;
  const ageMs = Date.now() - generatedAtMs;
  const isFinished = contentData.isMatchFinished || false;
  return ageMs > (isFinished ? TIME_30_DAYS : TIME_7_DAYS);
}

export default async function handler(req: Request, res: Response) {
  const action = req.query.action as string;

  // --- 1. MATCH ANALYSIS ROUTE ---
  if (action === 'match-analysis') {
    return res.json({ message: 'Match Analysis' });
  }

  // --- 2. TACTICAL ANALYSIS ROUTE ---
  if (action === 'tactical-analysis') {
    return res.json({ message: 'Tactical Analysis' });
  }

  // --- 3. MATCH CONTENT ROUTE (DEFAULT OR ACTION match-content) ---
  const matchId = req.query.matchId as string;
  const regenerate = req.query.regenerate === 'true';
  if (!matchId) return res.status(400).json({ error: 'matchId is required' });

  try {
    const docRef = firestore.collection('match_ai_analysis').doc(matchId);
    const doc = await docRef.get();
    
    if (doc.exists && !regenerate) {
      return res.json(doc.data());
    }
    
    const matchDoc = await firestore.collection('matches').doc(matchId).get();
    if (!matchDoc.exists) return res.status(404).json({ error: 'Match not found' });
    
    const content = await generateMatchContent({ ...matchDoc.data(), id: matchId });
    return res.json(content);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
