const fs = require('fs');
let code = fs.readFileSync('server/catalogService.ts', 'utf-8');

code = code.split(`'*, anime_genres(genres(*)), anime_studios(studios(*))'`).join(`'*, anime_genres(genres(*)), anime_studios(studios(*)), anime_streaming(url, streaming_providers(name))'`);
code = code.split(`'*, anime_genres!inner(genres!inner(*)), anime_studios(studios(*))'`).join(`'*, anime_genres!inner(genres!inner(*)), anime_studios(studios(*)), anime_streaming(url, streaming_providers(name))'`);

const targetMap = `  return {
    ...row,
    genres: mappedGenres.length > 0 ? mappedGenres : (row.genres || []),
    studios: mappedStudios.length > 0 ? mappedStudios : (row.studios || []),
    images: row.images_json,`;

const replacementMap = `  let mappedStreaming = [];
  if (row.anime_streaming && Array.isArray(row.anime_streaming)) {
    mappedStreaming = row.anime_streaming.map(as => ({
      name: as.streaming_providers?.name || 'Unknown',
      url: as.url
    })).filter(Boolean);
  }

  return {
    ...row,
    genres: mappedGenres.length > 0 ? mappedGenres : (row.genres || []),
    studios: mappedStudios.length > 0 ? mappedStudios : (row.studios || []),
    streaming: mappedStreaming.length > 0 ? mappedStreaming : (row.streaming || []),
    images: row.images_json,`;

code = code.replace(targetMap, replacementMap);

fs.writeFileSync('server/catalogService.ts', code);
