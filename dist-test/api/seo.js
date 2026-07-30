// api/seo.ts
import path from "path";
import fs from "fs";

// server/utils/seoHelpers.ts
var escapeXml = (unsafe) => {
  if (typeof unsafe !== "string") return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
    }
    return c;
  });
};
var generateSitemapXml = (urls) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ""}${u.changefreq ? `
    <changefreq>${u.changefreq}</changefreq>` : ""}${u.priority ? `
    <priority>${u.priority}</priority>` : ""}
  </url>`).join("\n")}
</urlset>`;
};
var generateNewsSitemapXml = (urls) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.map((u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(u.name)}</news:name>
        <news:language>${u.language}</news:language>
      </news:publication>
      <news:publication_date>${u.publicationDate}</news:publication_date>
      <news:title>${escapeXml(u.title)}</news:title>
    </news:news>
  </url>`).join("\n")}
</urlset>`;
};
var generateImageSitemapXml = (urls) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
${u.images.map((img) => `    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>${img.title ? `
      <image:title>${escapeXml(img.title)}</image:title>` : ""}${img.caption ? `
      <image:caption>${escapeXml(img.caption)}</image:caption>` : ""}
    </image:image>`).join("\n")}
  </url>`).join("\n")}
</urlset>`;
};
var generateSitemapIndexXml = (sitemaps) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((s) => `  <sitemap>
    <loc>${escapeXml(s)}</loc>
  </sitemap>`).join("\n")}
