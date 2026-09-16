import { GoogleGenAI } from "@google/genai";

const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Track quota to prevent spamming the API when rate limited
let quotaExhausted = false;
let quotaExhaustedResetTime = 0;

export async function rewriteSynopsis(originalSynopsis: string | null): Promise<string | null> {
  if (!originalSynopsis) return null;
  
  // Quick clean up of obvious trailing credits before sending to AI (saves tokens/time)
  let cleaned = originalSynopsis
    .replace(/\s*\[Written by MAL Rewrite\]\s*/gi, '')
    .replace(/\s*\(Source:.*?\)\s*/gi, '')
    .trim();
    
  if (!cleaned) return null;
  
  if (!ai) {
     return cleaned; // Fallback to basic clean if no AI key
  }

  // If we are currently rate limited, skip AI and just return the cleaned text
  if (quotaExhausted && Date.now() < quotaExhaustedResetTime) {
     return cleaned;
  } else if (quotaExhausted && Date.now() >= quotaExhaustedResetTime) {
     quotaExhausted = false;
  }

  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const prompt = `Rewrite the following anime synopsis to be engaging, professional, and completely original. 
Do NOT include any credits, sources, notes, or references to websites like MyAnimeList, AniList, Crunchyroll, etc.
Just provide the pure synopsis text.

Original:
${cleaned}
      `.trim();

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });
      
      return response.text?.trim() || cleaned;
    } catch (error: any) {
      attempt++;
      
      const isQuotaExceeded = error?.status === 'RESOURCE_EXHAUSTED' || error?.status === 429 || error?.message?.includes('429');
      const isOverloaded = error?.status === 503 || error?.message?.includes('503');

      if (isQuotaExceeded) {
         quotaExhausted = true;
         // Try to parse how long we should wait (e.g., "retry in 43s"), default to 60 seconds
         let delayMs = 60000;
         const retryMatch = error?.message?.match(/retry in (\d+\.?\d*)s/);
         if (retryMatch && retryMatch[1]) {
             delayMs = parseFloat(retryMatch[1]) * 1000 + 2000; // Add 2s buffer
         }
         quotaExhaustedResetTime = Date.now() + delayMs;
         
         // Using a friendly log message so the platform doesn't think the app crashed
         console.log('[AI] Free tier API limit reached temporarily. Falling back to basic cleaning for now.');
         return cleaned;
      }
      
      if (isOverloaded) {
         if (attempt >= maxRetries) {
            console.log('[AI] API still busy. Falling back to basic cleaning.');
            return cleaned;
         }
         const backoff = Math.pow(2, attempt) * 1000;
         await new Promise(res => setTimeout(res, backoff));
      } else {
         console.log('[AI] API unavailable. Falling back to basic cleaning.');
         return cleaned;
      }
    }
  }
  return cleaned;
}
