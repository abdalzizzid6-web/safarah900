
import express from "express";
import compression from "compression";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

import { getIdFromSlug } from "../src/utils/slugify";
import { monitoringMiddleware, metrics } from "./middleware/monitoring";
import matchRoutes from "./routes/matches";
import seoRoutes from "./routes/seo";
import adminRoutes from "./routes/admin";
import proxyRoutes from "./routes/proxies";
import worldCupRoutes from "./routes/worldcup";
import translationRoutes from "./routes/translation";
import rssRoutes from "./routes/rss";
import knowledgeRoutes from "./routes/knowledge";
import mediaRoutes from "./routes/media";
import newsRoutes from "./routes/news";
import { socialRouter } from "./routes/social";

import { startNotificationJob } from "./jobs/syncNotifications";
import { startRssJobs } from "./jobs/rssPolling";
import { generateAndWriteCacheFiles } from "./firestore/cache";
import { handleSitemap } from "./routes/sitemapDynamic";

// ... (other imports)

import { enhanceSeo } from "./utils/seoEnhancer";
import { generateBaseSchema, generateNewsSchema } from "./utils/schemaGenerator";
import { authMiddleware } from "./middleware/auth";
import { firestore, isFirestoreQuotaExceeded, messaging } from "./firestore/collections";
import { generateContentWithRetry } from "./services/aiService";
import { Type } from "@google/genai";
import { apiManager } from "./services/apiManager";

import passport from "passport";

const app = express();
app.use(express.json());
app.use(passport.initialize());
const PORT = 3000;

// Domain Unification & HTTPS Redirection (SEO-01)
app.get('/sitemap.xml', (req, res) => { (req.params as any).type = 'main'; handleSitemap(req, res); });
app.get('/sitemap-matches.xml', (req, res) => { (req.params as any).type = 'matches'; handleSitemap(req, res); });
app.get('/sitemap-news.xml', (req, res) => { (req.params as any).type = 'news'; handleSitemap(req, res); });

app.use((req, res, next) => {
  const host = req.get('host') || '';
  const xForwardedProto = req.get('x-forwarded-proto');
  const protocol = xForwardedProto || req.protocol;
  const isHttps = protocol === 'https';
  const isWww = host.startsWith('www.');

  if (process.env.NODE_ENV === 'production') {
    // Force https://www.korea90.xyz but skip if on preview domain (run.app)
    const isPreview = host.endsWith('.run.app') || host.includes('localhost') || host.includes('127.0.0.1');
    if (!isPreview && (!isWww || !isHttps || host !== 'www.korea90.xyz')) {
      return res.redirect(301, `https://www.korea90.xyz${req.originalUrl}`);
    }
  }
  next();
});

// Cache for index.html template and sitemaps
let cachedIndexHtml: string | null = null;
const matchSsoCache: Record<string, { data: any, expiry: number }> = {};
const newsSsoCache: Record<string, { data: any, expiry: number }> = {};

const getIndexHtml = (distPath: string) => {
  if (cachedIndexHtml && process.env.NODE_ENV === 'production') return cachedIndexHtml;
  try {
    cachedIndexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
    return cachedIndexHtml;
  } catch (e) {
    return '<html><head><title>Safara 90</title></head><body><div id="root"></div></body></html>';
  }
};

// Removed brittle injectSeo function

// CRITICAL: SEO Routes must take precedence before static files or other catch-alls
app.use("/", seoRoutes);