</sitemapindex>`;
};

// server/utils/slugify.ts
function createSlugPath(title, id) {
  if (!title) return id;
  const cleanTitle = title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\u0621-\u064A-]+/g, "");
  return `${cleanTitle}-${id}`;
}
function safeExtractString(val) {
  if (typeof val === "string") return val;
  if (!val) return "";
  if (typeof val === "object") {
    return val.name || val.arabicName || val.displayName || val.title || "";
  }
  return String(val);
}

// server/utils/normalizer.ts
var normalizeMatch = (data) => {
  const getTeamField = (field, key) => {
    if (!field) return "";
    if (typeof field === "string") return key === "name" ? field : "";
    if (typeof field === "object") {
      if (key === "id") return (field.id || field.teamId || "").toString();
      if (key === "name") return field.name || field.shortName || field.displayName || field.teamName || "";
      if (key === "tla") return field.tla || field.code || "";
      if (key === "logo") return field.logo || field.crest || field.emblem || field.image || field.url || "";
    }
    return "";
  };
  const rawHome = getTeamField(data.homeTeam || data.teams?.home, "name") || data.homeTeamName || data.homeName || "";
  const rawAway = getTeamField(data.awayTeam || data.teams?.away, "name") || data.awayTeamName || data.awayName || "";
  const rawLeague = getTeamField(data.league || data.competition, "name") || data.leagueName || "";
  const resolveName = (raw) => {
    const isPlaceholder = (name) => {
      if (!name) return true;
      const lower = name.toLowerCase();
      return lower.includes("unknown") || lower.includes("tbd") || lower.includes("to be determined") || lower.includes("winner match") || lower.includes("winner of") || lower.includes("runner-up") || lower.includes("group") || lower.includes("loser") || lower === "team" || lower === "null" || lower === "undefined" || name === "\u0642\u064A\u062F \u0627\u0644\u062A\u062D\u062F\u064A\u062F";
    };
    if (raw && !isPlaceholder(raw)) return raw;
    return "\u0642\u064A\u062F \u0627\u0644\u062A\u062D\u062F\u064A\u062F";
  };
  const homeName = resolveName(rawHome);
  const awayName = resolveName(rawAway);
  const isTournamentPlaceholder = (name, raw) => {
    const lower = String(raw || "").toLowerCase();
    return lower.includes("winner") || lower.includes("loser") || lower.includes("runner-up") || lower.includes("group") || lower.includes("tbd") || name === "\u0642\u064A\u062F \u0627\u0644\u062A\u062D\u062F\u064A\u062F";
  };
  const isHomePlaceholder = isTournamentPlaceholder(homeName, rawHome);
  const isAwayPlaceholder = isTournamentPlaceholder(awayName, rawAway);
  const matchIsPlaceholder = isHomePlaceholder || isAwayPlaceholder;
  const leagueName = rawLeague || "\u0628\u0637\u0648\u0644\u0629 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629";
  const homeTeam = {
    id: getTeamField(data.homeTeam || data.teams?.home, "id"),
    name: homeName,
    logo: getTeamField(data.homeTeam || data.teams?.home, "logo"),
    tla: getTeamField(data.homeTeam || data.teams?.home, "tla"),
    isPlaceholder: isHomePlaceholder
  };
  const awayTeam = {
    id: getTeamField(data.awayTeam || data.teams?.away, "id"),
    name: awayName,
    logo: getTeamField(data.awayTeam || data.teams?.away, "logo"),
    tla: getTeamField(data.awayTeam || data.teams?.away, "tla"),
    isPlaceholder: isAwayPlaceholder
  };
  const league = {
    id: getTeamField(data.league || data.competition, "id"),
    name: leagueName,
    logo: getTeamField(data.league || data.competition, "logo")
  };
  const identityResolved = !!homeName && !!awayName || matchIsPlaceholder;
  const isInvalid = !data.id || !data.utcDate && !data.startTime;
  let hiddenReason = "";
  if (!data.id) hiddenReason = "Missing Fixture ID";
  else if (!data.utcDate && !data.startTime) hiddenReason = "Missing Temporal Data";
  if (isInvalid) {
    console.warn(`[ServerNormalizer] Match ${data.id} critically rejected: ${hiddenReason}`, { rawHome, rawAway, homeName, awayName });
  }
  const sanitizeSlugPart = (name) => (name || "team").toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "");
  const homeSlug = sanitizeSlugPart(homeName);
  const awaySlug = sanitizeSlugPart(awayName);
  const slug = data.slug || `${homeSlug}-vs-${awaySlug}-${data.id || "match"}`;
  const normalizeDate = (d) => {
    if (!d) return (/* @__PURE__ */ new Date()).toISOString();
    if (typeof d === "object") {
      if (d._seconds !== void 0) return new Date(d._seconds * 1e3).toISOString();
      if (typeof d.toDate === "function") return d.toDate().toISOString();
      if (d instanceof Date) return d.toISOString();
      try {
        return new Date(d).toISOString();
      } catch (e) {
      }
    }
    return String(d);
  };
  const dateValue = normalizeDate(data.utcDate || data.startTime);
  return {
    id: String(data.id || ""),
    homeTeam,
    awayTeam,
    homeName,
    awayName,
    homeScore: Number(data.homeScore ?? (data.score?.home ?? 0)),
    awayScore: Number(data.awayScore ?? (data.score?.away ?? 0)),
    status: data.status || "NS",
    league,
    leagueName,
    utcDate: dateValue,
    slug,
    isHidden: isInvalid,
    startTime: data.startTime || data.utcDate || null,
    isLive: data.isLive || data.status === "LIVE" || data.status === "IN_PLAY" || ["1H", "2H", "HT", "ET", "P"].includes(data.status),
    metadata: {
      ...data.metadata,
      hiddenReason,
      identityResolved
    }
  };
};
var normalizeTeam = (data) => ({
  id: String(data.id || ""),
  name: safeExtractString(data.name) || "",
  slug: data.slug || createSlugPath(safeExtractString(data.name || "team"), String(data.id || ""))
});
var normalizeLeague = (data) => ({
  id: String(data.id || ""),
  name: safeExtractString(data.name) || "",
  slug: data.slug || createSlugPath(safeExtractString(data.name || "league"), String(data.id || ""))
});
var normalizeNews = (data) => ({
  id: String(data.id || ""),
  title: safeExtractString(data.title) || "",
  slug: data.seo?.slug || data.slug || createSlugPath(safeExtractString(data.title || "news"), String(data.id || ""))
});

// src/utils/slugify.ts
function safeExtractString2(val) {
  if (!val) return "";
  if (typeof val === "string") {
    if (val.includes("[object Object]") || val.includes("object-object")) {
      return "team";
    }
    return val;
  }
  if (typeof val === "object") {
    return getSafeTeamName(val);
  }
  return String(val);
}
function getSafeTeamName(team) {
  if (!team) return "team";
  if (typeof team === "string") return team;
  return team.name || team.arabicName || team.shortName || team.englishName || "team";
}
function slugify(text) {
  const cleanText = safeExtractString2(text);
  if (!cleanText) return "";
  return cleanText.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\u0621-\u064A-]+/g, "").replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}
function getIdFromSlug(slug) {
  if (!slug) return "";
  if (/^\d+$/.test(slug)) return slug;
  if (slug.includes("-")) {
    const parts = slug.split("-");
    const lastPart = parts[parts.length - 1];
    if (parts.length >= 2) {
      const secondToLast = parts[parts.length - 2];
      if (["api", "manual", "live"].includes(secondToLast)) {
        return `${secondToLast}-${lastPart}`;
      }
    }
    for (let i = parts.length - 2; i >= 0; i--) {
      if (parts[i] === "wc") {
        return parts.slice(i).join("-");
      }
    }
    for (let i = parts.length - 3; i >= 0; i--) {
      if (/^\d{4}$/.test(parts[i]) && ["m", "fallback", "match"].includes(parts[i + 1])) {
        return parts.slice(i).join("-");
      }
    }
    if (/^\d+$/.test(lastPart) || lastPart.length >= 10 && /^[a-zA-Z0-9_]+$/.test(lastPart)) {
      return lastPart;
    }
    if (slug.startsWith("wc-")) return slug;
  }
  if (slug.length >= 15 && /^[a-zA-Z0-9_-]+$/.test(slug) && !slug.includes(" ") && !slug.includes("-")) {
    return slug;
  }
  return slug;
}
function createSlugPath2(titleOrTeams, id) {
  let title = titleOrTeams;
  if (typeof titleOrTeams === "object" && titleOrTeams !== null) {
    if (titleOrTeams.homeTeam && titleOrTeams.awayTeam) {
      title = `${getSafeTeamName(titleOrTeams.homeTeam)}-vs-${getSafeTeamName(titleOrTeams.awayTeam)}`;
    } else {
      title = getSafeTeamName(titleOrTeams);
    }
  }
  if (typeof title === "string" && (title.includes("[object") || title.includes("object-object"))) {
    return `match-${id}`;
  }
  const base = slugify(title);
  if (!base || base === "object" || base === "object-object") return id.toString();
  return `${base}-${id}`;
}

// src/lib/firebase-admin.ts
import { initializeApp as initializeAdminApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore as getAdminFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "gen-lang-client-0959045190",
  appId: "1:958469007898:web:7c9a852967b8c2b5b97fa3",
  apiKey: "AIzaSyB4asms_LyYqluR9v9EZrKohsvNF7Xqwbo",
  authDomain: "gen-lang-client-0959045190.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-safarah90-8063f3e8-1dda-4447-afcd-1abf0dc4041d",
  storageBucket: "gen-lang-client-0959045190.firebasestorage.app",
  messagingSenderId: "958469007898",
  measurementId: "G-B04BY0JFTZ"
};

// src/lib/firebase-admin.ts
import dotenv from "dotenv";
dotenv.config();
console.log(`[DIAGNOSTIC-LOG] [Module Loading] [firebase-admin.ts] Loading module. FIREBASE_SERVICE_ACCOUNT_KEY exists: ${!!process.env.FIREBASE_SERVICE_ACCOUNT_KEY}`);
var adminApp;
var firestore;
var messaging;
var auth;
var isFirebaseAdminReady = false;
var initFirebaseAdmin = () => {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] Initializing Firebase Admin...`);
    if (serviceAccountKey) {
      console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] serviceAccountKey found. Parsing and initializing with cert...`);
      const serviceAccount = JSON.parse(serviceAccountKey);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }
      adminApp = getApps().length === 0 ? initializeAdminApp({
        credential: cert(serviceAccount),
        projectId: firebase_applet_config_default.projectId
      }) : getApps()[0];
      const databaseId = firebase_applet_config_default.firestoreDatabaseId || "(default)";
      console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] App initialized. Fetching Firestore databaseId: ${databaseId}`);
      firestore = getAdminFirestore(adminApp, databaseId);
      firestore.settings({ ignoreUndefinedProperties: true });
      messaging = getMessaging(adminApp);
      auth = getAuth(adminApp);
      isFirebaseAdminReady = true;
      console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] [SUCCESS] Firebase Admin initialized with service account.`);
    } else {
      console.warn(`[DIAGNOSTIC-LOG] [firebase-admin.ts] [WARNING] FIREBASE_SERVICE_ACCOUNT_KEY is missing. Falling back to ambient credentials.`);
      adminApp = getApps().length === 0 ? initializeAdminApp({ projectId: firebase_applet_config_default.projectId }) : getApps()[0];
      const databaseId = firebase_applet_config_default.firestoreDatabaseId || "(default)";
      console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] Fetching Firestore databaseId: ${databaseId}`);
      firestore = getAdminFirestore(adminApp, databaseId);
      firestore.settings({ ignoreUndefinedProperties: true });
      messaging = getMessaging(adminApp);
      auth = getAuth(adminApp);
      isFirebaseAdminReady = true;
      console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] [SUCCESS] Firebase Admin initialized with ambient fallback.`);
    }
  } catch (e) {
    console.error(`[DIAGNOSTIC-LOG] [firebase-admin.ts] [CRITICAL-ERROR] Failed to initialize Firebase Admin during module loading. Details:`, {
      error: e.message,
      stack: e.stack,
      projectId: firebase_applet_config_default.projectId,
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    });
    isFirebaseAdminReady = false;
  }
};
initFirebaseAdmin();

// server/firestore/collections.ts
var isFirestoreQuotaExceeded = false;
console.log(`[DIAGNOSTIC-LOG] [Module Loading] [collections.ts] Module loading started. rawFirestore exists: ${!!firestore}, isFirebaseAdminReady: ${isFirebaseAdminReady}`);
var createDummyMock = () => {
  const dummyQuery = (...args) => dummyQuery;
  dummyQuery.where = () => dummyQuery;
  dummyQuery.orderBy = () => dummyQuery;
  dummyQuery.limit = () => dummyQuery;
  dummyQuery.select = () => dummyQuery;
  dummyQuery.startAfter = () => dummyQuery;
  dummyQuery.endAt = () => dummyQuery;
  dummyQuery.get = () => Promise.resolve({ docs: [], forEach: (cb) => {
  }, size: 0, empty: true });
  dummyQuery.set = () => Promise.resolve();
  dummyQuery.update = () => Promise.resolve();
  dummyQuery.delete = () => Promise.resolve();
  dummyQuery.doc = (docId) => ({
    get: () => Promise.resolve({ exists: false, id: docId || "mock-id", data: () => void 0 }),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    collection: () => dummyQuery
  });
  dummyQuery.collection = () => dummyQuery;
  return dummyQuery;
};
var firestore2 = new Proxy({}, {
  get(target, prop, receiver) {
    if (!firestore) {
      if (prop === "collection" || prop === "doc" || prop === "batch" || prop === "runTransaction") {
        console.warn(`[collections.ts Proxy] Property "${String(prop)}" accessed but rawFirestore is not ready. Returning safe mock.`);
        return createDummyMock();
      }
      return void 0;
    }
    const value = Reflect.get(firestore, prop, receiver);
    if (isFirestoreQuotaExceeded && (prop === "collection" || prop === "doc" || prop === "batch" || prop === "runTransaction")) {
      console.warn(`[DIAGNOSTIC-LOG] [collections.ts Proxy] Firestore blocked due to exceeded quota during property: "${String(prop)}". Returning mock.`);
      return createDummyMock();
    }
    if (typeof value === "function") {
      return value.bind(firestore);
    }
    return value;
  }
});
var collections = {
  matches: () => firestore2.collection("matches"),
  news: () => firestore2.collection("news"),
  users: () => firestore2.collection("users"),
  predictions: () => firestore2.collection("predictions"),
  userPoints: () => firestore2.collection("user_points"),
  rssSources: () => firestore2.collection("rss_sources"),
  socialQueue: () => firestore2.collection("social_queue"),
  socialAccounts: () => firestore2.collection("social_accounts"),
  socialLogs: () => firestore2.collection("social_logs"),
  securityAudits: () => firestore2.collection("security_audits"),
  systemSettings: () => firestore2.collection("system_settings"),
  sources: () => firestore2.collection("sources"),
  leagues: () => firestore2.collection("leagues"),
  teams: () => firestore2.collection("teams"),
  players: () => firestore2.collection("players"),
  cmsLeagues: () => firestore2.collection("cms_leagues"),
  cmsServers: () => firestore2.collection("cms_channels_servers"),
  worldCupCache: () => firestore2.collection("worldcup_cache")
};

// api/seo-render.ts
function wrapSeoHandler(handler2) {
  return async (req, res) => {
    const originalSend = res.send;
    const reqUrl = req.url || "/";
    const startTime = Date.now();
    res.send = function(body) {
      const rawHeader = typeof res.getHeader === "function" ? res.getHeader("Content-Type") : typeof res.get === "function" ? res.get("Content-Type") : "";
      const contentType = String(rawHeader || "");
      const statusCode = res.statusCode;
      const duration = Date.now() - startTime;
      console.log(`[SEO-RENDER-LOG] --- START RENDER LOG ---`);
      console.log(`[SEO-RENDER-LOG] Request: ${req.method} ${reqUrl}`);
      console.log(`[SEO-RENDER-LOG] Status: ${statusCode}`);
      console.log(`[SEO-RENDER-LOG] Content-Type: ${contentType}`);
      console.log(`[SEO-RENDER-LOG] Execution Duration: ${duration}ms`);
      if (typeof body === "string") {
        if (contentType.includes("text/html")) {
          console.log(`[SEO-RENDER-LOG] Rendered HTML Size: ${body.length} characters`);
          console.log(`[SEO-RENDER-LOG] HTML Head Snippet:
