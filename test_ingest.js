const { ingestAnimeList } = require('./dist/server/ingestionService.js');
const { serverGetAnimeDetails } = require('./dist/server/jikanService.js');
(async () => {
  const data = await serverGetAnimeDetails(52299);
  if (data) {
    console.log("Got data, ingesting...");
    await ingestAnimeList([data]);
    console.log("Ingested");
  } else {
    console.log("No data");
  }
})();
