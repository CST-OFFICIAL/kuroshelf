const fs = require('fs');
let code = fs.readFileSync('server/catalogService.ts', 'utf-8');

const target = `  if (data) {
    return { data: mapDbToAnime(data) as any };
  }`;

const replacement = `  if (data) {
    let mapped = mapDbToAnime(data);
    // If streaming is missing, try to fetch it live from Jikan to backfill
    if (!mapped.streaming || mapped.streaming.length === 0) {
      try {
        const jikanRes = await jikanGetById(id);
        if (jikanRes && jikanRes.streaming && jikanRes.streaming.length > 0) {
           mapped.streaming = jikanRes.streaming;
           // Fire and forget ingestion update
           ingestAnimeList([jikanRes]).catch(() => {});
        }
      } catch (e) {}
    }
    return { data: mapped as any };
  }`;

code = code.replace(target, replacement);
fs.writeFileSync('server/catalogService.ts', code);
