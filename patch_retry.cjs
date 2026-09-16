const fs = require('fs');
let content = fs.readFileSync('server/aiService.ts', 'utf-8');

const newLogic = `
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const prompt = \`
Rewrite the following anime synopsis to be engaging, professional, and completely original. 
Do NOT include any credits, sources, notes, or references to websites like MyAnimeList, AniList, Crunchyroll, etc.
Just provide the pure synopsis text.

Original:
\${cleaned}
      \`.trim();

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });
      
      return response.text?.trim() || cleaned;
    } catch (error: any) {
      attempt++;
      if (error?.status === 503 || error?.status === 429 || error?.message?.includes('503') || error?.message?.includes('429')) {
         if (attempt >= maxRetries) {
            console.log(\`[AI] Synopsis rewrite failed after \${maxRetries} attempts:\`, error.message || error);
            return cleaned;
         }
         // Exponential backoff: 1s, 2s, 4s
         const backoff = Math.pow(2, attempt - 1) * 1000;
         console.log(\`[AI] API overloaded (Attempt \${attempt}), retrying in \${backoff}ms...\`);
         await new Promise(res => setTimeout(res, backoff));
      } else {
         console.log('[AI] Synopsis rewrite failed:', error.message || error);
         return cleaned;
      }
    }
  }
  return cleaned;
`;

const replaceRegex = /  try \{\s+const prompt = `[\s\S]*?return cleaned;\s+\}/;
content = content.replace(replaceRegex, newLogic.trim());
fs.writeFileSync('server/aiService.ts', content);
