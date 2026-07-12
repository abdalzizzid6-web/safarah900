import { generateContentWithRetry } from "./aiService";
import { Type } from "@google/genai";
import { searchMediaLibrary } from "./rssScraper";

// Simple Levenshtein distance to detect title similarity
export function getTitleSimilarity(s1: string, s2: string): number {
  const clean = (s: string) => s.toLowerCase().replace(/[^\w\u0621-\u064A\s]/gi, '').replace(/\s+/g, ' ').trim();
  const a = clean(s1);
  const b = clean(s2);
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[a.length][b.length];
  const maxLength = Math.max(a.length, b.length);
  return (maxLength - distance) / maxLength;
}

// Deterministic backup classifier in case Gemini API is missing or fails
export function runFallbackClassification(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  const suggestedTags: string[] = [];
  let league = "عام";
  let country = "عالمي";
  let competition = "بطولة عامة";
  let articleType = "تقرير إخباري";
  const teams: string[] = [];
  const players: string[] = [];

  // Localized keywords mapping
  const leagueKeywords: Record<string, { league: string; tags: string[]; country: string; comp: string }> = {
    "الدوري الإسباني": { league: "الدوري الإسباني", tags: ["لا ليغا", "الليغا الإسبانية"], country: "إسبانيا", comp: "La Liga" },
    "لاليغا": { league: "الدوري الإسباني", tags: ["لا ليغا"], country: "إسبانيا", comp: "La Liga" },
    "la liga": { league: "الدوري الإسباني", tags: ["لا ليغا"], country: "إسبانيا", comp: "La Liga" },
    "الدوري الإنجليزي": { league: "الدوري الإنجليزي الممتاز", tags: ["البريميرليغ", "الدوري الإنجليزي"], country: "إنجلترا", comp: "Premier League" },
    "البريميرليغ": { league: "الدوري الإنجليزي الممتاز", tags: ["البريميرليغ"], country: "إنجلترا", comp: "Premier League" },
    "premier league": { league: "الدوري الإنجليزي الممتاز", tags: ["البريميرليغ"], country: "إنجلترا", comp: "Premier League" },
    "دوري أبطال أوروبا": { league: "دوري أبطال أوروبا", tags: ["دوري الأبطال", "ذات الأذنين"], country: "أوروبا", comp: "Champions League" },
    "champions league": { league: "دوري أبطال أوروبا", tags: ["دوري الأبطال"], country: "أوروبا", comp: "Champions League" },
    "الدوري السعودي": { league: "دوري روشن السعودي", tags: ["الدوري السعودي", "روشن"], country: "السعودية", comp: "Saudi Pro League" },
    "دوري روشن": { league: "دوري روشن السعودي", tags: ["الدوري السعودي"], country: "السعودية", comp: "Saudi Pro League" }
  };

  const teamKeywords: Record<string, string> = {
    "ريال مدريد": "ريال مدريد", "برشلونة": "برشلونة", "أتلتيكو": "أتلتيكو مدريد",
    "مانشستر سيتي": "مانشستر سيتي", "السيتي": "مانشستر سيتي", "ليفربول": "ليفربول",
    "مانشستر يونايتد": "مانشستر يونايتد", "اليونايتد": "مانشستر يونايتد", "آرسنال": "آرسنال",
    "الهلال": "الهلال السعودي", "النصر": "النصر السعودي", "الاتحاد": "الاتحاد السعودي", "الأهلي": "الأهلي السعودي",
    "الأهلي المصري": "الأهلي المصري", "الزمالك": "الزمالك المصري", "الوداد": "الوداد البيضاوي", "الرجاء": "الرجاء الرياضي"
  };

  const playerKeywords: Record<string, string> = {
    "ميسي": "ليونيل ميسي", "رونالدو": "كريستيانو رونالدو", "مبابي": "كيليان مبابي",
    "صلاح": "محمد صلاح", "هالاند": "إرلينغ هالاند", "فينيسيوس": "فينيسيوس جونيور",
    "بيلينجهام": "جود بيلينجهام", "بنزيما": "كريم بنزيما", "نيمار": "نيمار جونيور"
  };

  for (const [key, val] of Object.entries(leagueKeywords)) {
    if (text.includes(key)) {
      league = val.league;
      country = val.country;
      competition = val.comp;
      suggestedTags.push(...val.tags);
    }
  }

  for (const [key, name] of Object.entries(teamKeywords)) {
    if (text.includes(key)) {
      teams.push(name);
      suggestedTags.push(name);
    }
  }

  for (const [key, name] of Object.entries(playerKeywords)) {
    if (text.includes(key)) {
      players.push(name);
      suggestedTags.push(name);
    }
  }

  if (text.includes("عاجل") || text.includes("رسميا") || text.includes("تأكيد")) {
    articleType = "خبر عاجل";
    suggestedTags.push("عاجل");
  } else if (text.includes("ميركاتو") || text.includes("انتقال") || text.includes("صفقة")) {
    articleType = "سوق الانتقالات";
    suggestedTags.push("ميركاتو");
  }

  const finalTags = Array.from(new Set([...suggestedTags, "أخبار رياضية", "كرة القدم"]));
  const cleanSnippet = description.replace(/<[^>]*>/g, "").slice(0, 155);
  const wordsCount = description.split(/\s+/).length + title.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordsCount / 200));

  return {
    classification: { league, competition, teams, players, country, articleType, suggestedTags: finalTags.slice(0, 8) },
    seo: {
      slug: title.replace(/[^\w\u0621-\u064A\s-]/gi, '').replace(/\s+/g, '-').toLowerCase(),
      metaTitle: `${title.slice(0, 50)} | سفارة ٩٠`,
      metaDescription: cleanSnippet,
      readingTime
    },
    intelligence: {
      summaryEn: `Summary of the article: ${title}`,
      summaryAr: `خلاصة التقرير: ${title}`,
      seoHeadline: `${title} | تفاصيل الخبر الكاملة`,
      shortHeadline: title.slice(0, 30),
      difficulty: "متوسط" as const,
      importanceScore: 70,
      trendingScore: 50,
      breakingScore: text.includes("عاجل") ? 90 : 20,
      qualityScore: 80,
      qualityBreakdown: {
        originality: 80,
        completeness: 85,
        seo: 75,
        readability: 85,
        freshness: 90,
        mediaQuality: 70
      }
    },
    sportsDetection: {
      competition,
      league,
      season: "2025/2026",
      round: "الجولة الحالية",
      teams,
      players,
      coach: "غير محدد",
      country,
      stadium: "ملعب اللقاء",
      referee: "غير متوفر",
      matchDate: new Date().toISOString().split('T')[0]
    },
    imageIntel: {
      altText: title,
      caption: title,
      credit: "محرر سفارة ٩٠",
      suggestedImages: [] as string[]
    },
    aiEditor: {
      headlineSuggestions: [title, `تطورات جديدة: ${title}`, `متابعة حية: ${title}`],
      seoTitleSuggestion: `${title} - آخر الأخبار`,
      metaDescriptionSuggestion: cleanSnippet,
      slugSuggestion: title.replace(/[^\w\u0621-\u064A\s-]/gi, '').replace(/\s+/g, '-').toLowerCase(),
      keywordsSuggestion: finalTags.slice(0, 5),
      structureSuggestion: "البنية ممتازة وتغطي كافة التفاصيل الأساسية للحدث الرياضي."
    },
    translations: {
      titleEn: `Translated Title: ${title}`,
      titleAr: title,
      descriptionEn: `English translation of description: ${cleanSnippet}`,
      descriptionAr: description
    }
  };
}

