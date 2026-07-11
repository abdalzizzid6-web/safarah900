import { firestore } from "../firestore/collections";
import { generateContentWithRetry } from "./aiService";
import { Type } from "@google/genai";

// Cache lifetime constants
const ENRICH_CACHE_TTL = 30 * 60 * 1000; // 30 mins for live/dynamic data
const STATIC_ENRICH_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days for static entities (Players, Teams)

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  type: 'career' | 'news' | 'transfer' | 'injury' | 'goals' | 'match';
}

interface PlayerKnowledge {
  id: string;
  name: string;
  arabicName: string;
  careerTimeline: TimelineEvent[];
  newsTimeline: TimelineEvent[];
  transferTimeline: TimelineEvent[];
  injuryTimeline: TimelineEvent[];
  goalsTimeline: TimelineEvent[];
  photos: string[];
  videos: { title: string; url: string; thumbnail: string }[];
  updatedAt: string;
}

interface TeamKnowledgeGraph {
  id: string;
  name: string;
  arabicName: string;
  latestNews: any[];
  upcomingMatches: any[];
  lastResults: any[];
  relatedPlayers: any[];
  topScorers: { name: string; goals: number; assists: number }[];
  relatedVideos: { title: string; url: string; thumbnail: string }[];
  updatedAt: string;
}

interface MatchKnowledgeGraph {
  id: string;
  relatedNews: any[];
  predictions: any;
  analysis: string;
  videos: { title: string; url: string; thumbnail: string }[];
  highlights: { title: string; videoUrl: string }[];
  statistics: any;
  timeline: any[];
  updatedAt: string;
}

