import express from "express";
import { unifiedApiManager } from "../services/unifiedApiManager";

const router = express.Router();

router.all("/football-api/*", async (req, res) => {
    let apiPath = (req.params as any)[0] || "";
    
    const clientCategory = (req.headers['x-api-category'] || req.headers['X-API-Category'] || '').toString();
    let category = clientCategory || 'matches';
    
    // Auto detect category
    if (!clientCategory) {
        if (apiPath.includes('fixtures')) category = 'matches';
        if (apiPath.includes('standings')) category = 'leagues';
        if (apiPath.includes('players')) category = 'players';
        if (apiPath.includes('teams')) category = 'teams';
    }

    try {
        const data = await unifiedApiManager.fetchWithSmartCache(
            `/${apiPath}`, 
            { 
              category, 
              ttlSeconds: apiPath.includes('live') || req.query.live ? 15 : 120 
            },
            {
              method: req.method,
              params: req.query
            }
        );
        res.json(data);
    } catch (error: any) {
        console.error(`[Unified Proxy] Error fetching /${apiPath}:`, error.message);
        res.status(error.response?.status || 500).json(
            error.response?.data || { error: "External API Proxy Error", message: error.message }
        );
    }
});

// For backward compatibility
router.all("/football-data/*", async (req, res) => {
    let apiPath = (req.params as any)[0] || "";
    try {
        const data = await unifiedApiManager.fetchWithSmartCache(
            `https://api.football-data.org/v4/${apiPath}`, 
            { 
              category: 'matches', 
              ttlSeconds: 60,
              providerOverride: 'Custom' // Or something else, actually we should just make it pass through, but unifiedApiManager will use the best key if we don't specify provider. Let's just use API-Football.
            },
            {
              method: req.method,
              params: req.query
            }
        );
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
