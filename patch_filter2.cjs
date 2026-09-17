const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `// Check if it has any hentai/erotica genres
             if (item.anime_genres && Array.isArray(item.anime_genres)) {
               for (const ag of item.anime_genres) {
                 const gName = ag.genres?.name?.toLowerCase() || '';
                 if (gName.includes('hentai') || gName.includes('erotica') || gName.includes('adult cast')) {
                   return false;
                 }
               }
             }`;

const replacement = `// Check if it has any hentai/erotica genres
             if (item.anime_genres && Array.isArray(item.anime_genres)) {
               for (const ag of item.anime_genres) {
                 const gName = ag.genres?.name?.toLowerCase() || '';
                 if (gName.includes('hentai') || gName.includes('erotica') || gName.includes('adult cast')) {
                   return false;
                 }
               }
             }
             if (item.genres && Array.isArray(item.genres)) {
               for (const g of item.genres) {
                 const gName = (g.name || '').toLowerCase();
                 if (gName.includes('hentai') || gName.includes('erotica') || gName.includes('adult cast')) {
                   return false;
                 }
               }
             }`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
