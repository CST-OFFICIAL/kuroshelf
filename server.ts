import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { getUserBookmarks, upsertBookmark, deleteBookmark, getUserLikes, toggleLike, getUserRatings, setRating, removeRating, getPolls, votePoll } from './server/db';
import {
  getCatalogTopAnime,
  searchCatalogAnime,
  getCatalogAnimeById
} from './server/catalogService';
import { runIngestionJob } from './server/ingestionService';
import { startBackgroundScraper } from './server/scraperDaemon';
import { supabase, isSupabaseConfigured } from './server/supabase';
import {
  serverGetSeasonalAnime,
  serverGetTopAnime,
  serverGetUpcomingAnime,
  serverGetAnimeCharacters,
  serverGetAnimeGenres,
  serverGetTopManga,
  serverSearchManga,
} from './server/jikanService';

// Extend Express Request type with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: { id: string, email?: string, raw_user_meta_data?: any } | null;
  voterHash?: string;
}

async function startServer() {
  // Initialize Database schemas & seeds

  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.get('/api/ping', (req, res) => res.send('pong'));

  // Security & Voter-Hash Middleware
  app.use(async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    // Generate an anonymous device/IP voter hash for rate limiting & guest voting
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    req.voterHash = crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');

    // Extract auth token from cookie or Authorization header
    const token = req.cookies?.kuro_token || req.headers.authorization?.replace(/^Bearer\s+/, '');
    if (token) {
      const { data } = await import('./server/supabase').then(m => m.supabase.auth.getUser(token));
      req.user = data.user ? { id: data.user.id, email: data.user.email, raw_user_meta_data: data.user.user_metadata } : null;
    } else {
      req.user = null;
    }
    next();
  });

  // Strict Auth Guard Middleware
  function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    next();
  }

  // ---------------- Health Check ----------------
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'kuroshelf-api',
      timestamp: new Date().toISOString(),
    });
  });

  // ---------------- Admin / Synchronization ----------------
  app.post('/api/admin/sync', (req: Request, res: Response) => {
    const type = req.query.type as string; // 'popular', 'airing', 'upcoming', 'all'
    const pages = Number(req.query.pages) || 1;

    let urls: string[] = [];
    if (type === 'popular') urls.push('/top/anime?filter=bypopularity');
    if (type === 'airing') urls.push('/top/anime?filter=airing');
    if (type === 'upcoming') urls.push('/top/anime?filter=upcoming');
    if (type === 'all' || !type) {
      urls = [
        '/top/anime?filter=bypopularity',
        '/top/anime?filter=airing',
        '/top/anime?filter=upcoming'
      ];
    }

    res.json({ success: true, message: `Sync started for ${urls.length} jobs` });

    // Run async
    (async () => {
      for (const url of urls) {
        await runIngestionJob(url.includes('airing') ? 'airing' : url.includes('upcoming') ? 'upcoming' : 'popular', url, pages);
      }
    })().catch(e => console.error('Sync job failed:', e));
  });

  // ---------------- Personal Shelf / Bookmarks ----------------

  // Get Shelf Items
  app.get('/api/shelf', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.json({ success: true, data: [] });
      return;
    }
    try {
      const items = await getUserBookmarks(req.user.id);
      res.json({ success: true, data: items });
    } catch (err) {
      console.error('[Shelf GET] Error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to retrieve shelf' });
    }
  });

  // Upsert Shelf Item
  app.post('/api/shelf', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { mediaId, mediaType, title, imageUrl, status, progress, totalEpisodes, notes } = req.body || {};

    if (!mediaId || typeof mediaId !== 'number') {
      res.status(400).json({ success: false, error: 'Valid media ID is required' });
      return;
    }
    if (mediaType !== 'anime' && mediaType !== 'manga') {
      res.status(400).json({ success: false, error: 'mediaType must be anime or manga' });
      return;
    }
    if (!title || typeof title !== 'string') {
      res.status(400).json({ success: false, error: 'Title is required' });
      return;
    }

    try {
      const record = await upsertBookmark({
        userId: req.user!.id,
        mediaId,
        mediaType,
        title: title.trim(),
        imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
        status,
        progress: typeof progress === 'number' ? progress : undefined,
        totalEpisodes: typeof totalEpisodes === 'number' ? totalEpisodes : undefined,
        notes: typeof notes === 'string' ? notes : undefined,
      });

      res.json({ success: true, data: record });
    } catch (err) {
      console.error('[Shelf Upsert] Error:', err);
      res.status(500).json({ success: false, error: 'Failed to update shelf item' });
    }
  });

  // Remove from Shelf
  app.delete('/api/shelf/:mediaType/:mediaId', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const mediaId = Number(req.params.mediaId);
    const mediaType = req.params.mediaType as 'anime' | 'manga';

    if (isNaN(mediaId) || (mediaType !== 'anime' && mediaType !== 'manga')) {
      res.status(400).json({ success: false, error: 'Invalid parameters' });
      return;
    }

    try {
      await deleteBookmark(req.user!.id, mediaId, mediaType);
      res.json({ success: true, message: 'Removed from shelf' });
    } catch (err) {
      console.error('[Shelf Delete] Error:', err);
      res.status(500).json({ success: false, error: 'Failed to remove shelf item' });
    }
  });

  // ---------------- Likes ----------------

  app.get('/api/likes', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.json({ success: true, data: [] });
      return;
    }
    const likes = await getUserLikes(req.user.id);
    res.json({ success: true, data: likes });
  });

  app.post('/api/likes/toggle', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { mediaId, mediaType, title, imageUrl } = req.body || {};
    if (!mediaId || typeof mediaId !== 'number' || (mediaType !== 'anime' && mediaType !== 'manga')) {
      res.status(400).json({ success: false, error: 'Valid mediaId and mediaType required' });
      return;
    }
    const result = await toggleLike(req.user!.id, mediaId, mediaType, title || 'Unknown Title', imageUrl);
    res.json({ success: true, liked: result.liked });
  });

  // ---------------- Ratings ----------------

  app.get('/api/ratings/leaderboard', async (req: Request, res: Response): Promise<void> => {
    try {
      const { getTopCommunityAnime } = await import('./server/db');
      const { serverGetAnimeById } = await import('./server/jikanService');
      const topIds = await getTopCommunityAnime(24);
      
      // Fetch details for each from jikan (could be slow if not cached, but we'll try)
      const results = [];
      for (const item of topIds) {
        const details = await serverGetAnimeById(item.id);
        if (details) {
          results.push({
            ...details,
            score: item.score, // Override with our score
            scored_by: item.count
          });
        }
      }
      res.json({ success: true, data: results });
    } catch(err) {
      console.error(err);
      res.status(500).json({ success: false, data: [] });
    }
  });

  app.get('/api/ratings/community/:mediaType/:mediaId', async (req: Request, res: Response): Promise<void> => {
    const mediaId = Number(req.params.mediaId);
    const mediaType = req.params.mediaType as 'anime' | 'manga';
    if (isNaN(mediaId) || (mediaType !== 'anime' && mediaType !== 'manga')) {
      res.status(400).json({ success: false, error: 'Invalid parameters' });
      return;
    }
    const { getCommunityScore } = await import('./server/db');
    const result = await getCommunityScore(mediaId, mediaType);
    res.json({ success: true, data: result });
  });

  app.get('/api/ratings', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.json({ success: true, data: [] });
      return;
    }
    const ratings = await getUserRatings(req.user.id);
    res.json({ success: true, data: ratings });
  });

  app.post('/api/ratings', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { mediaId, mediaType, rating } = req.body || {};
    const numRating = Number(rating);
    if (!mediaId || typeof mediaId !== 'number' || (mediaType !== 'anime' && mediaType !== 'manga')) {
      res.status(400).json({ success: false, error: 'Valid mediaId and mediaType required' });
      return;
    }
    if (isNaN(numRating) || numRating < 1 || numRating > 10) {
      res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 10' });
      return;
    }
    await setRating(req.user!.id, mediaId, mediaType, Math.round(numRating));
    res.json({ success: true, rating: Math.round(numRating) });
  });

  app.delete('/api/ratings/:mediaType/:mediaId', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const mediaId = Number(req.params.mediaId);
    const mediaType = req.params.mediaType as 'anime' | 'manga';
    if (isNaN(mediaId) || (mediaType !== 'anime' && mediaType !== 'manga')) {
      res.status(400).json({ success: false, error: 'Invalid parameters' });
      return;
    }
    await removeRating(req.user!.id, mediaId, mediaType);
    res.json({ success: true, message: 'Rating removed' });
  });

  // ---------------- Community Prediction Polls ----------------

  app.get('/api/polls', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const polls = await getPolls(req.user?.id || null, req.voterHash);
      res.json({ success: true, data: polls });
    } catch (err) {
      console.error('[Polls GET] Error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch prediction polls' });
    }
  });

  app.post('/api/polls/:id/vote', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const pollId = Number(req.params.id);
    const optionId = Number(req.body?.optionId);

    if (isNaN(pollId) || isNaN(optionId)) {
      res.status(400).json({ success: false, error: 'Invalid poll ID or option ID' });
      return;
    }

    const result = await votePoll(pollId, optionId, req.user?.id || null, req.voterHash!);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.message || 'Failed to submit vote' });
      return;
    }

    // Return updated poll data
    const polls = await getPolls(req.user?.id || null, req.voterHash);
    const updated = polls.find((p) => p.id === pollId);
    res.json({ success: true, data: updated });
  });

  // ---------------- Jikan Anime Catalog API ----------------

  // Search Anime
  app.get('/api/anime/search', async (req: Request, res: Response): Promise<void> => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const genres = typeof req.query.genres === 'string' ? req.query.genres : undefined;
    const orderBy = typeof req.query.order_by === 'string' ? req.query.order_by : undefined;
    const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;

    try {
      const result = await searchCatalogAnime({
        query,
        page,
        limit,
        type,
        status,
        genres,
        orderBy,
        sort,
      });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      console.warn('[API /api/anime/search] Search unavailable:', err.message || err);
      res.status(500).json({ success: false, data: [], error: 'Catalog search currently unavailable' });
    }
  });

  // Top Anime Rankings
  app.get('/api/anime/top', async (req: Request, res: Response): Promise<void> => {
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'bypopularity';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;

    try {
      const result = await getCatalogTopAnime(filter, page, limit);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      // console.warn('[API /api/anime/top] Fetch unavailable:', err.message || err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch rankings' });
    }
  });


  app.get('/api/anime/top100', async (req: Request, res: Response): Promise<void> => {
    try {
      // First try to get top 100 from Supabase
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('anime').select('*').order('score', { ascending: false, nullsFirst: false }).limit(100);
        if (!error && data && data.length >= 10) {
           res.json({ success: true, data: data });
           return;
        }
      }
      
      // Fallback: Fetch from Jikan API pages 1-4
      const p1 = serverGetTopAnime('favorite', 1, 25);
      const p2 = serverGetTopAnime('favorite', 2, 25);
      const p3 = serverGetTopAnime('favorite', 3, 25);
      const p4 = serverGetTopAnime('favorite', 4, 25);
      
      const results = await Promise.all([p1, p2, p3, p4]);
      const combined = results.map(r => (r as any).data).flat();
      
      res.json({ success: true, data: combined });
    } catch (err) {
      console.warn('[API /api/anime/top100] Fetch unavailable:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch Top 100' });
    }
  });

  // Seasonal Anime

  app.get('/api/anime/seasonal', async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;

    try {
      const result = await getCatalogTopAnime('airing', page, limit);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      // console.warn('[API /api/anime/seasonal] Fetch unavailable:', err.message || err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch seasonal anime' });
    }
  });

  // Upcoming Anime
  app.get('/api/anime/upcoming', async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;

    try {
      const result = await getCatalogTopAnime('upcoming', page, limit);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      // console.warn('[API /api/anime/upcoming] Fetch unavailable:', err.message || err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch upcoming anime' });
    }
  });

  // Anime Genres
  app.get('/api/anime/genres', async (_req: Request, res: Response): Promise<void> => {
    try {
      const genres = await serverGetAnimeGenres();
      res.json({ success: true, data: genres });
    } catch (err) {
      // console.warn('[API /api/anime/genres] Fetch unavailable:', err.message || err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch genres' });
    }
  });

  // Anime Details (Full with Relations and Streaming)
  app.get('/api/anime/:id/pictures', async (req: Request, res: Response): Promise<void> => {
    try {
      const { serverGetAnimePictures } = await import('./server/jikanService');
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID' });
        return;
      }
      const data = await serverGetAnimePictures(id);
      res.json({ success: true, data });
    } catch (err) {
      console.error('[API /api/anime/:id/pictures] Error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  app.get('/api/anime/:id', async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }

    try {
      const { data } = await getCatalogAnimeById(id);
      if (!data) {
        res.status(404).json({ success: false, data: null, error: 'Anime not found' });
        return;
      }
      res.json({ success: true, data });
    } catch (err) {
      console.warn(`[API /api/anime/${id}] Error:`, err);
      res.status(500).json({ success: false, data: null, error: 'Failed to fetch anime details' });
    }
  });

  // Anime Characters
  app.get('/api/anime/:id/characters', async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }

    try {
      const data = await serverGetAnimeCharacters(id);
      res.json({ success: true, data });
    } catch (err) {
      console.warn(`[API /api/anime/${id}/characters] Error:`, err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch anime characters' });
    }
  });

  // Manga Top
  app.get('/api/manga/top', async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    try {
      const result = await serverGetTopManga(page, limit);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      // console.warn('[API /api/manga/top] Fetch unavailable:', err.message || err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch manga' });
    }
  });

  // Manga Search
  app.get('/api/manga/search', async (req: Request, res: Response): Promise<void> => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    try {
      const result = await serverSearchManga(query, page, limit);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      // console.warn('[API /api/manga/search] Fetch unavailable:', err.message || err);
      res.status(500).json({ success: false, data: [], error: 'Failed to search manga' });
    }
  });

  // ---------------- Vite / Static Asset Serving ----------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    startBackgroundScraper();
    console.log(`Kuro Shelf server online at http://0.0.0.0:${PORT}`);
  });
}

startServer();

// ---------------- Scheduled Sync Worker ----------------
// Note: In a production Supabase environment, this would ideally be
// triggered by pg_cron calling a Supabase Edge Function.
// For this environment, we simulate the scheduled ingestion worker
// by running it periodically from the Express server.
const SYNC_INTERVAL_MS = 1000 * 60 * 60 * 24; // 24 hours

setInterval(() => {
  if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[Cron] Starting scheduled catalog synchronization...');
    const { runIngestionJob } = require('./server/ingestionService');
    runIngestionJob('airing', '/top/anime?filter=airing', 1)
      .then(() => runIngestionJob('upcoming', '/top/anime?filter=upcoming', 1))
      .catch(e => console.error('[Cron] Sync job failed:', e));
  }
}, SYNC_INTERVAL_MS);
