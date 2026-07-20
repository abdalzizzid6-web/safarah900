import { Request, Response } from "express";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(req: Request, res: Response) {
  const diagnostic = {
    envKeys: Object.keys(process.env),
    firebase: {
      initialized: false,
      error: null as string | null,
    },
    firestore: {
      docCount: null as number | null,
      error: null as string | null,
    },
  };

  try {
    let app;
    const apps = getApps();
    if (apps.length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        app = initializeApp({
          credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
        });
        diagnostic.firebase.initialized = true;
      } else {
        diagnostic.firebase.error = "FIREBASE_SERVICE_ACCOUNT_KEY missing";
      }
    } else {
      app = apps[0];
      diagnostic.firebase.initialized = true;
    }

    if (app) {
      const db = getFirestore(app);
      // Try to get count of a small collection, e.g., 'matches'
      const snapshot = await db.collection("matches").limit(1).get();
      diagnostic.firestore.docCount = snapshot.size;
    }
  } catch (e: any) {
    diagnostic.firestore.error = e.message;
  }

  res.status(200).json(diagnostic);
}
