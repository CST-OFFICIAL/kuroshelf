const fs = require('fs');
let content = fs.readFileSync('server/ingestionService.ts', 'utf-8');

const aggFunction = `
async function getAnilistScoresBatch(malIds: number[]): Promise<Record<number, number>> {
  if (malIds.length === 0) return {};
  try {
     const query = \`
       query ($idMals: [Int]) {
         Page(page: 1, perPage: 50) {
           media(idMal_in: $idMals, type: ANIME) {
             idMal
             averageScore
           }
         }
       }
     \`;
     const res = await fetch('https://graphql.anilist.co', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
       body: JSON.stringify({ query, variables: { idMals: malIds } })
     });
     if (res.ok) {
       const data = await res.json();
       const map = {};
       const mediaList = data?.data?.Page?.media || [];
       for (const media of mediaList) {
         if (media.idMal && media.averageScore) {
           map[media.idMal] = media.averageScore / 10;
         }
       }
       return map;
     }
  } catch (e) {}
  return {};
}
`;

content = content.replace(
  /export async function ingestAnimeList\(/,
  aggFunction + "\nexport async function ingestAnimeList("
);

content = content.replace(
  /  if \(\!isSupabaseConfigured\) return result;\n/,
  `  if (!isSupabaseConfigured) return result;

  // Pre-fetch true global ratings from Anilist to average with MAL
  const malIds = animeList.map(a => a.mal_id).filter(Boolean);
  const anilistScores = await getAnilistScoresBatch(malIds);
`
);

content = content.replace(
  /        duration: item\.duration \|\| null,\n        score: item\.score \|\| null,\n        rank: item\.rank \|\| null,/,
  `        duration: item.duration || null,
        score: (() => {
           const malScore = item.score;
           const aniScore = anilistScores[item.mal_id];
           if (malScore && aniScore) {
             return Number(((malScore + aniScore) / 2).toFixed(2));
           } else if (malScore) {
             return malScore;
           } else if (aniScore) {
             return aniScore;
           }
           return null;
        })(),
        rank: item.rank || null,`
);

fs.writeFileSync('server/ingestionService.ts', content);