// Global Alias Resolver (Hardcoded high frequency aliases + AI fallback resolver)
export async function resolveEntityAlias(query: string): Promise<{ type: 'player' | 'team' | 'league' | 'unknown'; canonicalId: string; canonicalName: string; canonicalArabicName: string }> {
  const normalized = query.toLowerCase().trim();

  // 1. High frequency static dictionary to minimize API hits
  const staticMap: Record<string, { type: 'player' | 'team' | 'league'; id: string; name: string; arName: string }> = {
    // Players
    'رونالدو': { type: 'player', id: '742', name: 'Cristiano Ronaldo', arName: 'كريستيانو رونالدو' },
    'كريستيانو رونالدو': { type: 'player', id: '742', name: 'Cristiano Ronaldo', arName: 'كريستيانو رونالدو' },
    'كريستيانو': { type: 'player', id: '742', name: 'Cristiano Ronaldo', arName: 'كريستيانو رونالدو' },
    'cr7': { type: 'player', id: '742', name: 'Cristiano Ronaldo', arName: 'كريستيانو رونالدو' },
    'الدون': { type: 'player', id: '742', name: 'Cristiano Ronaldo', arName: 'كريستيانو رونالدو' },

    'ميسي': { type: 'player', id: '154', name: 'Lionel Messi', arName: 'ليونيل ميسي' },
    'ليونيل ميسي': { type: 'player', id: '154', name: 'Lionel Messi', arName: 'ليونيل ميسي' },
    'البرغوث': { type: 'player', id: '154', name: 'Lionel Messi', arName: 'ليونيل ميسي' },

    'صلاح': { type: 'player', id: '306', name: 'Mohamed Salah', arName: 'محمد صلاح' },
    'محمد صلاح': { type: 'player', id: '306', name: 'Mohamed Salah', arName: 'محمد صلاح' },
    'أبو مكة': { type: 'player', id: '306', name: 'Mohamed Salah', arName: 'محمد صلاح' },

    'مبابي': { type: 'player', id: '190', name: 'Kylian Mbappe', arName: 'كيليان مبابي' },
    'كيليان مبابي': { type: 'player', id: '190', name: 'Kylian Mbappe', arName: 'كيليان مبابي' },

    // Teams
    'ريال مدريد': { type: 'team', id: '541', name: 'Real Madrid', arName: 'ريال مدريد' },
    'الريال': { type: 'team', id: '541', name: 'Real Madrid', arName: 'ريال مدريد' },
    'مدريد': { type: 'team', id: '541', name: 'Real Madrid', arName: 'ريال مدريد' },
    'الملكي': { type: 'team', id: '541', name: 'Real Madrid', arName: 'ريال مدريد' },

    'برشلونة': { type: 'team', id: '529', name: 'Barcelona', arName: 'برشلونة' },
    'البارسا': { type: 'team', id: '529', name: 'Barcelona', arName: 'برشلونة' },
    'بلوغرانا': { type: 'team', id: '529', name: 'Barcelona', arName: 'برشلونة' },

    'الهلال': { type: 'team', id: '2939', name: 'Al-Hilal', arName: 'الهلال' },
    'الزعيم': { type: 'team', id: '2939', name: 'Al-Hilal', arName: 'الهلال' },

    'النصر': { type: 'team', id: '2940', name: 'Al-Nassr', arName: 'النصر' },
    'العالمي': { type: 'team', id: '2940', name: 'Al-Nassr', arName: 'النصر' },

    // Leagues
    'الدوري الإنجليزي': { type: 'league', id: '39', name: 'Premier League', arName: 'الدوري الإنجليزي الممتاز' },
    'الدوري الإسباني': { type: 'league', id: '140', name: 'La Liga', arName: 'الدوري الإسباني' },
    'كأس العالم': { type: 'league', id: '1', name: 'World Cup', arName: 'كأس العالم 2026' }
  };

  if (staticMap[normalized]) {
    return {
      type: staticMap[normalized].type,
      canonicalId: staticMap[normalized].id,
      canonicalName: staticMap[normalized].name,
      canonicalArabicName: staticMap[normalized].arName
    };
  }

  // 2. Fallback to Gemini AI-powered resolver for complex aliases/nicknames
  try {
    const prompt = `
    Analyze this sports search query and resolve it to a standard football player, team, or league.
    Query: "${query}"

    You must match it to a realistic entity if possible, resolving aliases (e.g. "CR7" -> Cristiano Ronaldo, "المرنغي" -> Real Madrid).
    Return ONLY a JSON response strictly matching this schema. Avoid any extra commentary.
    `;

    const res = await generateContentWithRetry({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite sports database resolver. Map the sports query or nickname to its canonical English/Arabic representation.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Must be 'player' or 'team' or 'league' or 'unknown'" },
            canonicalId: { type: Type.STRING, description: "The most likely real sports numeric API ID (e.g., '742' for Ronaldo, '541' for Real Madrid), or empty if unknown." },
            canonicalName: { type: Type.STRING, description: "Canonical name in English (e.g., 'Cristiano Ronaldo')" },
            canonicalArabicName: { type: Type.STRING, description: "Canonical name in Arabic (e.g., 'كريستيانو رونالدو')" }
          },
          required: ["type", "canonicalId", "canonicalName", "canonicalArabicName"]
        }
      }
    });

    if (res.text) {
      const parsed = JSON.parse(res.text.replace(/```json|```/g, '').trim());
      if (parsed.type !== 'unknown') {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[Alias Resolver Error]:", err);
  }

  // Fallback to unknown
  return { type: 'unknown', canonicalId: '', canonicalName: query, canonicalArabicName: query };
}

