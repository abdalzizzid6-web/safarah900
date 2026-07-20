import { Request, Response } from "express";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(req: Request, res: Response) {
  const diagnostic = {
    system: {
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
    },
    envKeys: Object.keys(process.env),
    firebase: {
      initialized: false,
      error: null as string | null,
    },
  };

  try {
    const apps = getApps();
    if (apps.length === 0) {
      // Basic check if service account key is available, without actually using it
      // if it's not present to prevent immediate crashes
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        initializeApp({
            credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
        });
        diagnostic.firebase.initialized = true;
      } else {
        diagnostic.firebase.error = "FIREBASE_SERVICE_ACCOUNT_KEY is missing";
      }
    } else {
        diagnostic.firebase.initialized = true;
    }
  } catch (e: any) {
    diagnostic.firebase.error = e.message;
  }

  res.status(200).json(diagnostic);
}
