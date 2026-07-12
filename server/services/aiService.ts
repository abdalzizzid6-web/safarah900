
import { GoogleGenAI, Type } from "@google/genai";

let _ai: GoogleGenAI | null = null;
let isQuotaExceeded = false;
let quotaResetTime = 0;

export const getAi = () => {
  if (Date.now() < quotaResetTime) {
      throw new Error("AI Quota limit active, waiting for reset.");
  }
  if (!_ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    _ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return _ai;
};

export async function generateContentWithRetry(params: {
  model: string;
  contents: any;
  config?: any;
}, maxRetries = 3) {
  if (isQuotaExceeded && Date.now() < quotaResetTime) {
      throw new Error("AI Quota limit active, waiting for reset.");
  }
  
  const ai = getAi();
  
  // Create a comprehensive fallback cascade strategy
  const modelCandidates = [params.model];
  
  // Robust pool of fallback models in optimal order of free-tier quotas and reliability
  const pool = ["gemini-3.5-flash", "gemini-3.1-pro-preview"];
  for (const candidate of pool) {
    if (candidate !== params.model) {
      modelCandidates.push(candidate);
    }
  }

  // Deduplicate candidates
  const uniqueModels = Array.from(new Set(modelCandidates));
  let lastError: any = null;

  for (let i = 0; i < uniqueModels.length; i++) {
    const modelName = uniqueModels[i];
    let delay = 1000; // start with 1 second backoff
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config
        });
        
        isQuotaExceeded = false; // Reset on success
        return response;
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || String(error);
        const isQuotaLimit = errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("limit exceeded") || errorMessage.includes("limit: ");
        const isRateLimit = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || isQuotaLimit;
        
        if (isRateLimit) {
            isQuotaExceeded = true;
            quotaResetTime = Date.now() + 60 * 60 * 1000; // Block for 1 hour
            console.warn(`[AI Service] Quota limit hit. Blocking AI calls for 1 hour.`);
            throw error; // Propagate to let caller handle
        }

        const isServerUnavailable = errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("demand");
        
        console.warn(`[AI Service] Model ${modelName} failed (attempt ${attempt + 1}): ${errorMessage}`);
        
        if (isServerUnavailable) {
          // If the model experiences high demand, immediately try the next model without wasting latency
          break;
        }

        if (attempt < maxRetries - 1) {
          const jitter = Math.random() * 500;
          const backoffTime = delay + jitter;
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
          delay *= 2; // exponential backoff
        } else {
          // If it's a non-transient error or we are out of model retries, proceed to the next candidate model
          break;
        }
      }
    }
  }

  throw lastError || new Error(`All available content generators are busy at the moment.`);
}
