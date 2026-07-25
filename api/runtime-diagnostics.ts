import { Request, Response } from "express";
import { performance } from "perf_hooks";

export default async function handler(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    vercelEnvironment: process.env.VERCEL_ENV || "unknown (or not on Vercel)",
    nodeEnv: process.env.NODE_ENV || "unknown",
    firebaseServiceAccountKeyPresent: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    firebaseAdminLoaded: false,
    firebaseAdminReady: false,
    firestoreInstancePresent: false,
    collectionsLoaded: false,
    seoLoaded: false,
    testQuerySuccessful: false,
    steps: []
  };

  const addStep = (name: string, fn: () => Promise<any> | any) => {
    const start = performance.now();
    diagnostics.steps.push({ name, status: "pending", durationMs: 0 });
    const currentStep = diagnostics.steps[diagnostics.steps.length - 1];
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.then(
          (resolvedVal) => {
            currentStep.status = "success";
            currentStep.durationMs = Number((performance.now() - start).toFixed(2));
            return resolvedVal;
          },
          (err) => {
            currentStep.status = "failed";
            currentStep.durationMs = Number((performance.now() - start).toFixed(2));
            currentStep.error = err.message;
            currentStep.stack = err.stack;
            throw err;
          }
        );
      } else {
        currentStep.status = "success";
        currentStep.durationMs = Number((performance.now() - start).toFixed(2));
        return result;
      }
    } catch (err: any) {
      currentStep.status = "failed";
      currentStep.durationMs = Number((performance.now() - start).toFixed(2));
      currentStep.error = err.message;
      currentStep.stack = err.stack;
      throw err;
    }
  };

  try {
    // Step 1: Import app's firebase-admin module
    let firebaseAdminMod: any;
    await addStep("Import firebase-admin.ts", async () => {
      firebaseAdminMod = await import("../src/lib/firebase-admin");
      diagnostics.firebaseAdminLoaded = true;
      diagnostics.firebaseAdminReady = firebaseAdminMod.isFirebaseAdminReady;
      diagnostics.firestoreInstancePresent = !!firebaseAdminMod.firestore;
    });

    // Step 2: Import server's collections module
    let collectionsMod: any;
    await addStep("Import collections.ts", async () => {
      collectionsMod = await import("../server/firestore/collections");
      diagnostics.collectionsLoaded = true;
    });

    // Step 3: Import api/seo.ts module
    await addStep("Import api/seo.ts", async () => {
      await import("./seo");
      diagnostics.seoLoaded = true;
    });

    // Step 4: Execute a simple Firestore query via the application's actual Firestore Proxy / Collection list
    await addStep("Execute test query on rss_sources", async () => {
      if (!collectionsMod || !collectionsMod.collections) {
        throw new Error("Collections module is not properly loaded.");
      }
      const snapshot = await collectionsMod.collections.rssSources().limit(1).get();
      diagnostics.testQuerySuccessful = true;
      diagnostics.testQueryDocsCount = snapshot.size;
    });

    return res.status(200).json({
      success: true,
      diagnostics
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
      diagnostics
    });
  }
}