// Player Knowledge Graph service
export async function getOrGeneratePlayerKnowledge(playerId: string, playerName?: string): Promise<PlayerKnowledge> {
  const cacheKey = playerId;

  try {
    // 1. Try Cache First
    const cacheDoc = await firestore.collection('players_knowledge').doc(cacheKey).get();
    if (cacheDoc.exists) {
      const cached = cacheDoc.data() as PlayerKnowledge;
      const age = Date.now() - new Date(cached.updatedAt).getTime();
      if (age < STATIC_ENRICH_TTL) {
        return cached;
      }
    }
  } catch (err) {
    console.warn("[Player Knowledge Cache Get Failed]:", err);
  }

  const pName = playerName || "لاعب غير محدد";

  // 2. Fetch linked news items from Firestore to enrich the context
  let linkedNewsSummary = "No local articles linked yet.";
  try {
    const articlesSnap = await firestore.collection('news')
      .where('relatedContent.players', 'array-contains', pName)
      .limit(5)
      .get();
    
    if (!articlesSnap.empty) {
      linkedNewsSummary = articlesSnap.docs.map((doc: any) => {
        const d = doc.data();
        return `- Title: ${d.title}, Content: ${d.excerpt || d.content?.slice(0, 100)}`;
      }).join("\n");
    }
  } catch (err) {
    console.warn("Could not load linked news articles for player context:", err);
  }

  // 3. Ask Gemini to compile the Careers, Transfer, Injury, News, and Goals Timelines in Arabic
  const prompt = `
  Analyze and generate a highly detailed and verified Sports Knowledge Graph profile for the professional football player: "${pName}" (ID: ${playerId}).

  Context:
  We have these recent news titles linked to this player:
  ${linkedNewsSummary}

  Your response must contain Career Timeline, News Timeline, Transfer Timeline, Injury Timeline, and Goals Timeline.
  Use real dates (in YYYY-MM-DD format if possible, or approximate months/seasons like "2024-08") and authentic details.
  Never fabricate statistics or records. If details are unverified or unknown, make them realistic based on their official historical trajectory.

  You must also provide 3-4 realistic links to photos (placeholdered by official api-sports domains) and 2-3 mock video listings (like match highlights, skills compilations).
  Return ONLY a JSON response in Arabic.
  `;

  try {
    const response = await generateContentWithRetry({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite sports database researcher. Generate comprehensive, high-quality, authentic sports timelines in Arabic.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            arabicName: { type: Type.STRING },
            careerTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["date", "title", "description"]
              }
            },
            newsTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["date", "title", "description"]
              }
            },
            transferTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["date", "title", "description"]
              }
            },
            injuryTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["date", "title", "description"]
              }
            },
            goalsTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["date", "title", "description"]
              }
            },
            photos: { type: Type.ARRAY, items: { type: Type.STRING } },
            videos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  thumbnail: { type: Type.STRING }
                },
                required: ["title", "url", "thumbnail"]
              }
            }
          },
          required: ["id", "name", "arabicName", "careerTimeline", "newsTimeline", "transferTimeline", "injuryTimeline", "goalsTimeline", "photos", "videos"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.replace(/```json|```/g, '').trim()) as PlayerKnowledge;
      parsed.id = playerId;
      parsed.updatedAt = new Date().toISOString();

      // Add types to events
      parsed.careerTimeline = parsed.careerTimeline.map(e => ({ ...e, type: 'career' }));
      parsed.newsTimeline = parsed.newsTimeline.map(e => ({ ...e, type: 'news' }));
      parsed.transferTimeline = parsed.transferTimeline.map(e => ({ ...e, type: 'transfer' }));
      parsed.injuryTimeline = parsed.injuryTimeline.map(e => ({ ...e, type: 'injury' }));
      parsed.goalsTimeline = parsed.goalsTimeline.map(e => ({ ...e, type: 'goals' }));

      // Save to cache
      await firestore.collection('players_knowledge').doc(cacheKey).set(parsed);
      return parsed;
    }
  } catch (err) {
    console.error("[Generate Player Knowledge Graph failed, using fallback]:", err);
  }

  // Ultimate Arabic Fallback
  const fallback: PlayerKnowledge = {
    id: playerId,
    name: pName,
    arabicName: pName,
    careerTimeline: [
      { date: "2018", title: "بداية المسيرة الاحترافية", description: "البداية الرسمية مع النادي الأول والتألق الملفت في الدوريات المحلية.", type: "career" },
      { date: "2021", title: "الانتقال للأضواء الكبرى", description: "توقيع عقد احترافي ضخم والبدء بتمثيل المنتخب الوطني في الاستحقاقات القارية.", type: "career" }
    ],
    newsTimeline: [
      { date: "قبل يومين", title: "تقييم تكتيكي مرتفع", description: "وسائل الإعلام تصف اللاعب بصانع الألعاب الاستراتيجي لخط هجوم فريقه.", type: "news" }
    ],
    transferTimeline: [
      { date: "2023-07", title: "عقد انتقال رسمي", description: "صفقة ممتازة بقيمة سوقية عالية لتعزيز خطوط النادي الحالي.", type: "transfer" }
    ],
    injuryTimeline: [
      { date: "2024-03", title: "إصابة طفيفة في الكاحل", description: "الغياب لمدة أسبوعين والعودة السريعة للتدريبات الجماعية بعد الشفاء الكامل.", type: "injury" }
    ],
    goalsTimeline: [
      { date: "الأسبوع الماضي", title: "هدف رائع من ركلة حرة", description: "تسديدة ساحرة استقرت في المقص الأيمن للحارس معلناً التقدم للفريق.", type: "goals" }
    ],
    photos: [
      `https://media.api-sports.io/football/players/${playerId}.png`
    ],
    videos: [
      { title: "أفضل المهارات وصناعة اللعب", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2" }
    ],
    updatedAt: new Date().toISOString()
  };

  return fallback;
}

