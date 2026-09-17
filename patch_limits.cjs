const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/getTopAnime\('airing', \d+\)/, "getTopAnime('airing', 24)");
code = code.replace(/getSeasonalAnime\(\d+\)/, "getSeasonalAnime(24)");
code = code.replace(/getTopAnime\('bypopularity', \d+\)/, "getTopAnime('bypopularity', 24)");
code = code.replace(/getUpcomingAnime\(\d+\)/, "getUpcomingAnime(24)");

fs.writeFileSync('src/App.tsx', code);
console.log("Patched API limits");
