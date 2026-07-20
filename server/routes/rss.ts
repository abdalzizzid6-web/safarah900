import express from "express";
import { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError, handleFirestoreError } from "../firestore/collections";
import { authMiddleware } from "../middleware/auth";
import { serverCache } from "../utils/cache";
import {
  syncRssProvider,
  syncAllRssProviders,
  transitionImportedArticleStatus,
  classifyArticleWithAi,
  runSeedArabicLogic
} from "../services/rssService";

const router = express.Router();

// Get list of all RSS Providers
router.get("/providers", authMiddleware('editor'), async (req, res) => {
  const cacheKey = "rss_providers_list";
  const cached = serverCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    if (!firestore) return res.status(500).json({ error: "Firestore not initialized" });
    const snapshot = await firestore.collection("rss_sources").get();
    const providers = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    serverCache.set(cacheKey, providers, 5 * 60 * 1000); // 5 mins cache
    res.json(providers);
  } catch (err: any) {
    if (handleFirestoreError(err)) {
        return res.status(503).json({ error: "Service temporarily unavailable" });
    }
    res.status(500).json({ error: err.message });
  }
});

// Add or update an RSS Provider
router.post("/providers", authMiddleware('editor'), async (req, res) => {
  try {
    if (!firestore) return res.status(500).json({ error: "Firestore not initialized" });
    const provider = req.body;
    const docId = provider.id || provider.name.replace(/\s+/g, '_').toLowerCase();

    const payload = {
      id: docId,
      name: provider.name,
      logo: provider.logo || "",
      url: provider.url || provider.feedUrl,
      language: provider.language || "العربية",
      country: provider.country || "عالمي",
      sport: provider.sport || "كرة القدم",
      category: provider.category || "عام",
      enabled: provider.enabled !== false,
      updateInterval: Number(provider.updateInterval || 30),
      lastSync: provider.lastSync || null,
      lastError: provider.lastError || null,
      status: provider.status || "ACTIVE",
      updatedAt: new Date().toISOString()
    };

    await firestore.collection("rss_sources").doc(docId).set(payload, { merge: true });
    res.json({ success: true, id: docId, provider: payload });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an RSS Provider
router.delete("/providers/:id", authMiddleware('editor'), async (req, res) => {
  try {
    if (!firestore) return res.status(500).json({ error: "Firestore not initialized" });
    const { id } = req.params;
    await firestore.collection("rss_sources").doc(id).delete();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle RSS Provider active/disabled status
router.post("/providers/:id/toggle", authMiddleware('editor'), async (req, res) => {
  try {
    if (!firestore) return res.status(500).json({ error: "Firestore not initialized" });
    const { id } = req.params;
    const docRef = firestore.collection("rss_sources").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Provider not found" });

    const current = snap.data();
    const newEnabled = !(current?.enabled);
    await docRef.update({ enabled: newEnabled, updatedAt: new Date().toISOString() });

    res.json({ success: true, enabled: newEnabled });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sync all enabled RSS Providers
router.post("/sync/all", authMiddleware('editor'), async (req, res) => {
  try {
    // Trigger background sync task
    syncAllRssProviders().then((results) => {
    }).catch((err) => {
      console.error("[Background Sync] All providers sync failed:", err.message);
    });

    res.json({ success: true, message: "تم بدء مزامنة كافة المصادر النشطة في الخلفية بنجاح" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sync a single RSS Provider
router.post("/sync/:id", authMiddleware('editor'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Trigger background sync task
    syncRssProvider(id).then((stats) => {
    }).catch((err) => {
      console.error(`[Background Sync] Provider ${id} sync failed:`, err.message);
    });

    res.json({ success: true, message: "تم بدء مزامنة المصدر في الخلفية بنجاح" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get articles moderation queue with query and pagination
router.get("/queue", authMiddleware('editor'), async (req, res) => {
  try {
    if (!firestore) return res.status(500).json({ error: "Firestore not initialized" });
    const { status, providerId, search } = req.query;

    let query: any = firestore.collection("rss_imports");

    if (status) {
      query = query.where("status", "==", status);
    }
    if (providerId) {
      query = query.where("providerId", "==", providerId);
    }

    query = query.orderBy("pubDate", "desc").limit(100);
    const snapshot = await query.get();
    let articles = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    // Apply client-side search filter to respect firestore index constraints
    if (search) {
      const s = String(search).toLowerCase();
      articles = articles.filter((art: any) => 
        (art.title && art.title.toLowerCase().includes(s)) || 
        (art.description && art.description.toLowerCase().includes(s))
      );
    }

    res.json(articles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Edit article details in the queue
router.post("/queue/:id/edit", authMiddleware('editor'), async (req, res) => {
  try {
    if (!firestore) return res.status(500).json({ error: "Firestore not initialized" });
    const { id } = req.params;
    const updates = req.body;

    const docRef = firestore.collection("rss_imports").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Article not found" });

    const nowStr = new Date().toISOString();
    const cleanUpdates = {
      title: updates.title,
      description: updates.description,
      imageUrl: updates.imageUrl,
      classification: {
        league: updates.classification?.league || "عام",
        competition: updates.classification?.competition || "General",
        teams: updates.classification?.teams || [],
        players: updates.classification?.players || [],
        country: updates.classification?.country || "عالمي",
        articleType: updates.classification?.articleType || "تقرير إخباري",
        suggestedTags: updates.classification?.suggestedTags || []
      },
      seo: {
        ...snap.data()?.seo,
        metaTitle: updates.seo?.metaTitle || updates.title,
        metaDescription: updates.seo?.metaDescription || updates.description,
        readingTime: updates.seo?.readingTime || 1,
        keywords: updates.classification?.suggestedTags || []
      },
      updatedAt: nowStr
    };

    await docRef.update(cleanUpdates);
    res.json({ success: true, article: { id, ...cleanUpdates } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change status/moderate an article in the queue
router.post("/queue/:id/status", authMiddleware('editor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, publishSchedule } = req.body;
    const success = await transitionImportedArticleStatus(id, status, publishSchedule);
    if (!success) return res.status(404).json({ error: "Article not found or status update failed" });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Re-run AI classification on an article
router.post("/queue/:id/classify", authMiddleware('editor'), async (req, res) => {
  try {
    if (!firestore) return res.status(500).json({ error: "Firestore not initialized" });
    const { id } = req.params;
    const docRef = firestore.collection("rss_imports").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Article not found" });

    const article = snap.data() || {};
    const meta = await classifyArticleWithAi(article.title, article.description || "");

    await docRef.update({
      classification: meta.classification,
      intelligence: meta.intelligence,
      sportsDetection: meta.sportsDetection,
      imageIntel: meta.imageIntel,
      aiEditor: meta.aiEditor,
      translations: meta.translations,
      seo: {
        ...article.seo,
        metaTitle: meta.seo.metaTitle,
        metaDescription: meta.seo.metaDescription,
        readingTime: meta.seo.readingTime,
        keywords: meta.classification.suggestedTags
      },
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      classification: meta.classification,
      seo: meta.seo,
      intelligence: meta.intelligence,
      sportsDetection: meta.sportsDetection,
      imageIntel: meta.imageIntel,
      aiEditor: meta.aiEditor,
      translations: meta.translations
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Seed mock/fallback Arabic providers initially if database empty
router.post("/seed", authMiddleware('editor'), async (req, res) => {
  try {
    await runSeedArabicLogic();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Compile analytics statistics for the RSS aggregation system
router.get("/analytics", authMiddleware('editor'), async (req, res) => {
  const cacheKey = "rss_analytics_summary";
  const cached = serverCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    if (!firestore) return res.status(500).json({ error: "Firestore not initialized" });

    // Use aggregations or limited queries (Rule 4, 16)
    const providersSnap = await firestore.collection("rss_sources").get();
    const providersCount = providersSnap.size;

    // To avoid reading thousands of imports, we fetch the most recent ones or use counts if we had an aggregator
    // For now, let's limit to 500 for stats compilation or use the firestore count() if available in this SDK version
    // If count() is not available, we use a smaller limit to prevent quota exhaustion
    const importsSnap = await firestore.collection("rss_imports").limit(200).get(); 
    const articles = importsSnap.docs.map((doc: any) => doc.data());

    const totalImported = articles.length;
    const pendingReview = articles.filter((a: any) => a.status === "REVIEW").length;
    const approved = articles.filter((a: any) => a.status === "APPROVED").length;
    const published = articles.filter((a: any) => a.status === "PUBLISHED").length;
    const rejected = articles.filter((a: any) => a.status === "REJECTED").length;

    // Track active vs failed provider health
    const activeProviders = providersSnap.docs.filter((d: any) => d.data().enabled).length;
    const failedProviders = providersSnap.docs.filter((d: any) => d.data().status === "FAILED").length;
    const syncSuccessRate = providersCount > 0 ? Math.round(((providersCount - failedProviders) / providersCount) * 100) : 100;

    const stats = {
      totalProviders: providersCount,
      activeProviders,
      failedProviders,
      syncSuccessRate,
      totalImported,
      pendingReview,
      approved,
      published,
      rejected,
      duplicateRate: 12 // Default/Estimated
    };

    serverCache.set(cacheKey, stats, 30 * 60 * 1000); // 30 mins cache (Rule 16)
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
