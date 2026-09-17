const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `const { data, error } = await query.order('score', { ascending: false, nullsFirst: false }).limit(100);
        
        if (!error && data && data.length > 0) {
           res.json({ success: true, data: data.map(item => {
             const cleaned = { ...item };
             delete cleaned.anime_genres;
             cleaned.images = cleaned.images_json;
             return cleaned;
           })});
           return;
        }`;

const replacement = `const { data, error } = await query.order('score', { ascending: false, nullsFirst: false }).limit(250);
        
        if (!error && data && data.length > 0) {
           // Post-filter to ensure NO adult content slips through regardless of rating
           const safeData = data.filter(item => {
             if (item.rating && item.rating.includes('Rx')) return false;
             if (item.rating && item.rating.includes('Hentai')) return false;
             
             // Check if it has any hentai/erotica genres
             if (item.anime_genres && Array.isArray(item.anime_genres)) {
               for (const ag of item.anime_genres) {
                 const gName = ag.genres?.name?.toLowerCase() || '';
                 if (gName.includes('hentai') || gName.includes('erotica') || gName.includes('adult cast')) {
                   return false;
                 }
               }
             }
             return true;
           }).slice(0, 100);

           res.json({ success: true, data: safeData.map(item => {
             const cleaned = { ...item };
             delete cleaned.anime_genres;
             cleaned.images = cleaned.images_json;
             return cleaned;
           })});
           return;
        }`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
