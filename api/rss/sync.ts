import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  res.json({ message: 'RSS Sync' });
}
