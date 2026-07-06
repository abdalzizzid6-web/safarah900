import axios from "axios";
import express from "express";

const router = express.Router();
const FOOTBALL_DATA_KEY = process.env.VITE_FOOTBALL_DATA_KEY || process.env.FOOTBALL_DATA_KEY;

router.get("/football-data/*", async (req, res) => {
    const apiPath = req.params[0];
    try {
        const response = await axios.get(`https://api.football-data.org/v4/${apiPath}`, {
            headers: FOOTBALL_DATA_KEY ? { 'X-Auth-Token': FOOTBALL_DATA_KEY } : {},
            params: req.query
        });
        res.json(response.data);
    } catch (error: any) {
        console.error(`[Football Proxy] Error fetching ${apiPath}:`, error.message);
        res.status(error.response?.status || 500).json(
            error.response?.data || { error: "External API Proxy Error" }
        );
    }
});

export default router;
