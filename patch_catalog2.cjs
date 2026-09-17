const fs = require('fs');
let code = fs.readFileSync('server/catalogService.ts', 'utf-8');

const target = `  return {
    ...row,
    genres: mappedGenres.length > 0 ? mappedGenres : (row.genres || []),
    images: row.images_json,`;

const replacement = `  let mappedStudios = [];
  if (row.anime_studios && Array.isArray(row.anime_studios)) {
    mappedStudios = row.anime_studios.map(as => as.studios).filter(Boolean);
  }

  return {
    ...row,
    genres: mappedGenres.length > 0 ? mappedGenres : (row.genres || []),
    studios: mappedStudios.length > 0 ? mappedStudios : (row.studios || []),
    images: row.images_json,`;

code = code.replace(target, replacement);
fs.writeFileSync('server/catalogService.ts', code);