${body.substring(0, 800)}...`);
          const titleMatch = body.match(/<title>(.*?)<\/title>/i);
          const descMatch = body.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) || body.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/i);
          const ogTitle = body.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
          const ogDesc = body.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
          const ogImage = body.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
          const canonical = body.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
          const metadata = {
            title: titleMatch ? titleMatch[1] : "N/A",
            description: descMatch ? descMatch[1] : "N/A",
            ogTitle: ogTitle ? ogTitle[1] : "N/A",
            ogDescription: ogDesc ? ogDesc[1] : "N/A",
            ogImage: ogImage ? ogImage[1] : "N/A",
            canonical: canonical ? canonical[1] : "N/A"
          };
          console.log(`[SEO-RENDER-LOG] Captured Metadata Object:`, JSON.stringify(metadata, null, 2));
          const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
          let match;
          let idx = 1;
          while ((match = jsonLdRegex.exec(body)) !== null) {
            try {
              const parsed = JSON.parse(match[1].trim());
              console.log(`[SEO-RENDER-LOG] Structured Data Block #${idx++} (@type: ${parsed["@type"] || "Unknown"}):`, JSON.stringify(parsed, null, 2));
            } catch (err) {
              console.log(`[SEO-RENDER-LOG] Structured Data Block #${idx++} (Unparseable JSON):`, match[1].trim().substring(0, 200) + "...");
            }
          }
        } else if (contentType.includes("xml")) {
          console.log(`[SEO-RENDER-LOG] Rendered XML Size: ${body.length} characters`);
          console.log(`[SEO-RENDER-LOG] XML Snippet (First 500 chars):
${body.substring(0, 500)}...`);
        } else {
          console.log(`[SEO-RENDER-LOG] Response Snippet (First 200 chars):
${body.substring(0, 200)}...`);
        }
      } else {
        console.log(`[SEO-RENDER-LOG] Non-string response body of type: ${typeof body}`);
      }
      console.log(`[SEO-RENDER-LOG] --- END RENDER LOG ---`);
      return originalSend.call(this, body);
    };
    try {
      return await handler2(req, res);
    } catch (err) {
      console.error(`[SEO-RENDER-ERROR] Crash inside SEO Handler wrapper:`, err);
      throw err;
    }
  };
}

