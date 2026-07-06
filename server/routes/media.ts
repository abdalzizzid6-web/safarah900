import express from "express";
import { generateContentWithRetry } from "../services/aiService";
import { Type } from "@google/genai";

const router = express.Router();

// AI Smart Tag generation route
router.post("/smart-tag", async (req, res) => {
  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: "Missing name or type parameters" });
  }

  try {
    let tags: string[] = [];

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
        Analyze the file name/metadata description of a sports media asset and generate a JSON array of highly relevant Arabic search tags.
        - File Title: "${name}"
        - Media Category: "${type}"

        Identify and generate tags for any of the following if relevant:
        1. Player Name (e.g., "ميسي", "رونالدو")
        2. Team Name (e.g., "الهلال", "ريال مدريد")
        3. Competition/League Name (e.g., "دوري أبطال أوروبا", "كأس العالم 2026")
        4. Match Context / Situation (e.g., "احتفال", "مؤتمر صحفي", "ملعب", "قميص", "ركلة جزاء")
        5. General descriptive tags in professional sports style.

        Return a JSON object containing the "tags" array. Keep tags short, punchy, and maximum of 8 tags total.
        `;

        const result = await generateContentWithRetry({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an elite sports metadata archivist for SAFARA90. You categorize football media with high precision in Arabic.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of highly specific search tags in Arabic"
                }
              },
              required: ["tags"]
            }
          }
        });

        if (result.text) {
          const parsed = JSON.parse(result.text);
          if (parsed && Array.isArray(parsed.tags)) {
            tags = parsed.tags;
          }
        }
      } catch (err: any) {
        console.warn("[AI Media Tagging Error] Falling back to basic parser:", err?.message || err);
      }
    }

    // Default static fallback tags in Arabic if Gemini is missing or fails
    if (tags.length === 0) {
      const normalized = name.toLowerCase();
      const fallbackTags = new Set<string>();
      fallbackTags.add("كرة القدم");
      fallbackTags.add(type);

      if (normalized.includes("رونالدو") || normalized.includes("ronaldo")) fallbackTags.add("كريستيانو رونالدو");
      if (normalized.includes("ميسي") || normalized.includes("messi")) fallbackTags.add("ليونيل ميسي");
      if (normalized.includes("هلال") || normalized.includes("hilal")) fallbackTags.add("نادي الهلال");
      if (normalized.includes("ريال") || normalized.includes("madrid")) fallbackTags.add("ريال مدريد");
      if (normalized.includes("ملعب") || normalized.includes("stadium")) fallbackTags.add("ملعب");
      if (normalized.includes("شعار") || normalized.includes("logo")) fallbackTags.add("شعار رسمي");
      if (normalized.includes("كأس") || normalized.includes("cup")) fallbackTags.add("كأس العالم");

      tags = Array.from(fallbackTags);
    }

    res.json({ tags });
  } catch (error: any) {
    console.error("[Media Smart Tag API Error]:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

export default router;
