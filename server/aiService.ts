import { GoogleGenAI } from "@google/genai";

const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Track quota to prevent spamming the API when rate limited
let quotaExhausted = false;
let quotaExhaustedResetTime = 0;

export async function rewriteSynopsis(originalSynopsis: string | null, title?: string): Promise<string | null> {
  if (!originalSynopsis) return null;
  
  // Quick clean up of obvious trailing credits before sending to AI (saves tokens/time)
  let cleaned = originalSynopsis
    .replace(/\s*\[Written by MAL Rewrite\]\s*/gi, '')
    .replace(/\s*\(Source:.*?\)\s*/gi, '')
    .trim();
    
  if (!cleaned) return null;
  
  const isPlaceholder = cleaned.length < 50 || cleaned.toLowerCase().includes('second season of') || cleaned.toLowerCase().includes('sequel to');
  
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
      let response;
      if (isPlaceholder && title) {
        console.log(`[AI] Synopsis for "${title}" seems like a placeholder. Searching the web for a real one...`);
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Search the internet for the plot of the anime/manga "${title}". Write an engaging, professional, and spoiler-free 2-paragraph synopsis. Do NOT include any credits, sources, notes, or references to websites. Just provide the pure synopsis text.`,
          tools: [{ googleSearch: {} }]
        });
      } else {
        const prompt = `Rewrite the following anime synopsis to be engaging, professional, and completely original. Do NOT include any credits, sources, notes, or references to websites like MyAnimeList, AniList, Crunchyroll, etc.\nJust provide the pure synopsis text.\n\nOriginal:\n${cleaned}`.trim();
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      }
      
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