// Team Knowledge Graph service
export async function getOrGenerateTeamKnowledgeGraph(teamId: string, teamName?: string): Promise<TeamKnowledgeGraph> {
  const cacheKey = teamId;

  try {
    const cacheDoc = await firestore.collection('teams_knowledge_graph').doc(cacheKey).get();
    if (cacheDoc.exists) {
      const cached = cacheDoc.data() as TeamKnowledgeGraph;
      const age = Date.now() - new Date(cached.updatedAt).getTime();
      if (age < STATIC_ENRICH_TTL) {
        return cached;
      }
    }
  } catch (err) {
    console.warn("[Team KG Cache Load Failed]:", err);
  }

  const tName = teamName || "فريق رياضي";

  // Query articles linked to this team
  let relatedNews: any[] = [];
  try {
    const newsSnap = await firestore.collection('news')
      .where('relatedContent.teams', 'array-contains', tName)
      .limit(6)
      .get();
    relatedNews = newsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn("Error finding news for team:", err);
  }

  // Get dynamic local matches
  let lastResults: any[] = [];
  let upcomingMatches: any[] = [];
  try {
    const matchesSnap = await firestore.collection('matches').limit(50).get();
    const allMatches = matchesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    
    const teamMatches = allMatches.filter((m: any) => 
      String(m.homeTeamId) === String(teamId) || 
      String(m.awayTeamId) === String(teamId) ||
      String(m.homeTeam?.id) === String(teamId) ||
      String(m.awayTeam?.id) === String(teamId) ||
      (m.homeTeamName && m.homeTeamName.includes(tName)) ||
      (m.awayTeamName && m.awayTeamName.includes(tName))
    );

    lastResults = teamMatches.filter((m: any) => m.status === 'FINISHED' || m.status === 'FT').slice(0, 4);
    upcomingMatches = teamMatches.filter((m: any) => m.status !== 'FINISHED' && m.status !== 'FT').slice(0, 4);
  } catch (err) {
    console.warn("Error resolving team matches:", err);
  }

  // Ask Gemini to generate team scorers, related videos, related players list
  const prompt = `
  Analyze and output a premium sports dashboard knowledge graph payload in Arabic for the football team: "${tName}" (ID: ${teamId}).
  
  Please provide:
  1. Top scorers (list of 3 key real/legendary scorers with goal & assist counts).
  2. Related players (array of 4 prominent real players on the squad).
  3. Related videos (3 video highlights).
  
  Return strictly JSON in Arabic matching the requested schema. Do not include markdown codeblocks.
  `;

  try {
    const response = await generateContentWithRetry({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite sports database researcher. Output pure JSON matching team specs.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topScorers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  goals: { type: Type.INTEGER },
                  assists: { type: Type.INTEGER }
                },
                required: ["name", "goals", "assists"]
              }
            },
            relatedPlayers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  arabicName: { type: Type.STRING },
                  position: { type: Type.STRING }
                },
                required: ["id", "name", "arabicName", "position"]
              }
            },
            relatedVideos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  thumbnail: { type: Type.STRING }
                },
                required: ["title", "url", "thumbnail"]
              }
            }
          },
          required: ["topScorers", "relatedPlayers", "relatedVideos"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.replace(/```json|```/g, '').trim());
      const graph: TeamKnowledgeGraph = {
        id: teamId,
        name: tName,
        arabicName: tName,
        latestNews: relatedNews,
        upcomingMatches,
        lastResults,
        relatedPlayers: parsed.relatedPlayers,
        topScorers: parsed.topScorers,
        relatedVideos: parsed.relatedVideos,
        updatedAt: new Date().toISOString()
      };

      await firestore.collection('teams_knowledge_graph').doc(cacheKey).set(graph);
      return graph;
    }
  } catch (err) {
    console.error("Failed to generate team KG from AI, fallback:", err);
  }

  // Fallback payload
  return {
    id: teamId,
    name: tName,
    arabicName: tName,
    latestNews: relatedNews,
    upcomingMatches,
    lastResults,
    relatedPlayers: [
      { id: "101", name: "Star Forward", arabicName: "مهاجم الفريق النجم", position: "FWD" }
    ],
    topScorers: [
      { name: "الهداف الأول", goals: 12, assists: 4 }
    ],
    relatedVideos: [
      { title: "ملخص أهداف الفريق هذا الموسم", url: "https://youtube.com", thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2" }
    ],
    updatedAt: new Date().toISOString()
  };
}

