const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const targetCall = `       const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, anilistType, options.status, options.orderBy);`;
const replacementCall = `       const anilistData = await searchAnilistFallback(clean, page, limit, options.genres, anilistType, options.status, options.orderBy, options.type);`;

if (code.includes(targetCall)) {
  code = code.replace(targetCall, replacementCall);
  fs.writeFileSync('server/jikanService.ts', code);
  console.log("Patched caller");
} else {
  console.log("Could not find caller");
}
