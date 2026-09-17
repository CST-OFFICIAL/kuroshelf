const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.split(`'*, anime_genres!inner(genres!inner(name)), anime_studios(studios(name))'`).join(`'*, anime_genres!inner(genres!inner(name)), anime_studios(studios(name)), anime_streaming(url, streaming_providers(name))'`);

const targetMap = `             delete cleaned.anime_genres;
             delete cleaned.anime_studios;
             cleaned.images = cleaned.images_json;
             if (item.anime_studios && Array.isArray(item.anime_studios)) {
               cleaned.studios = item.anime_studios.map(as => as.studios).filter(Boolean);
             }`;
             
const replacementMap = `             delete cleaned.anime_genres;
             delete cleaned.anime_studios;
             cleaned.images = cleaned.images_json;
             if (item.anime_studios && Array.isArray(item.anime_studios)) {
               cleaned.studios = item.anime_studios.map(as => as.studios).filter(Boolean);
             }
             if (item.anime_streaming && Array.isArray(item.anime_streaming)) {
               cleaned.streaming = item.anime_streaming.map(as => ({
                 name: as.streaming_providers?.name || 'Unknown',
                 url: as.url
               })).filter(Boolean);
             }
             delete cleaned.anime_streaming;`;

code = code.replace(targetMap, replacementMap);

fs.writeFileSync('server.ts', code);