// Enterprise AI Classification powered by Gemini 3.5-flash
export async function classifyArticleWithAi(title: string, description: string): Promise<any> {
  const suggestedImages = await searchMediaLibrary(title);

  if (!process.env.GEMINI_API_KEY) {
    const fallback = runFallbackClassification(title, description);
    fallback.imageIntel.suggestedImages = suggestedImages;
    return fallback;
  }

  try {
    const prompt = `
    Analyze the following sports news article and perform core classification, intelligence diagnostics, quality analysis, translations, image intelligence and AI editor formatting.
    Output details strictly in the requested JSON format. Avoid adding any markdown formatting outside the JSON block.

    Article Context:
    - Title: "${title}"
    - Full Scraped Article Content: "${description.replace(/<[^>]*>/g, "").slice(0, 12000)}"

    You MUST return a JSON object containing exactly:
    1. "classification": {
         "league": The specific league (e.g., "الدوري الإنجليزي الممتاز", "الدوري الإسباني", "دوري أبطال أوروبا", "عام") in Arabic.
         "competition": The English name of the competition or league (e.g., "Premier League", "La Liga", "UEFA Champions League", "General").
         "teams": List of named football teams mentioned (e.g. ["ريال مدريد", "ليفربول"]).
         "players": List of named football players mentioned (e.g. ["محمد صلاح", "كيليان mbappe"]).
         "country": Country associated with this news in Arabic (e.g., "إسبانيا", "إنجلترا", "مصر", "عالمي").
         "articleType": Type of news article (e.g., "تقرير إخباري", "خبر عاجل", "سوق الانتقالات", "تحليل تكتيكي", "حوار صحفي").
         "suggestedTags": List of up to 6 Arabic tags.
       }
    2. "seo": {
         "slug": A URL friendly Arabic/English slug.
         "metaTitle": SEO friendly meta title in Arabic (maximum 65 chars).
         "metaDescription": SEO meta description in Arabic summarizing the news (maximum 160 chars).
         "readingTime": Estimated reading time in minutes (integer).
       }
    3. "intelligence": {
         "summaryEn": High quality Executive Summary of the article in English.
         "summaryAr": Engaging Arabic summary/executive brief of the article.
         "seoHeadline": Highly engaging, SEO optimized headline in Arabic.
         "shortHeadline": Suggested short punchy headline (maximum 5 words) in Arabic.
         "difficulty": Reading level difficulty in Arabic (must be exactly "مبتدئ" or "متوسط" or "متقدم").
         "importanceScore": Rating of news importance from 1 to 100 (integer).
         "trendingScore": Rating of trending potential from 1 to 100 (integer).
         "breakingScore": Rating of breaking urgency from 1 to 100 (integer).
         "qualityScore": Overall calculated quality score (1 to 100).
         "qualityBreakdown": {
           "originality": score 1-100,
           "completeness": score 1-100,
           "seo": score 1-100,
           "readability": score 1-100,
           "freshness": score 1-100,
           "mediaQuality": score 1-100
         }
       }
    4. "sportsDetection": {
         "competition": Arabic competition name,
         "league": Arabic league name,
         "season": e.g. "2025/2026",
         "round": League round if mentioned or "غير محدد",
         "teams": List of teams mentioned,
         "players": List of players mentioned,
         "coach": Coach name if mentioned or "غير محدد",
         "country": Arabic country name,
         "stadium": Stadium name if mentioned or "غير محدد",
         "referee": Referee name if mentioned or "غير محدد",
         "matchDate": Approximate Match Date (YYYY-MM-DD format) or "غير محدد"
       }
    5. "imageIntel": {
         "altText": SEO friendly Alt Text for article featured image,
         "caption": Meaningful image caption,
         "credit": Image copyright or source credit
       }
    6. "aiEditor": {
         "headlineSuggestions": List of 3 alternative click-worthy headlines in Arabic,
         "seoTitleSuggestion": Suggested SEO Title in Arabic,
         "metaDescriptionSuggestion": Suggested Meta Description,
         "slugSuggestion": Suggested URL slug,
         "keywordsSuggestion": List of 5 SEO keywords,
         "structureSuggestion": Structural feedback on paragraph layout, flow, and statistics.
       }
    7. "translations": {
         "titleEn": English translation of the title,
         "titleAr": Polished Arabic title,
         "descriptionEn": English translation of the description summary,
         "descriptionAr": Complete, full news article beautifully rewritten in professional sports journalism style in Arabic. Write the entire article content in full, keeping all tactical details, quotes, stats, and background info. DO NOT truncate or summarize it. DO NOT mention the source name (such as Hespress, Kooora, FilGoal, Yallakora) anywhere in the body, headings, or title. Let it read like a direct neutral report from our desk. We will append the source name at the end of the article.
       }
    `;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite AI sports journalist and SEO expert trained in sports taxonomy, executive briefing, Arabic copywriting, translation, and media analysis.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: {
              type: Type.OBJECT,
              properties: {
                league: { type: Type.STRING },
                competition: { type: Type.STRING },
                teams: { type: Type.ARRAY, items: { type: Type.STRING } },
                players: { type: Type.ARRAY, items: { type: Type.STRING } },
                country: { type: Type.STRING },
                articleType: { type: Type.STRING },
                suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["league", "competition", "teams", "players", "country", "articleType", "suggestedTags"]
            },
            seo: {
              type: Type.OBJECT,
              properties: {
                slug: { type: Type.STRING },
                metaTitle: { type: Type.STRING },
                metaDescription: { type: Type.STRING },
                readingTime: { type: Type.INTEGER }
              },
              required: ["slug", "metaTitle", "metaDescription", "readingTime"]
            },
            intelligence: {
              type: Type.OBJECT,
              properties: {
                summaryEn: { type: Type.STRING },
                summaryAr: { type: Type.STRING },
                seoHeadline: { type: Type.STRING },
                shortHeadline: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                importanceScore: { type: Type.INTEGER },
                trendingScore: { type: Type.INTEGER },
                breakingScore: { type: Type.INTEGER },
                qualityScore: { type: Type.INTEGER },
                qualityBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    originality: { type: Type.INTEGER },
                    completeness: { type: Type.INTEGER },
                    seo: { type: Type.INTEGER },
                    readability: { type: Type.INTEGER },
                    freshness: { type: Type.INTEGER },
                    mediaQuality: { type: Type.INTEGER }
                  },
                  required: ["originality", "completeness", "seo", "readability", "freshness", "mediaQuality"]
                }
              },
              required: ["summaryEn", "summaryAr", "seoHeadline", "shortHeadline", "difficulty", "importanceScore", "trendingScore", "breakingScore", "qualityScore", "qualityBreakdown"]
            },
            sportsDetection: {
              type: Type.OBJECT,
              properties: {
                competition: { type: Type.STRING },
                league: { type: Type.STRING },
                season: { type: Type.STRING },
                round: { type: Type.STRING },
                teams: { type: Type.ARRAY, items: { type: Type.STRING } },
                players: { type: Type.ARRAY, items: { type: Type.STRING } },
                coach: { type: Type.STRING },
                country: { type: Type.STRING },
                stadium: { type: Type.STRING },
                referee: { type: Type.STRING },
                matchDate: { type: Type.STRING }
              },
              required: ["competition", "league", "season", "round", "teams", "players", "coach", "country", "stadium", "referee", "matchDate"]
            },
            imageIntel: {
              type: Type.OBJECT,
              properties: {
                altText: { type: Type.STRING },
                caption: { type: Type.STRING },
                credit: { type: Type.STRING }
              },
              required: ["altText", "caption", "credit"]
            },
            aiEditor: {
              type: Type.OBJECT,
              properties: {
                headlineSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                seoTitleSuggestion: { type: Type.STRING },
                metaDescriptionSuggestion: { type: Type.STRING },
                slugSuggestion: { type: Type.STRING },
                keywordsSuggestion: { type: Type.ARRAY, items: { type: Type.STRING } },
                structureSuggestion: { type: Type.STRING }
              },
              required: ["headlineSuggestions", "seoTitleSuggestion", "metaDescriptionSuggestion", "slugSuggestion", "keywordsSuggestion", "structureSuggestion"]
            },
            translations: {
              type: Type.OBJECT,
              properties: {
                titleEn: { type: Type.STRING },
                titleAr: { type: Type.STRING },
                descriptionEn: { type: Type.STRING },
                descriptionAr: { type: Type.STRING }
              },
              required: ["titleEn", "titleAr", "descriptionEn", "descriptionAr"]
            }
          },
          required: ["classification", "seo", "intelligence", "sportsDetection", "imageIntel", "aiEditor", "translations"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        ...parsed,
        imageIntel: {
          ...parsed.imageIntel,
          suggestedImages
        }
      };
    }
    throw new Error("Empty response text from Gemini");
  } catch (err: any) {
    console.error(`[AI Classification Failure] Falling back to deterministic parsing: ${err.message}`);
    const fallback = runFallbackClassification(title, description);
    fallback.imageIntel.suggestedImages = suggestedImages;
    return fallback;
  }
}