// api/seo.ts
var getBaseUrl = (req) => "https://korea90.xyz";
var CACHE_SHORT = 300 * 1e3;
var CACHE_MEDIUM = 3600 * 1e3;
var CACHE_LONG = 86400 * 1e3;
var cachedIndexHtml = null;
var matchSsoCache = {};
var newsSsoCache = {};
var sitemapCache = {};
var safeToDate = (val) => {
  if (!val) return /* @__PURE__ */ new Date();
  if (typeof val.toDate === "function") {
    try {
      return val.toDate();
    } catch (e) {
    }
  }
  if (typeof val.seconds === "number" || typeof val._seconds === "number") {
    const s = val.seconds ?? val._seconds;
    const ns = val.nanoseconds ?? val._nanoseconds ?? 0;
    return new Date(s * 1e3 + ns / 1e6);
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? /* @__PURE__ */ new Date() : val;
  }
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? /* @__PURE__ */ new Date() : d;
  }
  return /* @__PURE__ */ new Date();
};
var encodeUrlPath = (host, pathSegment) => {
  const sanitizedPath = pathSegment.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `${host}/${sanitizedPath}`;
};
var encodeFullUrl = (urlStr) => {
  try {
    const url = new URL(urlStr);
    const encodedPath = url.pathname.split("/").map((segment) => encodeURIComponent(segment)).join("/");
    return `${url.protocol}//${url.host}${encodedPath}${url.search}${url.hash}`;
  } catch (e) {
    return urlStr;
  }
};
var getCachedOrGenerate = async (key, duration, generator) => {
  const now = Date.now();
  if (sitemapCache[key] && sitemapCache[key].expiry > now) {
    return sitemapCache[key].xml;
  }
  try {
    const xml = await generator();
    sitemapCache[key] = {
      xml,
      expiry: now + duration
    };
    return xml;
  } catch (err) {
    console.error(`[getCachedOrGenerate] Error generating sitemap for key ${key}:`, err);
    if (sitemapCache[key]?.xml) {
      return sitemapCache[key].xml;
    }
    if (key === "news") {
      return generateNewsSitemapXml([]);
    } else if (key === "images") {
      return generateImageSitemapXml([]);
    } else {
      return generateSitemapXml([]);
    }
  }
};
var getIndexHtml = () => {
  if (cachedIndexHtml && process.env.NODE_ENV === "production") return cachedIndexHtml;
  const possiblePaths = [
    path.join(process.cwd(), "dist", "index.html"),
    path.join(process.cwd(), "index.html"),
    path.resolve("./dist/index.html"),
    path.resolve("./index.html"),
    path.join(__dirname, "dist", "index.html"),
    path.join(__dirname, "..", "dist", "index.html"),
    path.join(__dirname, "../..", "dist", "index.html"),
    path.join(__dirname, "..", "index.html"),
    path.join(__dirname, "index.html")
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        cachedIndexHtml = fs.readFileSync(p, "utf-8");
        if (cachedIndexHtml && cachedIndexHtml.includes('id="root"')) {
          return cachedIndexHtml;
        }
      }
    } catch (_) {
    }
  }
  let assetScript = "";
  try {
    const assetsDir = path.join(process.cwd(), "dist", "assets");
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      const mainJs = files.find((f) => f.startsWith("index") && f.endsWith(".js"));
      const mainCss = files.find((f) => f.startsWith("index") && f.endsWith(".css"));
      if (mainJs) {
        assetScript += `  <script type="module" crossorigin src="/assets/${mainJs}"></script>
`;
      }
      if (mainCss) {
        assetScript += `  <link rel="stylesheet" crossorigin href="/assets/${mainCss}">
`;
      }
    }
  } catch (_) {
  }
  if (!assetScript) {
    assetScript = `  <script type="module" src="/src/main.tsx"></script>
`;
  }
  cachedIndexHtml = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/logo-master.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>\u0635\u0627\u0641\u0631\u0629 90 | \u0623\u0647\u0645 \u0623\u062E\u0628\u0627\u0631 \u0648\u0646\u062A\u0627\u0626\u062C \u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0643\u0631\u0629 \u0627\u0644\u0642\u062F\u0645</title>
${assetScript}  </head>
  <body class="bg-[#0F0F10] text-white min-h-screen">
    <div id="root"></div>
  </body>
