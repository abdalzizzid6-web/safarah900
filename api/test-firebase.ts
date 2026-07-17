import { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json");
  const diagnostics: any = {
    env: {
      FIREBASE_SERVICE_ACCOUNT_KEY_exists: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      NODE_ENV: process.env.NODE_ENV,
    },
    steps: []
  };

  try {
    diagnostics.steps.push("Step 1: Attempting dynamic import of firebase-admin/app");
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    diagnostics.steps.push("Step 2: Loaded firebase-admin/app successfully");

    diagnostics.steps.push("Step 3: Attempting dynamic import of firebase-admin/firestore");
    const { getFirestore } = await import("firebase-admin/firestore");
    diagnostics.steps.push("Step 4: Loaded firebase-admin/firestore successfully");

    diagnostics.steps.push("Step 5: Checking existing apps");
    const apps = getApps();
    diagnostics.steps.push(`Step 6: Existing apps count: ${apps.length}`);

    diagnostics.steps.push("Step 7: Initializing app");
    let app;
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      diagnostics.steps.push("Step 7.1: Service account key exists, parsing");
      const serviceAccount = JSON.parse(serviceAccountKey);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }
      app = apps.length === 0 ? initializeApp({
        credential: cert(serviceAccount),
        projectId: "gen-lang-client-0959045190"
      }) : apps[0];
    } else {
      diagnostics.steps.push("Step 7.2: No service account key, falling back to ambient");
      app = apps.length === 0 ? initializeApp({ projectId: "gen-lang-client-0959045190" }) : apps[0];
    }
    diagnostics.steps.push("Step 8: App initialized successfully");

    diagnostics.steps.push("Step 9: Getting Firestore instance");
    const db = getFirestore(app, "ai-studio-safarah90-8063f3e8-1dda-4447-afcd-1abf0dc4041d");
    diagnostics.steps.push("Step 10: Firestore instance retrieved successfully");

    diagnostics.steps.push("Step 11: Attempting simple Firestore query (limit 1)");
    const snap = await db.collection("rss_sources").limit(1).get();
    diagnostics.steps.push(`Step 12: Firestore query completed. Docs count: ${snap.size}`);

    return res.status(200).json({
      success: true,
      diagnostics
    });
  } catch (err: any) {
    console.error("[DIAGNOSTICS ERROR]", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
      diagnostics
    });
  }
}
