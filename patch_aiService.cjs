const fs = require('fs');
let code = fs.readFileSync('server/aiService.ts', 'utf-8');

code = code.replace(
  'export async function rewriteSynopsis(originalSynopsis: string | null): Promise<string | null> {',
  'export async function rewriteSynopsis(originalSynopsis: string | null, title?: string): Promise<string | null> {'
);

const newLogic = `
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
        console.log(\`[AI] Synopsis for "\${title}" seems like a placeholder. Searching the web for a real one...\`);
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: \`Search the internet for the plot of the anime/manga "\${title}". Write an engaging, professional, and spoiler-free 2-paragraph synopsis. Do NOT include any credits, sources, notes, or references to websites. Just provide the pure synopsis text.\`,
          tools: [{ googleSearch: {} }]
        });
      } else {
        const prompt = \`Rewrite the following anime synopsis to be engaging, professional, and completely original. Do NOT include any credits, sources, notes, or references to websites like MyAnimeList, AniList, Crunchyroll, etc.\\nJust provide the pure synopsis text.\\n\\nOriginal:\\n\${cleaned}\`.trim();
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      }
      
      return response.text?.trim() || cleaned;
`;

code = code.replace(/if \(\!ai\) \{[\s\S]*?return response\.text\?\.trim\(\) \|\| cleaned;/m, newLogic.trim());

fs.writeFileSync('server/aiService.ts', code);
console.log("Patched aiService.ts");