</html>`;
  return cachedIndexHtml;
};
var generateBreadcrumbs = (pathname, pageTitle) => {
  const items = [
    { name: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", url: "https://korea90.xyz/" }
  ];
  if (pathname.startsWith("/match/")) {
    items.push({ name: "\u062C\u062F\u0648\u0644 \u0627\u0644\u0645\u0628\u0627\u0631\u064A\u0627\u062A", url: "https://korea90.xyz/schedule" });
    if (pageTitle) {
      items.push({ name: pageTitle.replace(" | \u0635\u0627\u0641\u0631\u0629 90", ""), url: `https://korea90.xyz${pathname}` });
    }
  } else if (pathname.startsWith("/news/")) {
    items.push({ name: "\u0627\u0644\u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629", url: "https://korea90.xyz/news" });
    if (pageTitle) {
      items.push({ name: pageTitle.replace(" | \u0635\u0627\u0641\u0631\u0629 90", ""), url: `https://korea90.xyz${pathname}` });
    }
  } else if (pathname.includes("/standings")) {
    items.push({ name: "\u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u0631\u062A\u064A\u0628", url: "https://korea90.xyz/standings" });
  } else if (pathname.includes("/schedule")) {
    items.push({ name: "\u062C\u062F\u0648\u0644 \u0627\u0644\u0645\u0628\u0627\u0631\u064A\u0627\u062A", url: "https://korea90.xyz/schedule" });
  } else if (pathname.includes("/world-cup-2026")) {
    items.push({ name: "\u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026", url: "https://korea90.xyz/world-cup-2026" });
  } else if (pathname.includes("/leagues")) {
    items.push({ name: "\u0627\u0644\u0628\u0637\u0648\u0644\u0627\u062A", url: "https://korea90.xyz/leagues" });
  } else if (pathname.includes("/team/")) {
    items.push({ name: "\u0627\u0644\u0623\u0646\u062F\u064A\u0629 \u0648\u0627\u0644\u0641\u0631\u0642", url: "https://korea90.xyz/standings" });
    if (pageTitle) {
      items.push({ name: pageTitle.replace(" | \u0635\u0627\u0641\u0631\u0629 90", ""), url: `https://korea90.xyz${pathname}` });
    }
  } else if (pathname.includes("/player/")) {
    items.push({ name: "\u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646", url: "https://korea90.xyz/standings" });
    if (pageTitle) {
      items.push({ name: pageTitle.replace(" | \u0635\u0627\u0641\u0631\u0629 90", ""), url: `https://korea90.xyz${pathname}` });
    }
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};
var injectSeo = (html, options) => {
  const { title, description, url, image = "https://korea90.xyz/logo-master.png", type = "website", structuredData, pathname } = options;
  let result = html;
  result = result.replace(/<title>.*?<\/title>/gi, "");
  result = result.replace(/<meta name="description" content=".*?" \/>/gi, "");
  result = result.replace(/<meta property="og:title" content=".*?" \/>/gi, "");
  result = result.replace(/<meta property="og:description" content=".*?" \/>/gi, "");
  result = result.replace(/<meta property="og:url" content=".*?" \/>/gi, "");
  result = result.replace(/<meta property="og:image" content=".*?" \/>/gi, "");
  result = result.replace(/<meta property="og:type" content=".*?" \/>/gi, "");
  result = result.replace(/<link rel="canonical" href=".*?" \/>/gi, "");
  const fullTitle = title ? `${title} | \u0635\u0627\u0641\u0631\u0629 90` : "\u0635\u0627\u0641\u0631\u0629 90 | \u0623\u0647\u0645 \u0623\u062E\u0628\u0627\u0631 \u0648\u0646\u062A\u0627\u0626\u062C \u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0643\u0631\u0629 \u0627\u0644\u0642\u062F\u0645";
  const fullDescription = description || "\u0635\u0627\u0641\u0631\u0629 90 \u0647\u064A \u0645\u0646\u0635\u062A\u0643 \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0646\u062A\u0627\u0626\u062C \u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0643\u0631\u0629 \u0627\u0644\u0642\u062F\u0645\u060C \u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u060C \u0648\u0623\u062D\u062F\u062B \u0627\u0644\u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629 \u0648\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0644\u062D\u0638\u0629 \u0628\u0644\u062D\u0638\u0629.";
  let headTags = "";
  headTags += `  <title>${fullTitle}</title>
`;
  headTags += `  <meta name="description" content="${fullDescription}" />
`;
  headTags += `  <link rel="canonical" href="${url}" />
`;
  headTags += `  <meta property="og:title" content="${fullTitle}" />
`;
  headTags += `  <meta property="og:description" content="${fullDescription}" />
`;
  headTags += `  <meta property="og:url" content="${url}" />
`;
  headTags += `  <meta property="og:image" content="${image}" />
`;
  headTags += `  <meta property="og:type" content="${type}" />
`;
  headTags += `  <meta property="og:locale" content="ar_AR" />
`;
  headTags += `  <meta property="og:site_name" content="\u0635\u0627\u0641\u0631\u0629 90" />
`;
  headTags += `  <meta name="twitter:card" content="summary_large_image" />
`;
  headTags += `  <meta name="twitter:title" content="${fullTitle}" />
`;
  headTags += `  <meta name="twitter:description" content="${fullDescription}" />
`;
  headTags += `  <meta name="twitter:image" content="${image}" />
`;
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://korea90.xyz/#organization",
    "name": "\u0635\u0627\u0641\u0631\u0629 90",
    "url": "https://korea90.xyz/",
    "logo": "https://korea90.xyz/logo-master.png",
    "sameAs": [
      "https://twitter.com/safara90",
      "https://facebook.com/safara90"
    ]
  };
  headTags += `  <script type="application/ld+json">
${JSON.stringify(organizationSchema, null, 2)}
  </script>
`;
  const breadcrumbsSchema = generateBreadcrumbs(pathname, title);
  headTags += `  <script type="application/ld+json">
${JSON.stringify(breadcrumbsSchema, null, 2)}
  </script>
`;
  if (structuredData) {
    headTags += `  <script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
  </script>
`;
  }
  if (result.includes("<head>")) {
    result = result.replace("<head>", `<head>
${headTags}`);
  } else if (result.includes("</head>")) {
    result = result.replace("</head>", `${headTags}</head>`);
  }
  return result;
};
async function handler(req, res) {
  try {
    let query = {};
    if (req.query && typeof req.query === "object") {
      for (const [k, v] of Object.entries(req.query)) {
        if (typeof v === "string") query[k] = v;
      }
    }
    const rawUrl = req.url || "";
    if (rawUrl.includes("?")) {
      try {
        const parsedUrl2 = new URL(rawUrl, "https://korea90.xyz");
        parsedUrl2.searchParams.forEach((v, k) => {
          if (!query[k]) query[k] = v;
        });
      } catch (e) {
      }
    }
    if (!query.action) {
      if (rawUrl.includes("robots.txt")) query.action = "robots";
      else if (rawUrl.includes("sitemap")) {
        query.action = "sitemap";
        if (rawUrl.includes("sitemap-main")) query.type = "main";
        else if (rawUrl.includes("sitemap-matches")) query.type = "matches";
        else if (rawUrl.includes("sitemap-leagues")) query.type = "leagues";
        else if (rawUrl.includes("sitemap-teams")) query.type = "teams";
        else if (rawUrl.includes("sitemap-players")) query.type = "players";
        else if (rawUrl.includes("sitemap-news")) query.type = "news";
        else if (rawUrl.includes("sitemap-images")) query.type = "images";
      }
    }
    const action = query.action;
    const type = query.type;
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[FORENSIC-AUDIT] [${requestId}] ---> REQUEST ENTRY <---`);
    if (action === "robots") {
      console.log(`[FORENSIC-AUDIT] [${requestId}] Handling robots.txt request`);
      res.setHeader("Content-Type", "text/plain");
      console.log(`[FORENSIC-AUDIT] [${requestId}] Sending robots.txt response`);
      return res.status(200).send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /vip
Disallow: /premium-services
Disallow: /*?*

Sitemap: https://korea90.xyz/sitemap.xml`);
    }
    if (action === "sitemap") {
      const host = getBaseUrl(req);
      console.log(`[FORENSIC-AUDIT] [${requestId}] Sitemap Route Entered. Type: ${type || "index"}, Host: ${host}`);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      try {
        if (!type || type === "index") {
          const sitemapsList = [
            `${host}/sitemap-main.xml`,
            `${host}/sitemap-matches.xml`,
            `${host}/sitemap-leagues.xml`,
            `${host}/sitemap-teams.xml`,
            `${host}/sitemap-players.xml`,
            `${host}/sitemap-news.xml`,
            `${host}/sitemap-images.xml`
          ];
          res.setHeader("Cache-Control", "public, max-age=3600");
          return res.status(200).send(generateSitemapIndexXml(sitemapsList));
        }
        if (type === "main") {
          const xml = await getCachedOrGenerate("main", CACHE_LONG, async () => {
            const urls = [
              { loc: `${host}/`, changefreq: "daily", priority: "1.0" },
              { loc: `${host}/world-cup-2026`, changefreq: "weekly", priority: "0.9" },
              { loc: `${host}/standings`, changefreq: "daily", priority: "0.8" },
              { loc: `${host}/schedule`, changefreq: "always", priority: "0.9" },
              { loc: `${host}/news`, changefreq: "always", priority: "0.9" }
            ];
            return generateSitemapXml(urls);
          });
          res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
          return res.status(200).send(xml);
        }
        if (type === "matches") {
          console.log(`[FORENSIC-AUDIT] [${requestId}] Handling matches sitemap`);
          const xml = await getCachedOrGenerate("matches", CACHE_SHORT, async () => {
            const urls = [];
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Querying collections.matches()...`);
            const snap = await collections.matches().orderBy("startTime", "desc").limit(1e3).get();
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Query completed. Docs count: ${snap.size}`);
            snap.forEach((doc) => {
              try {
                const data = doc.data();
                if (!data) return;
                const match = normalizeMatch({ ...data, id: doc.id });
                if (!match || match.isHidden) return;
                const isPlaceholder = (name) => {
                  if (!name) return true;
                  const lower = name.toLowerCase();
                  return lower.includes("unknown") || lower.includes("tbd") || lower === "team" || name === "\u0642\u064A\u062F \u0627\u0644\u062A\u062D\u062F\u064A\u062F";
                };
                if (isPlaceholder(match.homeName) && isPlaceholder(match.awayName)) return;
                if (!match.slug || match.slug === "undefined" || match.slug.includes("[object Object]")) return;
                const rawLastMod = data.updatedAt || data.startTime;
                const lastModDate = safeToDate(rawLastMod);
                urls.push({
                  loc: encodeUrlPath(host, `match/${match.slug}`),
                  changefreq: "daily",
                  priority: "0.8",
                  lastmod: lastModDate.toISOString()
                });
              } catch (docErr) {
                console.error(`[FORENSIC-AUDIT] [${requestId}] [SEO WARNING] Error processing match doc ${doc.id}:`, docErr);
              }
            });
            console.log(`[FORENSIC-AUDIT] [${requestId}] [XML Generation] Generating Matches XML. URL Count: ${urls.length}`);
            return generateSitemapXml(urls);
          });
          res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
          console.log(`[FORENSIC-AUDIT] [${requestId}] [Response Send] Sending matches sitemap XML`);
          return res.status(200).send(xml);
        }
        if (type === "news") {
          console.log(`[FORENSIC-AUDIT] [${requestId}] Handling news sitemap`);
          const xml = await getCachedOrGenerate("news", CACHE_SHORT, async () => {
            const urls = [];
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Querying collections.news()...`);
            const snap = await collections.news().orderBy("publishDate", "desc").limit(500).get();
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Query completed. Docs count: ${snap.size}`);
            snap.forEach((doc) => {
              try {
                const data = doc.data();
                if (!data) return;
                const news = normalizeNews({ ...data, id: doc.id });
                if (!news || !news.slug || news.slug === "undefined" || news.slug.includes("[object Object]")) return;
                const pubDate = safeToDate(data.publishDate).toISOString();
                urls.push({
                  loc: encodeUrlPath(host, `news/${news.slug}`),
                  title: news.title || "\u062E\u0628\u0631 \u062C\u062F\u064A\u062F",
                  publicationDate: pubDate,
                  name: "\u0633\u0641\u0631\u0627\u0621 90",
                  language: "ar"
                });
              } catch (docErr) {
                console.error(`[FORENSIC-AUDIT] [${requestId}] [SEO WARNING] Error processing news doc ${doc.id}:`, docErr);
              }
            });
            console.log(`[FORENSIC-AUDIT] [${requestId}] [XML Generation] Generating News XML. URL Count: ${urls.length}`);
            return generateNewsSitemapXml(urls);
          });
          res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
          console.log(`[FORENSIC-AUDIT] [${requestId}] [Response Send] Sending news sitemap XML`);
          return res.status(200).send(xml);
        }
        if (type === "images") {
          console.log(`[FORENSIC-AUDIT] [${requestId}] Handling images sitemap`);
          const xml = await getCachedOrGenerate("images", CACHE_MEDIUM, async () => {
            const urls = [];
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Querying collections.news() for images...`);
            const newsSnap = await collections.news().orderBy("publishDate", "desc").limit(100).get();
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Query completed. Docs count: ${newsSnap.size}`);
            newsSnap.forEach((doc) => {
              try {
                const data = doc.data();
                if (!data) return;
                const news = normalizeNews({ ...data, id: doc.id });
                if (!news || !news.slug || news.slug === "undefined" || news.slug.includes("[object Object]")) return;
                const imageField = data.image || data.featuredImage?.url;
                if (imageField) {
                  const imgUrl = imageField.startsWith("http") ? imageField : `${host}${imageField.startsWith("/") ? "" : "/"}${imageField}`;
                  urls.push({
                    loc: encodeUrlPath(host, `news/${news.slug}`),
                    images: [{ loc: encodeFullUrl(imgUrl), title: news.title || "\u0635\u0648\u0631\u0629 \u0627\u0644\u062E\u0628\u0631" }]
                  });
                }
              } catch (docErr) {
                console.error(`[FORENSIC-AUDIT] [${requestId}] [SEO WARNING] Error processing image for news doc ${doc.id}:`, docErr);
              }
            });
            console.log(`[FORENSIC-AUDIT] [${requestId}] [XML Generation] Generating Images XML. URL Count: ${urls.length}`);
            return generateImageSitemapXml(urls);
          });
          res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
          console.log(`[FORENSIC-AUDIT] [${requestId}] [Response Send] Sending images sitemap XML`);
          return res.status(200).send(xml);
        }
        if (type === "leagues") {
          console.log(`[FORENSIC-AUDIT] [${requestId}] Handling leagues sitemap`);
          const xml = await getCachedOrGenerate("leagues", CACHE_LONG, async () => {
            const urls = [];
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Querying collections.leagues()...`);
            const snap = await collections.leagues().limit(100).get();
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Query completed. Docs count: ${snap.size}`);
            snap.forEach((doc) => {
              try {
                const data = doc.data();
                if (!data) return;
                const league = normalizeLeague({ ...data, id: doc.id });
                if (!league || !league.slug || league.slug === "undefined" || league.slug.includes("[object Object]")) return;
                urls.push({ loc: encodeUrlPath(host, `league/${league.slug}`), changefreq: "daily", priority: "0.8" });
              } catch (docErr) {
                console.error(`[FORENSIC-AUDIT] [${requestId}] [SEO WARNING] Error processing league doc ${doc.id}:`, docErr);
              }
            });
            console.log(`[FORENSIC-AUDIT] [${requestId}] [XML Generation] Generating Leagues XML. URL Count: ${urls.length}`);
            return generateSitemapXml(urls);
          });
          res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
          console.log(`[FORENSIC-AUDIT] [${requestId}] [Response Send] Sending leagues sitemap XML`);
          return res.status(200).send(xml);
        }
        if (type === "teams") {
          console.log(`[FORENSIC-AUDIT] [${requestId}] Handling teams sitemap`);
          const xml = await getCachedOrGenerate("teams", CACHE_LONG, async () => {
            const urls = [];
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Querying collections.teams()...`);
            const snap = await collections.teams().limit(500).get();
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Query completed. Docs count: ${snap.size}`);
            snap.forEach((doc) => {
              try {
                const data = doc.data();
                if (!data) return;
                const team = normalizeTeam({ ...data, id: doc.id });
                if (!team || !team.slug || team.slug === "undefined" || team.slug.includes("[object Object]")) return;
                urls.push({ loc: encodeUrlPath(host, `team/${team.slug}`), changefreq: "weekly", priority: "0.7" });
              } catch (docErr) {
                console.error(`[FORENSIC-AUDIT] [${requestId}] [SEO WARNING] Error processing team doc ${doc.id}:`, docErr);
              }
            });
            console.log(`[FORENSIC-AUDIT] [${requestId}] [XML Generation] Generating Teams XML. URL Count: ${urls.length}`);
            return generateSitemapXml(urls);
          });
          res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
          console.log(`[FORENSIC-AUDIT] [${requestId}] [Response Send] Sending teams sitemap XML`);
          return res.status(200).send(xml);
        }
        if (type === "players") {
          console.log(`[FORENSIC-AUDIT] [${requestId}] Handling players sitemap`);
          const xml = await getCachedOrGenerate("players", CACHE_LONG, async () => {
            const urls = [];
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Querying collections.players()...`);
            const snap = await collections.players().limit(500).get();
            console.log(`[FORENSIC-AUDIT] [${requestId}] [Firestore Query] Query completed. Docs count: ${snap.size}`);
            snap.forEach((doc) => {
              try {
                const data = doc.data();
                if (!data) return;
                const slug = createSlugPath2(data.name || "player", doc.id);
                if (!slug || slug === "undefined" || slug.includes("[object Object]")) return;
                urls.push({ loc: encodeUrlPath(host, `player/${slug}`), changefreq: "weekly", priority: "0.6" });
              } catch (docErr) {
                console.error(`[FORENSIC-AUDIT] [${requestId}] [SEO WARNING] Error processing player doc ${doc.id}:`, docErr);
              }
            });
            console.log(`[FORENSIC-AUDIT] [${requestId}] [XML Generation] Generating Players XML. URL Count: ${urls.length}`);
            return generateSitemapXml(urls);
          });
          res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
          console.log(`[FORENSIC-AUDIT] [${requestId}] [Response Send] Sending players sitemap XML`);
          return res.status(200).send(xml);
        }
        res.setHeader("Cache-Control", "public, max-age=3600");
        console.log(`[FORENSIC-AUDIT] [${requestId}] [Response Send] Sending fallback empty sitemap`);
        return res.status(200).send(generateSitemapXml([]));
      } catch (err) {
        console.error(`[FORENSIC-AUDIT] [${requestId}] [CATCH EXCEPTION] Sitemap handler failed! Stack Trace:`, err.stack || err);
        if (!type || type === "index") {
          return res.status(200).send(generateSitemapIndexXml([]));
        } else if (type === "news") {
          return res.status(200).send(generateNewsSitemapXml([]));
        } else if (type === "images") {
          return res.status(200).send(generateImageSitemapXml([]));
        } else {
          return res.status(200).send(generateSitemapXml([]));
        }
      }
    }
    const reqUrl = req.url || "/";
    const parsedUrl = new URL(reqUrl, "https://korea90.xyz");
    const pathname = parsedUrl.pathname;
    let html = getIndexHtml();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=600");
    if (pathname.startsWith("/match/")) {
      const slug = pathname.split("/")[2] || "";
      const matchId = getIdFromSlug(slug);
      if (!matchId) {
        return res.status(200).send(html);
      }
      const nowMs = Date.now();
      let matchDoc = null;
      if (matchSsoCache[matchId] && matchSsoCache[matchId].expiry > nowMs) {
        matchDoc = matchSsoCache[matchId].data;
      } else {
        const doc = await firestore2.collection("matches").doc(matchId).get();
        if (doc.exists) {
          matchDoc = { id: doc.id, ...doc.data(), exists: true };
          matchSsoCache[matchId] = { data: matchDoc, expiry: nowMs + 5 * 60 * 1e3 };
        } else {
          matchDoc = { exists: false };
          matchSsoCache[matchId] = { data: matchDoc, expiry: nowMs + 2 * 60 * 1e3 };
        }
      }
      const exists = matchDoc.exists;
      const isWcPattern = matchId.includes("2026-m-") || matchId.includes("2022-m-") || matchId.startsWith("wc-");
      if (!exists && !isWcPattern) {
        return res.status(404).send(html);
      }
      if (exists) {
        const data = matchDoc || {};
        const homeTeam = data.homeTeamName || (typeof data.homeTeam === "object" ? data.homeTeam.name : data.homeTeam) || "\u0641\u0631\u064A\u0642 1";
        const awayTeam = data.awayTeamName || (typeof data.awayTeam === "object" ? data.awayTeam.name : data.awayTeam) || "\u0641\u0631\u064A\u0642 2";
        const league = data.leagueName || (typeof data.league === "object" ? data.league.name : data.league) || "\u0628\u0637\u0648\u0644\u0629";
        const title = `\u0645\u0628\u0627\u0631\u0627\u0629 ${homeTeam} \u0636\u062F ${awayTeam} - ${league}`;
        const description = `\u062A\u0627\u0628\u0639 \u062A\u0641\u0627\u0635\u064A\u0644 \u0645\u0628\u0627\u0631\u0627\u0629 ${homeTeam} \u0648 ${awayTeam} \u0641\u064A ${league}. \u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u060C \u0627\u0644\u062A\u0634\u0643\u064A\u0644\u0627\u062A\u060C \u0648\u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0644\u062D\u0638\u0629 \u0628\u0644\u062D\u0638\u0629 \u0639\u0644\u0649 \u0635\u0627\u0641\u0631\u0629 90.`;
        const structuredData = {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          "name": title,
          "description": description,
          "startDate": data.startTime?.toDate?.()?.toISOString() || data.startTime,
          "homeTeam": { "@type": "SportsTeam", "name": homeTeam },
          "awayTeam": { "@type": "SportsTeam", "name": awayTeam },
          "location": { "@type": "Place", "name": data.venue || "\u0645\u0644\u0639\u0628 \u0627\u0644\u0645\u0628\u0627\u0631\u0627\u0629" }
        };
        html = injectSeo(html, {
          title,
          description,
          url: `https://korea90.xyz/match/${slug}`,
          type: "article",
          structuredData,
          pathname
        });
      }
      return res.status(200).send(html);
    }
    if (pathname.startsWith("/news/")) {
      const slug = pathname.split("/")[2] || "";
      const newsId = getIdFromSlug(slug);
      if (!newsId) {
        return res.status(200).send(html);
      }
      const nowMs = Date.now();
      let newsDoc = null;
      if (newsSsoCache[newsId] && newsSsoCache[newsId].expiry > nowMs) {
        newsDoc = newsSsoCache[newsId].data;
      } else {
        const doc = await firestore2.collection("news").doc(newsId).get();
        if (doc.exists) {
          newsDoc = { id: doc.id, ...doc.data(), exists: true };
          newsSsoCache[newsId] = { data: newsDoc, expiry: nowMs + 10 * 60 * 1e3 };
        } else {
          newsDoc = { exists: false };
          newsSsoCache[newsId] = { data: newsDoc, expiry: nowMs + 2 * 60 * 1e3 };
        }
      }
      if (!newsDoc.exists) {
        return res.status(404).send(html);
      }
      const data = newsDoc;
      const title = data.seo?.metaTitle || data.title;
      const description = data.seo?.metaDescription || data.excerpt || data.content?.substring(0, 160);
      const image = data.featuredImage?.url || data.image || "https://korea90.xyz/logo-master.png";
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "description": description,
        "image": [image],
        "datePublished": data.publishDate?.toDate?.()?.toISOString() || data.publishDate,
        "dateModified": data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        "author": { "@type": "Organization", "name": "\u0635\u0627\u0641\u0631\u0629 90" }
      };
      html = injectSeo(html, {
        title,
        description,
        url: `https://korea90.xyz/news/${slug}`,
        image,
        type: "article",
        structuredData,
        pathname
      });
      return res.status(200).send(html);
    }
    if (pathname.startsWith("/team/")) {
      const slug = pathname.split("/")[2] || "";
      const teamId = getIdFromSlug(slug);
      if (!teamId) {
        return res.status(200).send(html);
      }
      let teamDoc = null;
      try {
        const doc = await firestore2.collection("teams").doc(teamId).get();
        if (doc.exists) {
          teamDoc = doc.data();
        }
      } catch (err) {
        console.warn(`[SEO Team Page] Failed to fetch team doc:`, err);
      }
      const teamName = teamDoc?.name || "\u0646\u0627\u062F\u064A \u0631\u064A\u0627\u0636\u064A";
      const title = `\u0646\u0627\u062F\u064A ${teamName} - \u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0648\u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0648\u0627\u0644\u062A\u0631\u062A\u064A\u0628`;
      const description = `\u062A\u0627\u0628\u0639 \u0622\u062E\u0631 \u0623\u062E\u0628\u0627\u0631 \u0646\u0627\u062F\u064A ${teamName}\u060C \u0645\u0628\u0627\u0631\u064A\u0627\u062A\u0647 \u0627\u0644\u0642\u0627\u062F\u0645\u0629\u060C \u0646\u062A\u0627\u0626\u062C\u0647 \u0627\u0644\u062D\u0627\u0644\u064A\u0629\u060C \u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u0631\u062A\u064A\u0628\u060C \u0648\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0648\u0627\u0644\u062A\u0634\u0643\u064A\u0644\u0629 \u0639\u0644\u0649 \u0635\u0627\u0641\u0631\u0629 90.`;
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "SportsTeam",
        "name": teamName,
        "url": `https://korea90.xyz/team/${slug}`,
        "logo": teamDoc?.logo || "https://korea90.xyz/logo-master.png"
      };
      html = injectSeo(html, {
        title,
        description,
        url: `https://korea90.xyz/team/${slug}`,
        image: teamDoc?.logo || "https://korea90.xyz/logo-master.png",
        type: "article",
        structuredData,
        pathname
      });
      return res.status(200).send(html);
    }
    if (pathname.startsWith("/league/")) {
      const slug = pathname.split("/")[2] || "";
      const leagueId = getIdFromSlug(slug);
      if (!leagueId) {
        return res.status(200).send(html);
      }
      let leagueDoc = null;
      try {
        const doc = await firestore2.collection("leagues").doc(leagueId).get();
        if (doc.exists) {
          leagueDoc = doc.data();
        }
      } catch (err) {
        console.warn(`[SEO League Page] Failed to fetch league doc:`, err);
      }
      const leagueName = leagueDoc?.name || "\u0627\u0644\u0628\u0637\u0648\u0644\u0629";
      const title = `\u062F\u0648\u0631\u064A ${leagueName} - \u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u0631\u062A\u064A\u0628\u060C \u0627\u0644\u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0648\u0627\u0644\u0646\u062A\u0627\u0626\u062C`;
      const description = `\u062A\u0627\u0628\u0639 \u0646\u062A\u0627\u0626\u062C \u0645\u0628\u0627\u0631\u064A\u0627\u062A \u062F\u0648\u0631\u064A ${leagueName}\u060C \u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0645\u062D\u062F\u062B \u0644\u062D\u0638\u0629 \u0628\u0644\u062D\u0638\u0629\u060C \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0647\u062F\u0627\u0641\u064A\u0646 \u0648\u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u0628\u0637\u0648\u0644\u0629 \u0639\u0644\u0649 \u0635\u0627\u0641\u0631\u0629 90.`;
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "SportsOrganization",
        "name": leagueName,
        "url": `https://korea90.xyz/league/${slug}`,
        "logo": leagueDoc?.logo || "https://korea90.xyz/logo-master.png"
      };
      html = injectSeo(html, {
        title,
        description,
        url: `https://korea90.xyz/league/${slug}`,
        image: leagueDoc?.logo || "https://korea90.xyz/logo-master.png",
        type: "article",
        structuredData,
        pathname
      });
      return res.status(200).send(html);
    }
    if (pathname === "/") {
      const homeSeo = injectSeo(html, {
        title: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 - \u0623\u0647\u0645 \u0623\u062E\u0628\u0627\u0631 \u0648\u0646\u062A\u0627\u0626\u062C \u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0643\u0631\u0629 \u0627\u0644\u0642\u062F\u0645",
        description: "\u0635\u0627\u0641\u0631\u0629 90 \u0647\u064A \u0645\u0646\u0635\u062A\u0643 \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0646\u062A\u0627\u0626\u062C \u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0643\u0631\u0629 \u0627\u0644\u0642\u062F\u0645\u060C \u0627\u0644\u0628\u062B \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u060C \u0648\u0623\u062D\u062F\u062B \u0627\u0644\u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629 \u0648\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0644\u062D\u0638\u0629 \u0628\u0644\u062D\u0638\u0629.",
        url: "https://korea90.xyz/",
        structuredData: {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "\u0635\u0627\u0641\u0631\u0629 90",
          "url": "https://korea90.xyz/",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://korea90.xyz/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        },
        pathname
      });
      return res.status(200).send(homeSeo);
    }
    let pageTitle = "";
    let pageDesc = "";
    if (pathname.includes("/standings")) {
      pageTitle = "\u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u0631\u062A\u064A\u0628 - \u062A\u0631\u062A\u064A\u0628 \u0641\u0631\u0642 \u0627\u0644\u062F\u0648\u0631\u064A\u0627\u062A \u0627\u0644\u0643\u0628\u0631\u0649 \u0648\u0627\u0644\u0628\u0637\u0648\u0644\u0627\u062A";
      pageDesc = "\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 \u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0645\u062D\u062F\u062B \u0628\u0627\u0633\u062A\u0645\u0631\u0627\u0631 \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u062F\u0648\u0631\u064A\u0627\u062A \u0648\u0627\u0644\u0628\u0637\u0648\u0644\u0627\u062A \u0627\u0644\u0643\u0628\u0631\u0649 \u0648\u0627\u0644\u0644\u0627\u0639\u0628\u064A\u0646 \u0648\u0627\u0644\u0647\u062F\u0627\u0641\u064A\u0646 \u0639\u0644\u0649 \u0635\u0627\u0641\u0631\u0629 90.";
    } else if (pathname.includes("/schedule")) {
      pageTitle = "\u062C\u062F\u0648\u0644 \u0627\u0644\u0645\u0628\u0627\u0631\u064A\u0627\u062A - \u0645\u0648\u0627\u0639\u064A\u062F \u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0627\u0644\u064A\u0648\u0645 \u0648\u0627\u0644\u063A\u062F";
      pageDesc = "\u062A\u0627\u0628\u0639 \u0645\u0648\u0627\u0639\u064A\u062F \u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0627\u0644\u064A\u0648\u0645 \u0648\u0627\u0644\u063A\u062F \u0648\u0627\u0644\u0627\u0645\u0633 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0628\u0637\u0648\u0644\u0627\u062A \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629 \u0648\u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0645\u0639 \u0627\u0644\u0642\u0646\u0648\u0627\u062A \u0627\u0644\u0646\u0627\u0642\u0644\u0629 \u0648\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062A\u063A\u0637\u064A\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629.";
    } else if (pathname.includes("/world-cup-2026")) {
      pageTitle = "\u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026 - \u062A\u063A\u0637\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u0644\u0628\u0637\u0648\u0644\u0629 \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645";
      pageDesc = "\u062A\u063A\u0637\u064A\u0629 \u062D\u064A\u0629 \u0648\u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0643\u0623\u0633 \u0627\u0644\u0639\u0627\u0644\u0645 2026\u060C \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0627\u062A\u060C \u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0647\u062F\u0627\u0641\u064A\u0646 \u0639\u0644\u0649 \u0635\u0627\u0641\u0631\u0629 90.";
    } else if (pathname.includes("/news")) {
      pageTitle = "\u0622\u062E\u0631 \u0627\u0644\u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629 - \u0623\u062E\u0628\u0627\u0631 \u0643\u0631\u0629 \u0627\u0644\u0642\u062F\u0645 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629 \u0648\u0627\u0644\u0639\u0631\u0628\u064A\u0629";
      pageDesc = "\u062A\u063A\u0637\u064A\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0644\u0622\u062E\u0631 \u0623\u062E\u0628\u0627\u0631 \u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u0628\u0627\u0631\u064A\u0627\u062A \u0641\u064A \u0627\u0644\u062F\u0648\u0631\u064A\u0627\u062A \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064A\u0629 \u0648\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629 \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0627\u0644\u0633\u0627\u0639\u0629.";
    }
    if (pageTitle) {
      html = injectSeo(html, {
        title: pageTitle,
        description: pageDesc,
        url: `https://korea90.xyz${pathname}`,
        pathname
      });
    }
    return res.status(200).send(html);
  } catch (globalErr) {
    console.error(`[SEO Handler Global Error]`, globalErr);
    const reqUrl = req.url || "";
    const action = req.query?.action;
    const type = req.query?.type;
    if (action === "sitemap" || reqUrl.includes("sitemap") || reqUrl.endsWith(".xml")) {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      if (type === "news") {
        return res.status(200).send(generateNewsSitemapXml([]));
      } else if (type === "images") {
        return res.status(200).send(generateImageSitemapXml([]));
      } else if (!type || type === "index") {
        const host = getBaseUrl(req);
        return res.status(200).send(generateSitemapIndexXml([
          `${host}/sitemap-main.xml`,
          `${host}/sitemap-matches.xml`,
          `${host}/sitemap-leagues.xml`,
          `${host}/sitemap-teams.xml`,
          `${host}/sitemap-players.xml`,
          `${host}/sitemap-news.xml`,
          `${host}/sitemap-images.xml`
        ]));
      } else {
        return res.status(200).send(generateSitemapXml([]));
      }
    }
    if (action === "robots" || reqUrl.includes("robots.txt")) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://korea90.xyz/sitemap.xml`);
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(getIndexHtml());
  }
}
var seo_default = wrapSeoHandler(handler);
export {
  seo_default as default
};
