import express from "express";
import { firestore } from "../firestore/collections";
import {
  performSemanticSearch,
  getOrGeneratePlayerKnowledge,
  getOrGenerateTeamKnowledgeGraph,
  getOrGenerateMatchKnowledge
} from "../services/knowledgeGraphService";

const router = express.Router();

// Semantic search endpoint
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const results = await performSemanticSearch(q);
    res.json(results);
  } catch (err: any) {
    console.error("[Semantic Search Route Error]:", err);
    res.status(500).json({ error: err.message || "Failed to perform semantic search" });
  }
});

// Player enrich and timeline endpoint
router.get("/player/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.query;

  try {
    const knowledge = await getOrGeneratePlayerKnowledge(id, name ? String(name) : undefined);
    res.json(knowledge);
  } catch (err: any) {
    console.error("[Player Knowledge Route Error]:", err);
    res.status(500).json({ error: err.message || "Failed to load player knowledge graph" });
  }
});

// Team enrich and dashboard endpoint
router.get("/team/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.query;

  try {
    const knowledge = await getOrGenerateTeamKnowledgeGraph(id, name ? String(name) : undefined);
    res.json(knowledge);
  } catch (err: any) {
    console.error("[Team Knowledge Route Error]:", err);
    res.status(500).json({ error: err.message || "Failed to load team knowledge graph" });
  }
});

// Match enrich and analysis endpoint
router.get("/match/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Attempt to load current match info from Firestore
    let matchData: any = {};
    if (firestore) {
      const doc = await firestore.collection("matches").doc(id).get();
      if (doc.exists) {
        matchData = doc.data();
      }
    }

    const knowledge = await getOrGenerateMatchKnowledge(id, matchData);
    res.json(knowledge);
  } catch (err: any) {
    console.error("[Match Knowledge Route Error]:", err);
    res.status(500).json({ error: err.message || "Failed to load match knowledge graph" });
  }
});

export default router;
