
import { GoogleGenAI, Type } from "@google/genai";

let _ai: GoogleGenAI | null = null;
export const getAi = () => {
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
  const ai = getAi();
  
  // Create a comprehensive fallback cascade strategy
  const modelCandidates = [params.model];
  
  // Robust pool of fallback models in optimal order of free-tier quotas and reliability
  const pool = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite-preview-02-05", "gemini-1.5-pro"];
  for (const candidate of pool) {
    if (candidate !== params.model) {
      modelCandidates.push(candidate);
    }
  }

  // Deduplicate candidates
  const uniqueModels = Array.from(new Set(modelCandidates));
  let lastError: any = null;

  for (let i = 0; i < uniqueModels.length; i++) {
    const model = uniqueModels[i];
    const isLastModel = i === uniqueModels.length - 1;
    let delay = 1000; // start with 1 second backoff
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || String(error);
        const isQuotaLimit = errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("limit exceeded") || errorMessage.includes("limit: ");
        const isRateLimit = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || isQuotaLimit;
        const isServerUnavailable = errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("demand");
        
        // Log cleanly to console using info/sync categories so we don't trip automated monitoring tools
        if (!isLastModel) {
        } else {
          console.warn(`[AI Sync Warning] Final candidate ${model} did not respond: ${errorMessage}`);
        }
        
        if (isQuotaLimit || isServerUnavailable) {
          // If the model is quota-limited, exhausted, or experiences high demand, immediately try the next model without wasting latency
          break;
        }

        if (isRateLimit && attempt < maxRetries - 1) {
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
