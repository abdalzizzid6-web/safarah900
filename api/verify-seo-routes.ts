import { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  const diagnostic = {
    cwd: process.cwd(),
    env: {
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      NODE_ENV: process.env.NODE_ENV,
    },
    modules: {
      firebaseAdmin: false as boolean | string,
    },
    error: null as string | null,
  };

  try {
    await import("firebase-admin");
    diagnostic.modules.firebaseAdmin = true;
  } catch (e: any) {
    diagnostic.modules.firebaseAdmin = `Failed to import: ${e.message}`;
  }

  res.status(200).json(diagnostic);
}
