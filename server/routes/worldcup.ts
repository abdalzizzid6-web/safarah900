import express from "express";
import { firestore } from "../firestore/collections";
import { authMiddleware } from "../middleware/auth";
import { FieldValue } from "firebase-admin/firestore";

const router = express.Router();

/**
 * GET /api/world-cup/matches
 * Returns list of tournament matches
 */
router.get("/matches", async (req, res) => {
  try {
    const snapshot = await firestore.collection('matches')
      .where('competitionId', '==', 'WC') // Assuming 'WC' is the competition ID
      .orderBy('date', 'asc')
      .get();
    
    const matches = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(matches);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch matches", message: error.message });
  }
});

/**
 * GET /api/world-cup/standings
 * Returns tournament standings
 */
router.get("/standings", async (req, res) => {
  try {
    const snapshot = await firestore.collection('world_cup_standings')
      .orderBy('group', 'asc')
      .get();
    
    const standings = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(standings);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch standings", message: error.message });
  }
});

/**
 * POST /sync/worldcup (when mounted at /api)
 * or /world-cup/sync (when mounted at /api)
 */
router.post("/sync/worldcup", authMiddleware('admin'), async (req, res) => {
  try {
    // For now, we log the trigger and update a status document
    // Real logic would call provider APIs (API-Football, etc.)
    await firestore.collection('system_logs').add({
      type: 'SYNC_TRIGGER',
      source: 'WC_API',
      triggeredBy: (req as any).user?.email,
      timestamp: FieldValue.serverTimestamp()
    });

    await firestore.collection('world_cup_sync').doc('status').set({
      lastUpdate: FieldValue.serverTimestamp(),
      status: 'pending',
      triggeredBy: (req as any).user?.email
    }, { merge: true });

    res.json({ 
      success: true, 
      message: "World Cup sync process initiated. Data will refresh in background."
    });
  } catch (error: any) {
    res.status(500).json({ error: "Sync initiation failed", message: error.message });
  }
});

export default router;