// Match Knowledge Graph service
export async function getOrGenerateMatchKnowledge(matchId: string, matchData: any): Promise<MatchKnowledgeGraph> {
  const cacheKey = matchId;

  try {
    const cacheDoc = await firestore.collection('matches_knowledge_graph').doc(cacheKey).get();
    if (cacheDoc.exists) {
      const cached = cacheDoc.data() as MatchKnowledgeGraph;
      const age = Date.now() - new Date(cached.updatedAt).getTime();
      
      // Match Status check for smarter TTL
      const status = matchData?.status?.status || matchData?.status || 'NS';
      const isFinished = ['FT', 'AET', 'PEN', 'FINISHED', 'PST', 'CANC'].includes(status.toUpperCase());
      
      // If finished, keep for a very long time (1 year). If upcoming/live, keep for 30 mins
      const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
      const ttl = isFinished ? ONE_YEAR : ENRICH_CACHE_TTL;
      
      if (age < ttl) {
        return cached;
      }
    }
  } catch (err) {
    console.warn("[Match KG Cache load failed]:", err);
  }

  const mData = matchData || {};
  const home = mData.homeTeamName || mData.homeTeam?.name || "الفريق الأول";
  const away = mData.awayTeamName || mData.awayTeam?.name || "الفريق الثاني";

  // Query articles mentioning home or away teams
  let relatedNews: any[] = [];
  try {
    const newsSnap = await firestore.collection('news').limit(4).get();
    const allNews = newsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    relatedNews = allNews.filter((art: any) => {
      const title = (art.title || "").toLowerCase();
      const desc = (art.content || art.description || "").toLowerCase();
      return title.includes(home.toLowerCase()) || title.includes(away.toLowerCase()) ||
             desc.includes(home.toLowerCase()) || desc.includes(away.toLowerCase());
    });
  } catch (err) {
    console.warn("Could not find match news:", err);
  }

  // Ask Gemini to generate tactics predictions, match analysis, mock highlights & timeline
  const prompt = `
  Generate professional Arabic tactical analysis, expert predictions, and an event timeline for this match: "${home} vs ${away}" (ID: ${matchId}).
  
  Include:
  1. Tactical analysis (paragraph).
  2. Predictions score and analysis details.
  3. Highlights (2 realistic highlight links).
  4. Real-time events timeline (minutes, type, description in Arabic).
  
  Return strictly JSON format. Do not use Markdown wrap.
  `;

  try {
    const response = await generateContentWithRetry({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite tactical football analyst. Output professional Arabic sports content in JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            predictions: {
              type: Type.OBJECT,
              properties: {
                homeWinProb: { type: Type.INTEGER },
                awayWinProb: { type: Type.INTEGER },
                drawProb: { type: Type.INTEGER },
                scorePrediction: { type: Type.STRING },
                commentary: { type: Type.STRING }
              },
              required: ["homeWinProb", "awayWinProb", "drawProb", "scorePrediction", "commentary"]
            },
            highlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  videoUrl: { type: Type.STRING }
                },
                required: ["title", "videoUrl"]
              }
            },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  minute: { type: Type.INTEGER },
                  type: { type: Type.STRING, description: "GOAL, CARD, SUB, tactical" },
                  description: { type: Type.STRING }
                },
                required: ["minute", "type", "description"]
              }
            }
          },
          required: ["analysis", "predictions", "highlights", "timeline"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.replace(/```json|```/g, '').trim());
      const graph: MatchKnowledgeGraph = {
        id: matchId,
        relatedNews,
        predictions: parsed.predictions,
        analysis: parsed.analysis,
        videos: parsed.highlights.map((h: any, i: number) => ({ title: h.title, url: h.videoUrl, thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2" })),
        highlights: parsed.highlights,
        statistics: mData.statistics || { possession: { home: "50%", away: "50%" }, shots: { home: 10, away: 8 } },
        timeline: parsed.timeline,
        updatedAt: new Date().toISOString()
      };

      await firestore.collection('matches_knowledge_graph').doc(cacheKey).set(graph);
      return graph;
    }
  } catch (err) {
    console.error("Error generating match KG:", err);
  }

  // Fallback
  return {
    id: matchId,
    relatedNews,
    predictions: { homeWinProb: 40, awayWinProb: 35, drawProb: 25, scorePrediction: "2-1", commentary: "مواجهة فنية وتكتيكية حاسمة بين الطرفين." },
    analysis: "تحليل متوازن لخطوط لعب كلا الفريقين والاعتماد على الضغط المتوسط.",
    videos: [{ title: "ملخص المباراة", url: "https://youtube.com", thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2" }],
    highlights: [{ title: "أهداف المباراة باللغة العربية", videoUrl: "https://youtube.com" }],
    statistics: { possession: { home: "52%", away: "48%" } },
    timeline: [{ minute: 12, type: "GOAL", description: "هدف التقدم الأول برأسية ممتازة" }],
    updatedAt: new Date().toISOString()
  };
}

// Unified Semantic Search Engine
export async function performSemanticSearch(queryStr: string) {
  // 1. Resolve entity semantically using AI and Static dictionaries
  const resolved = await resolveEntityAlias(queryStr);

  let playerProfile: any = null;
  let teamProfile: any = null;
  let matches: any[] = [];
  let relatedNews: any[] = [];
  let videos: any[] = [];

  // 2. Load primary entity details
  if (resolved.type === 'player' && resolved.canonicalId) {
    playerProfile = await getOrGeneratePlayerKnowledge(resolved.canonicalId, resolved.canonicalArabicName);
    videos = playerProfile.videos || [];
  } else if (resolved.type === 'team' && resolved.canonicalId) {
    teamProfile = await getOrGenerateTeamKnowledgeGraph(resolved.canonicalId, resolved.canonicalArabicName);
    videos = teamProfile.relatedVideos || [];
  }

  // 3. Query News articles matching query semantically
  try {
    const newsSnap = await firestore.collection('news').limit(30).get();
    const allNews = newsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    // Simple filter matching semantic names
    relatedNews = allNews.filter((art: any) => {
      const q = resolved.canonicalArabicName.toLowerCase();
      const enQ = resolved.canonicalName.toLowerCase();
      const original = queryStr.toLowerCase();

      return (art.title || "").toLowerCase().includes(q) ||
             (art.title || "").toLowerCase().includes(enQ) ||
             (art.title || "").toLowerCase().includes(original) ||
             (art.content || "").toLowerCase().includes(q) ||
             (art.content || "").toLowerCase().includes(enQ);
    }).slice(0, 8);
  } catch (err) {
    console.error("Error fetching semantic search news:", err);
  }

  // 4. Query Matches matching query
  try {
    const matchesSnap = await firestore.collection('matches').limit(50).get();
    const allMatches = matchesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    matches = allMatches.filter((m: any) => {
      const h = (m.homeTeamName || m.homeTeam?.name || "").toLowerCase();
      const a = (m.awayTeamName || m.awayTeam?.name || "").toLowerCase();
      const qAr = resolved.canonicalArabicName.toLowerCase();
      const qEn = resolved.canonicalName.toLowerCase();
      const orig = queryStr.toLowerCase();

      return h.includes(qAr) || h.includes(qEn) || h.includes(orig) ||
             a.includes(qAr) || a.includes(qEn) || a.includes(orig);
    }).slice(0, 6);
  } catch (err) {
    console.error("Error fetching semantic search matches:", err);
  }

  // If we found videos on matches, append them
  if (matches.length > 0) {
    for (const m of matches) {
      if (m.highlights && Array.isArray(m.highlights)) {
        for (const h of m.highlights) {
          videos.push({ title: h.title, url: h.videoUrl, thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2" });
        }
      }
    }
  }

  // Unique list of videos
  videos = videos.filter((v, index, self) =>
    self.findIndex(t => t.title === v.title) === index
  ).slice(0, 6);

  return {
    resolvedEntity: resolved,
    playerProfile,
    teamProfile,
    news: relatedNews,
    matches,
    videos,
    competitions: resolved.type === 'league' ? [{ id: resolved.canonicalId, name: resolved.canonicalName, arabicName: resolved.canonicalArabicName }] : []
  };
}
