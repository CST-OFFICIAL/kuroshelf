const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/anime_genres!inner\(genres!inner\(name\)\)/g, 'anime_genres!inner(genres!inner(name)), anime_studios(studios(name))');

const targetMap = `           res.json({ success: true, data: safeData.map(item => {
             const cleaned = { ...item };
             delete cleaned.anime_genres;
             cleaned.images = cleaned.images_json;
             return cleaned;
           })});`;

const replacementMap = `           res.json({ success: true, data: safeData.map(item => {
             const cleaned = { ...item };
             delete cleaned.anime_genres;
             delete cleaned.anime_studios;
             cleaned.images = cleaned.images_json;
             if (item.anime_studios && Array.isArray(item.anime_studios)) {
               cleaned.studios = item.anime_studios.map(as => as.studios).filter(Boolean);
             }
             return cleaned;
           })});`;
           
code = code.replace(targetMap, replacementMap);

fs.writeFileSync('server.ts', code);