app.get("/robots.txt", (req, res) => {
  const host = "https://korea90.xyz";
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /vip
Disallow: /premium-services
Disallow: /*?*

Sitemap: ${host}/sitemap.xml`);
});

// Middleware for API stability
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    delete req.headers['if-match'];
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];
    delete req.headers['if-unmodified-since'];
    delete req.headers['if-range'];
  }
  next();
});

// Missing API routes - Protected
app.post("/api/indexing/notify", authMiddleware('admin'), (req, res) => res.json({ success: true }));

// System Metrics endpoint
app.get("/api/metrics", (req, res) => {
  res.json({
    totalRequests: metrics.totalRequests,
    apiRequests: metrics.apiRequests,
    errors: metrics.errors,
    startTime: metrics.startTime,
    requestsActive: 0,
    isFirestoreQuotaExceeded,
    status: "ok"
  });
});

// AI Predict Match endpoint with Firestore persistent caching
app.post("/api/predict/match", async (req, res) => {
  const { homeTeam, awayTeam, league, status, homeScore, awayScore } = req.body;

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "Missing homeTeam or awayTeam" });
  }

  const cleanHome = String(homeTeam).trim();
  const cleanAway = String(awayTeam).trim();
  const cleanLeague = String(league || "الدوري").trim();

  // Create a unique document ID for this match prediction
  const docId = Buffer.from(`${cleanHome}_vs_${cleanAway}_${cleanLeague}`).toString("base64").substring(0, 50);
  const docRef = firestore.collection("ai_match_predictions").doc(docId);
  let existingContent: any = null;

  try {
    const now = Date.now();
    if (predictionExistenceCache[docId] && predictionExistenceCache[docId].expiry > now) {
      existingContent = predictionExistenceCache[docId].data;
    } else {
      const cachedDoc = await docRef.get();
      if (cachedDoc.exists) {
        existingContent = cachedDoc.data();
        predictionExistenceCache[docId] = { data: existingContent, expiry: now + 5 * 60 * 1000 };
      }
    }

    if (existingContent) {
      if (existingContent.status === 'generating') {
        const createdAtMs = new Date(existingContent.createdAt).getTime();
        if (Date.now() - createdAtMs < 60000) {
          return res.json({ status: "generating", message: "جاري توليد التوقعات الرياضية التكتيكية حالياً..." });
        }
        console.warn(`[Lock Timeout] Prediction lock timed out for docId ${docId}. Regenerating.`);
      } else if (existingContent.expiresAt) {
        const expiresAt = new Date(existingContent.expiresAt).getTime();
        if (expiresAt > Date.now() || status === "FINISHED" || status === "FT") {
          return res.json(existingContent);
        }
      }
    }

    // Acquire lock
    await docRef.set({
      status: "generating",
      createdAt: new Date().toISOString(),
      homeTeam: cleanHome,
      awayTeam: cleanAway,
      type: "prediction"
    });

    // Generate prediction using Gemini or fallback
    let predictionData: any = null;
    let dataSource = "gemini-3.5-flash";

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
        Analyze the upcoming or live football match and generate realistic win/draw/loss probabilities and sports commentary in Arabic.
        Match Context:
        - League: ${cleanLeague}
        - Home Team: ${cleanHome}
        - Away Team: ${cleanAway}
        - Current Match Status: ${status || "Upcoming"}
        - Current Score: ${homeScore ?? 0} - ${awayScore ?? 0}

        You MUST follow these rules:
        1. Produce realistic win probabilities (home, draw, away) that sum up to exactly 100.
        2. Provide expert sports analyst commentary in professional Arabic (analystCommentary) detailing expected tactics, match importance, and key highlights.
        3. Provide a clear predicted outcome or tactical forecast (prediction) in Arabic.
        4. Response MUST strictly follow the JSON schema. No hallucinated stats or fake details outside the context.
        `;

        const result = await generateContentWithRetry({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are a world-class football tactician, data scientist, and elite Arabic sports analyst. You output professional match predictions in JSON format.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                homeWinProbability: { type: Type.INTEGER, description: "Home team win probability percentage" },
                drawProbability: { type: Type.INTEGER, description: "Draw probability percentage" },
                awayWinProbability: { type: Type.INTEGER, description: "Away team win probability percentage" },
                analystCommentary: { type: Type.STRING, description: "Professional, detailed Arabic tactical analysis" },
                prediction: { type: Type.STRING, description: "Specific predicted scenario or score prediction in Arabic" }
              },
              required: ["homeWinProbability", "drawProbability", "awayWinProbability", "analystCommentary", "prediction"]
            }
          }
        });

        if (result.text) {
          const parsed = JSON.parse(result.text);
          // Ensure they sum up to 100
          const total = (parsed.homeWinProbability || 0) + (parsed.drawProbability || 0) + (parsed.awayWinProbability || 0);
          if (total !== 100 && total > 0) {
            parsed.homeWinProbability = Math.round((parsed.homeWinProbability / total) * 100);
            parsed.drawProbability = Math.round((parsed.drawProbability / total) * 100);
            parsed.awayWinProbability = 100 - parsed.homeWinProbability - parsed.drawProbability;
          }
          predictionData = parsed;
        }
      } catch (err: any) {
        console.warn("[AI Prediction API Failed] Falling back to deterministic model:", err?.message || err);
      }
    }

    if (!predictionData) {
      if (existingContent && existingContent.status === 'published') {
        await docRef.set(existingContent);
        return res.json(existingContent);
      } else {
        await docRef.delete();
      }
      return res.status(503).json({ error: "AI Prediction Unavailable", message: "فشل توليد التوقعات التكتيكية حالياً، يرجى المحاولة لاحقاً" });
    }

    const nowDate = new Date();
    const expiresAt = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours cache TTL
    const finalPayload = {
      ...predictionData,
      status: "published",
      generatedAt: nowDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
      dataSource
    };

    await docRef.set(finalPayload);
    res.json(finalPayload);
  } catch (error: any) {
    console.error("[Prediction API Error]:", error);
    if (existingContent && existingContent.status === 'published') {
      await docRef.set(existingContent);
      return res.json(existingContent);
    } else {
      try {
        await firestore.collection("ai_match_predictions").doc(docId).delete();
      } catch (e) {}
    }
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// Mounted Routes
app.use("/api/admin", adminRoutes);
app.use("/api/social", socialRouter);
app.post("/api/test-api-key", authMiddleware('editor'), async (req, res) => {
    const { provider, key } = req.body;
    try {
        let url = '';
        const headers: Record<string, string> = { 'Accept': 'application/json' };

        if (provider === 'API-Football') {
            url = 'https://v3.football.api-sports.io/status';
            headers['x-apisports-key'] = key;
        } else if (provider === 'SportMonks') {
            url = `https://api.sportmonks.com/v3/core/countries?api_token=${key}`;
        } else if (provider === 'TheSportsDB') {
            url = `https://www.thesportsdb.com/api/v1/json/${key || '123'}/all_leagues.php`;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid provider' });
        }

        const start = Date.now();
        const response = await fetch(url, { headers });
        const latency = Date.now() - start;
        const data = await response.json();

        if (response.ok) {
            if (provider === 'API-Football' && (!data.errors || Object.keys(data.errors).length === 0)) {
                return res.json({ success: true, message: `API-Football Connection Successful!`, latency, status: response.status });
            } else if (provider === 'SportMonks' && data.data) {
                return res.json({ success: true, message: `SportMonks connection successful!`, latency, status: response.status });
            } else if (provider === 'TheSportsDB' && data.leagues) {
                return res.json({ success: true, message: `TheSportsDB connection successful!`, latency, status: response.status });
            }
        }
        
        return res.status(response.status).json({ success: false, message: 'API connection failed', latency, status: response.status });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});
app.use("/api/matches", matchRoutes);
app.use("/api/proxies", proxyRoutes);
app.use("/api/world-cup", worldCupRoutes);
app.use("/api/translation", translationRoutes);
app.use("/api/rss", rssRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/news", newsRoutes);
app.use("/api", worldCupRoutes); // Exposes /api/sync/worldcup

// FCM Topic Subscription Endpoints
app.post("/api/notifications/subscribe", async (req, res) => {
  const { token, topic } = req.body;
  if (!token || !topic) return res.status(400).json({ error: "Missing token or topic" });
  if (!messaging) return res.status(503).json({ error: "Messaging not initialized" });

  try {
    await messaging.subscribeToTopic(token, topic);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/notifications/unsubscribe", async (req, res) => {
  const { token, topic } = req.body;
  if (!token || !topic) return res.status(400).json({ error: "Missing token or topic" });
  if (!messaging) return res.status(503).json({ error: "Messaging not initialized" });

  try {
    await messaging.unsubscribeFromTopic(token, topic);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory caching layer to prevent 429 rate limit errors for football-data.org
const proxyCache: Record<string, { data: any; expiry: number }> = {};
const predictionExistenceCache: Record<string, { data: any; expiry: number }> = {};

// Proxy router for football-data.org to avoid CORS & network issues in browser
app.get("/api/football-data/*", async (req, res) => {
  const subPath = (req.params as any)[0] || "";
  const queryString = new URLSearchParams(req.query as any).toString();
  
  let targetBase = (process.env.VITE_FOOTBALL_DATA_BASE || "https://api.football-data.org/v4").trim();
  if (targetBase.endsWith("/")) {
    targetBase = targetBase.slice(0, -1);
  }
  
  let cleanSubPath = subPath;
  if (cleanSubPath.startsWith("/")) {
    cleanSubPath = cleanSubPath.slice(1);
  }
  
  const targetUrl = `${targetBase}/${cleanSubPath}${queryString ? `?${queryString}` : ""}`;
  let apiKey = (process.env.VITE_FOOTBALL_DATA_KEY || "b52fe40577134e59a5796404b7ebc73c").trim();

  if (cleanSubPath.includes("competitions/WC") || cleanSubPath.includes("WC/")) {
    apiKey = "b52fe40577134e59a5796404b7ebc73c";
  }

  const cacheKey = targetUrl;
  const now = Date.now();
  if (proxyCache[cacheKey] && proxyCache[cacheKey].expiry > now) {
    return res.json(proxyCache[cacheKey].data);
  }

  const findStaleFallback = () => {
    if (proxyCache[cacheKey]) return proxyCache[cacheKey].data;
    const endpointType = subPath.split("/")[0] || "";
    if (endpointType) {
      const helperKey = Object.keys(proxyCache).find(k => k.includes(`/${endpointType}`));
      if (helperKey) return proxyCache[helperKey].data;
    }
    return null;
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: { "X-Auth-Token": apiKey, "Accept": "application/json" },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const responseText = await response.text();
    let data;
    try { data = JSON.parse(responseText); } catch (e) { data = { rawText: responseText }; }
    
    if (!response.ok) {
      if (response.status === 429) {
        const staleData = findStaleFallback();
        if (staleData) return res.json(staleData);
      }
      return res.status(response.status).json({ error: "Upstream API error", details: data });
    }

    proxyCache[cacheKey] = { data, expiry: now + 180000 };
    res.json(data);
  } catch (error: any) {
    clearTimeout(timeoutId);
    const staleData = findStaleFallback();
    if (staleData) return res.json(staleData);
    return res.status(502).json({ error: "Failed to fetch from upstream API", message: error.message });
  }
});

function normalizeRequestForProvider(subPath: string, query: Record<string, any>, isFreeApi: boolean): { subPath: string; query: Record<string, any> } {
  let cleanPath = '/' + subPath.replace(/^\//, '').replace(/^v3\//, '');
  let outQuery = { ...query };

  if (isFreeApi) {
    // Translate standard paths to free API paths
    if (cleanPath === '/fixtures') {
      const isLive = outQuery.live === 'all';
      const id = outQuery.id;
      if (id) {
        cleanPath = '/football-get-match-all-details';
        outQuery.matchid = id;
        delete outQuery.id;
      } else if (isLive) {
        cleanPath = '/football-get-all-popular-matches';
        delete outQuery.live;
      } else if (outQuery.date) {
        cleanPath = '/football-get-all-matches-by-date';
      } else {
        cleanPath = '/football-get-all-popular-matches';
      }
    } else if (cleanPath === '/fixtures/events' || cleanPath === '/fixtures/statistics' || cleanPath === '/fixtures/lineups') {
      const id = outQuery.fixture;
      cleanPath = '/football-get-match-all-details';
      outQuery.matchid = id;
      delete outQuery.fixture;
    } else if (cleanPath === '/standings') {
      const leagueId = outQuery.league;
      const season = outQuery.season;
      cleanPath = '/football-get-all-standings-by-league';
      outQuery.leagueid = leagueId;
      outQuery.season = season || '2026';
      delete outQuery.league;
    } else if (cleanPath === '/players/topscorers' || cleanPath === '/players/topscrorers') {
      cleanPath = '/football-get-all-top-scorers';
      outQuery.leagueid = outQuery.league;
      delete outQuery.league;
    } else if (cleanPath === '/players/topassists') {
      cleanPath = '/football-get-all-top-assists';
      outQuery.leagueid = outQuery.league;
      delete outQuery.league;
    } else if (cleanPath === '/teams') {
      const teamId = outQuery.id;
      cleanPath = '/football-get-team-all-details';
      outQuery.teamid = teamId;
      delete outQuery.id;
    } else if (cleanPath === '/players/squads') {
      const teamId = outQuery.team;
      cleanPath = '/football-get-team-squad';
      outQuery.teamid = teamId;
      delete outQuery.team;
    } else if (cleanPath === '/players') {
      const playerId = outQuery.id;
      cleanPath = '/football-get-player-all-details';
      outQuery.playerid = playerId;
      delete outQuery.id;
    }
  } else {
    // Translate free API paths back to standard API-Football paths
    if (cleanPath === '/football-get-match-all-details') {
      const matchid = outQuery.matchid || outQuery.matchId;
      cleanPath = '/fixtures';
      outQuery.id = matchid;
      delete outQuery.matchid;
      delete outQuery.matchId;
    } else if (cleanPath === '/football-get-all-popular-matches') {
      cleanPath = '/fixtures';
      outQuery.live = 'all';
    } else if (cleanPath === '/football-get-all-matches-by-date') {
      cleanPath = '/fixtures';
    } else if (cleanPath === '/football-get-all-standings-by-league') {
      const leagueid = outQuery.leagueid || outQuery.leagueId;
      cleanPath = '/standings';
      outQuery.league = leagueid;
      delete outQuery.leagueid;
      delete outQuery.leagueId;
    } else if (cleanPath === '/football-get-all-top-scorers') {
      const leagueid = outQuery.leagueid || outQuery.leagueId;
      cleanPath = '/players/topscorers';
      outQuery.league = leagueid;
      delete outQuery.leagueid;
      delete outQuery.leagueId;
    } else if (cleanPath === '/football-get-all-top-assists') {
      const leagueid = outQuery.leagueid || outQuery.leagueId;
      cleanPath = '/players/topassists';
      outQuery.league = leagueid;
      delete outQuery.leagueid;
      delete outQuery.leagueId;
    } else if (cleanPath === '/football-get-team-all-details') {
      const teamid = outQuery.teamid || outQuery.teamId;
      cleanPath = '/teams';
      outQuery.id = teamid;
      delete outQuery.teamid;
      delete outQuery.teamId;
    } else if (cleanPath === '/football-get-team-squad') {
      const teamid = outQuery.teamid || outQuery.teamId;
      cleanPath = '/players/squads';
      outQuery.team = teamid;
      delete outQuery.teamid;
      delete outQuery.teamId;
    } else if (cleanPath === '/football-get-player-all-details') {
      const playerid = outQuery.playerid || outQuery.playerId;
      cleanPath = '/players';
      outQuery.id = playerid;
      delete outQuery.playerid;
      delete outQuery.playerId;
    }
  }

  return {
    subPath: cleanPath.replace(/^\//, ''),
    query: outQuery
  };
}

function translateToApiFootball(provider: string, endpoint: string, data: any) {
  let payload: any[] = [];
  if (provider === 'TheSportsDB') {
    payload = data.events || data.results || data.teams || data.players || data.table || data.countrys || data.leagues || [];
    if (!Array.isArray(payload)) payload = [payload];
  } else if (provider === 'SportMonks') {
    payload = data.data || [];
    if (!Array.isArray(payload)) payload = [payload];
  } else {
    payload = data.response || data;
    if (!Array.isArray(payload)) payload = [payload];
  }

  const response = payload.map((item: any) => {
    if (provider === 'TheSportsDB') {
      if (item.idEvent) {
        let dtStr = item.strTimestamp;
        if (!dtStr && item.dateEvent) {
            dtStr = item.dateEvent + 'T' + (item.strTime || '00:00:00');
            if (!dtStr.includes('Z') && !dtStr.includes('+')) dtStr += 'Z';
        }
        return {
          fixture: {
            id: item.idEvent,
            date: dtStr || new Date().toISOString(),
            status: {
              short: item.strStatus === 'Match Finished' ? 'FT' : (item.strStatus === 'Not Started' ? 'NS' : 'TBD'),
              long: item.strStatus || 'TBD'
            }
          },
          league: {
            id: item.idLeague,
            name: item.strLeague,
            logo: item.strLeagueBadge || item.strBadge || null
          },
          teams: {
            home: {
              id: item.idHomeTeam,
              name: item.strHomeTeam,
              logo: item.strHomeTeamBadge || null
            },
            away: {
              id: item.idAwayTeam,
              name: item.strAwayTeam,
              logo: item.strAwayTeamBadge || null
            }
          },
          goals: {
            home: item.intHomeScore !== null ? parseInt(item.intHomeScore) : null,
            away: item.intAwayScore !== null ? parseInt(item.intAwayScore) : null
          }
        };
      }
    }
    return item;
  });

  return {
    get: endpoint,
    parameters: [],
    errors: [],
    results: response.length,
    paging: { current: 1, total: 1 },
    response: response
  };
}

app.use("/", (req, res, next) => {
  // Catch all remaining API routes or fall through
  next();
});

// Static Assets
app.use('/data', express.static(path.join(process.cwd(), 'public', 'data')));

export async function bootstrap() {
  
  // Background Tasks
  startNotificationJob();
  startRssJobs();

  // Async Initialization
  const cacheFile = path.join(process.cwd(), 'public', 'data', 'matches.json');
  let shouldGenerate = true;
  if (fs.existsSync(cacheFile)) {
    const stats = fs.statSync(cacheFile);
    const ageMs = Date.now() - stats.mtimeMs;
    // If the cache is less than 6 hours old, verify it also contains today's date
    if (ageMs < 6 * 60 * 60 * 1000) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const content = fs.readFileSync(cacheFile, 'utf8');
        if (content.includes(todayStr)) {
          shouldGenerate = false;
        }
      } catch (e) {
        console.warn("Failed to check matches.json for today's matches:", e);
      }
    }
  }

  if (shouldGenerate) {
    import("./services/syncService").then(({ syncMatchesFromAPI }) => syncMatchesFromAPI().catch(e => console.error("Initial Sync Error:", e)));
  }

  // Vite / Static Fallback
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1y' }));

    // Validating match pages for real 404s and dynamic meta injection (SEO-02)
    app.get('/match/:slug', async (req, res) => {
      const { slug } = req.params;
      const matchId = getIdFromSlug(slug);
      
      if (!matchId) {
        return res.sendFile(path.join(distPath, 'index.html'));
      }

      try {
        const nowMs = Date.now();
        let matchDoc: any = null;
        
        if (matchSsoCache[matchId] && matchSsoCache[matchId].expiry > nowMs) {
          matchDoc = matchSsoCache[matchId].data;
        } else {
          const doc = await firestore.collection('matches').doc(matchId).get();
          if (doc.exists) {
            matchDoc = { id: doc.id, ...doc.data(), exists: true };
            matchSsoCache[matchId] = { data: matchDoc, expiry: nowMs + 30 * 60 * 1000 };
          } else {
            matchDoc = { exists: false };
            matchSsoCache[matchId] = { data: matchDoc, expiry: nowMs + 10 * 60 * 1000 };
          }
        }

        const exists = matchDoc.exists;
        const isWcPattern = matchId.includes('2026-m-') || matchId.includes('2022-m-') || matchId.startsWith('wc-');

        if (!exists && !isWcPattern) {
          return res.status(404).sendFile(path.join(distPath, 'index.html'));
        }

        let html = getIndexHtml(distPath);
        
        if (exists) {
          const data = matchDoc || {};
          const homeTeam = data.homeTeamName || (typeof data.homeTeam === 'object' ? data.homeTeam.name : data.homeTeam) || 'فريق 1';
          const awayTeam = data.awayTeamName || (typeof data.awayTeam === 'object' ? data.awayTeam.name : data.awayTeam) || 'فريق 2';
          const league = data.leagueName || (typeof data.league === 'object' ? data.league.name : data.league) || 'بطولة';
          
          const title = `مباراة ${homeTeam} ضد ${awayTeam} - ${league}`;
          const description = `تابع تفاصيل مباراة ${homeTeam} و ${awayTeam} في ${league}. البث المباشر، التشكيلات، والنتائج لحظة بلحظة على صافرة 90.`;
          
          const structuredData = {
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": title,
            "description": description,
            "startDate": data.startTime?.toDate?.()?.toISOString() || data.startTime,
            "homeTeam": { "@type": "SportsTeam", "name": homeTeam },
            "awayTeam": { "@type": "SportsTeam", "name": awayTeam },
            "location": { "@type": "Place", "name": data.venue || "ملعب المباراة" }
          };

          html = enhanceSeo(html, {
            title,
            description,
            url: `https://korea90.xyz/match/${slug}`,
            type: 'article',
            structuredData
          });
        }

        res.send(html);
      } catch (e) {
        console.error(`[SEO Error] Failed to process match meta:`, e);
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });

    app.get('/news/:slug', async (req, res) => {
      const { slug } = req.params;
      const newsId = getIdFromSlug(slug);

      if (!newsId) {
        return res.sendFile(path.join(distPath, 'index.html'));
      }

      try {
        const nowMs = Date.now();
        let newsDoc: any = null;

        if (newsSsoCache[newsId] && newsSsoCache[newsId].expiry > nowMs) {
          newsDoc = newsSsoCache[newsId].data;
        } else {
          const doc = await firestore.collection('news').doc(newsId).get();
          if (doc.exists) {
            newsDoc = { id: doc.id, ...doc.data(), exists: true };
            newsSsoCache[newsId] = { data: newsDoc, expiry: nowMs + 30 * 60 * 1000 };
          } else {
            newsDoc = { exists: false };
            newsSsoCache[newsId] = { data: newsDoc, expiry: nowMs + 10 * 60 * 1000 };
          }
        }

        if (!newsDoc.exists) {
          return res.status(404).sendFile(path.join(distPath, 'index.html'));
        }

        let html = getIndexHtml(distPath);
        const data = newsDoc;
        const title = data.seo?.metaTitle || data.title;
        const description = data.seo?.metaDescription || data.excerpt || data.content?.substring(0, 160);
        const image = data.featuredImage?.url || data.image || 'https://korea90.xyz/logo-master.png';

        const newsUrl = `https://www.korea90.xyz/news/${slug}`;
        const structuredData = [
          ...generateBaseSchema(newsUrl),
          generateNewsSchema(data, newsUrl)
        ];

        html = enhanceSeo(html, {
          title,
          description,
          url: newsUrl,
          image,
          type: 'article',
          structuredData
        });

        res.send(html);
      } catch (e) {
        console.error(`[SEO Error] Failed to process news meta:`, e);
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });

    app.get('*', (req, res) => {
      const html = getIndexHtml(distPath);
      // Default home page SEO if it's the root
      if (req.path === '/') {
        const homeSeo = enhanceSeo(html, {
          title: "الرئيسية - أهم أخبار ونتائج مباريات كرة القدم",
          description: "صافرة 90 هي منصتك الأولى لمتابعة نتائج مباريات كرة القدم، البث المباشر، وأحدث الأخبار الرياضية العالمية والعربية لحظة بلحظة.",
          url: "https://korea90.xyz/",
          structuredData: {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "صافرة 90",
            "url": "https://korea90.xyz/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://korea90.xyz/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        });
        return res.send(homeSeo);
      }
      res.send(html);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrap();
}
