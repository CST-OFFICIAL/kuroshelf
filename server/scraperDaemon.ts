import { serverGetTopAnime, serverGetSeasonalAnime, serverGetUpcomingAnime } from './jikanService';
import { ingestAnimeList } from './ingestionService';

// This will run in the background 24/7 to slowly pull data and make the DB independent
export function startBackgroundScraper() {
  console.log('[Scraper] Background ingestion daemon started. Pulling latest data every 30 minutes...');
  
  const runTasks = async () => {
    try {
      console.log('[Scraper] Fetching top anime...');
      const top = await serverGetTopAnime('bypopularity', 1, 25);
      if (top.data) await ingestAnimeList(top.data as any);
      
      console.log('[Scraper] Fetching seasonal anime...');
      const seasonal = await serverGetSeasonalAnime(1, 25);
      if (seasonal.data) await ingestAnimeList(seasonal.data as any);

      console.log('[Scraper] Fetching upcoming anime...');
      const upcoming = await serverGetUpcomingAnime(1, 25);
      if (upcoming.data) await ingestAnimeList(upcoming.data as any);

      console.log('[Scraper] Hourly batch complete.');
    } catch (error) {
      console.log('[Error suppressed]', '[Scraper] Error in background task:', error);
    }
  };

  // Run once on startup after 10s
  setTimeout(runTasks, 10000);

  // Then run every 30 minutes
  setInterval(runTasks, 30 * 60 * 1000);
}
