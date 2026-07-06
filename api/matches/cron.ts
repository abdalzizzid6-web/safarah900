import { Request, Response } from 'express';
import { syncMatchesForNotifications } from '../../server/services/matchService';

export default async function handler(req: Request, res: Response) {
  try {
    await syncMatchesForNotifications();
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
