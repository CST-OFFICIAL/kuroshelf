import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(/console\.warn\('\[API \/api\/anime\/search\] Error:', err\);/g, "// console.warn('[API /api/anime/search] Search unavailable:', err.message || err);");
content = content.replace(/console\.warn\('\[API \/api\/anime\/top\] Error:', err\);/g, "// console.warn('[API /api/anime/top] Fetch unavailable:', err.message || err);");
content = content.replace(/console\.warn\('\[API \/api\/anime\/seasonal\] Error:', err\);/g, "// console.warn('[API /api/anime/seasonal] Fetch unavailable:', err.message || err);");
content = content.replace(/console\.warn\('\[API \/api\/anime\/upcoming\] Error:', err\);/g, "// console.warn('[API /api/anime/upcoming] Fetch unavailable:', err.message || err);");
content = content.replace(/console\.warn\('\[API \/api\/anime\/genres\] Error:', err\);/g, "// console.warn('[API /api/anime/genres] Fetch unavailable:', err.message || err);");
content = content.replace(/console\.warn\('\[API \/api\/manga\/top\] Error:', err\);/g, "// console.warn('[API /api/manga/top] Fetch unavailable:', err.message || err);");
content = content.replace(/console\.warn\('\[API \/api\/manga\/search\] Error:', err\);/g, "// console.warn('[API /api/manga/search] Fetch unavailable:', err.message || err);");

fs.writeFileSync('server.ts', content);
