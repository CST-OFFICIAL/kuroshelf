import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { getUserBookmarks, upsertBookmark, deleteBookmark, getUserLikes, toggleLike, getUserRatings, setRating, removeRating, getPolls, votePoll } from './server/db';
import {
  getCatalogTopAnime,
  searchCatalogAnime,
  getCatalogAnimeById, updateAnimeSynopsis
} from './server/catalogService';
import { resolveOfficialSynopsis } from './server/officialSynopsisService';
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
  serverGetTop100Anime,
  serverGetAiringSchedule,
  serverGetAnimeRecommendations,
  serverGetCharacterDetails,
  serverGetPersonDetails,
  isNsfwOrAdult,
} from './server/jikanService';
import { moderateAvatarImage } from './server/avatarModerationService';

// Extend Express Request type with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: { id: string, email?: string, raw_user_meta_data?: any } | null;
  voterHash?: string;
}

export async function createApp() {
  // Initialize Database schemas & seeds

  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
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

  // ---------------- Avatar Safety Moderation ----------------
  app.post('/api/moderate-avatar', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ success: false, safe: false, error: 'No image data provided.' });
        return;
      }

      const result = await moderateAvatarImage(imageBase64, mimeType || 'image/jpeg');
      res.json({
        success: true,
        safe: result.safe,
        reason: result.reason,
        flaggedCategories: result.flaggedCategories || [],
      });
    } catch (err: any) {
      console.error('Error in /api/moderate-avatar:', err);
      res.status(500).json({ success: false, safe: false, error: 'Failed to process image safety check.' });
    }
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
      const { serverGetAnimeDetails } = await import('./server/jikanService');
      const topIds = await getTopCommunityAnime(24);
      
      // Fetch details for each from jikan (could be slow if not cached, but we'll try)
      const results = [];
      for (const item of topIds) {
        const details = await serverGetAnimeDetails(item.id);
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
  app.get('/api/test-db', async (req: Request, res: Response): Promise<void> => {
    const { data, error } = await supabase.from('anime').select('*, anime_genres(genres(*)), anime_studios(studios(*)), anime_streaming(url, streaming_providers(name))').eq('mal_id', 16498).single();
    res.json({ data, error });
  });

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

  
  // Fetch and resolve verified official synopsis from AniList / MyAnimeList (no AI generation)
  const handleOfficialSynopsis = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const title = typeof req.body?.title === 'string' ? req.body.title : undefined;
      if (!id && !title) {
        res.status(400).json({ success: false, error: 'Missing anime id or title' });
        return;
      }

      const result = await resolveOfficialSynopsis(id, title);
      if (result.success && result.synopsis) {
        res.json({ success: true, synopsis: result.synopsis, source: result.source });
      } else {
        res.status(404).json({ success: false, error: result.error || 'Official synopsis not found' });
      }
    } catch (err: any) {
      console.warn('[API synopsis official] Error:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch official synopsis' });
    }
  };

  app.post('/api/anime/:id/synopsis/official', handleOfficialSynopsis);
  app.post('/api/anime/:id/synopsis/generate', handleOfficialSynopsis);

  // Top Anime Rankings
  app.get('/api/anime/top', async (req: Request, res: Response): Promise<void> => {
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'bypopularity';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const genre = typeof req.query.genre === 'string' ? req.query.genre : undefined;
    const year = typeof req.query.year === 'string' ? req.query.year : undefined;

    try {
      if (limit > 25 || filter === 'top100' || (genre && genre !== 'all') || (year && year !== 'all')) {
        const top100 = await serverGetTop100Anime({ filter, genre, year, limit });
        res.json({
          success: true,
          data: top100,
          pagination: {
            current_page: page,
            has_next_page: false,
            last_visible_page: 1,
            items: { count: top100.length, total: top100.length, per_page: limit }
          }
        });
        return;
      }

      const result = await getCatalogTopAnime(filter, page, limit);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch rankings' });
    }
  });

  // Top 100 Anime Endpoint - Full 100 items for all categories, genres, and years
  app.get('/api/anime/top100', async (req: Request, res: Response): Promise<void> => {
    try {
      const year = req.query.year ? String(req.query.year) : undefined;
      const genre = req.query.genre ? String(req.query.genre) : undefined;
      const filter = req.query.filter ? String(req.query.filter) : 'top100';
      const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100);

      // Check if Supabase has items
      let supabaseItems: any[] = [];
      if (isSupabaseConfigured) {
        try {
          let query = supabase.from('anime').select('*, anime_genres!inner(genres!inner(name)), anime_studios(studios(name)), anime_streaming(url, streaming_providers(name))').neq('rating', 'Rx - Hentai');
          
          if (year && year !== 'all') query = query.eq('year', Number(year));
          if (genre && genre !== 'all') query = query.eq('anime_genres.genres.name', genre);
          if (filter === 'airing') query = query.eq('status', 'Currently Airing');
          if (filter === 'upcoming') query = query.eq('status', 'Not yet aired');
          
          const { data, error } = await query.order('score', { ascending: false, nullsFirst: false }).limit(limit);
          
          if (!error && data && data.length > 0) {
            const safeData = data.filter(item => {
              if (isNsfwOrAdult(item)) return false;
              if (item.rating && (item.rating.includes('Rx') || item.rating.includes('Hentai'))) return false;
              if (item.anime_genres && Array.isArray(item.anime_genres)) {
                for (const ag of item.anime_genres) {
                  const gName = ag.genres?.name?.toLowerCase() || '';
                  if (gName.includes('hentai') || gName.includes('erotica') || gName.includes('adult cast')) return false;
                }
              }
              return true;
            });

            supabaseItems = safeData.map(item => {
              const cleaned = { ...item };
              delete cleaned.anime_genres;
              delete cleaned.anime_studios;
              cleaned.images = cleaned.images_json;
              if (item.anime_studios && Array.isArray(item.anime_studios)) {
                cleaned.studios = item.anime_studios.map((as: any) => as.studios).filter(Boolean);
              }
              if (item.anime_streaming && Array.isArray(item.anime_streaming)) {
                cleaned.streaming = item.anime_streaming.map((as: any) => ({
                  name: as.streaming_providers?.name || 'Unknown',
                  url: as.url
                })).filter(Boolean);
              }
              delete cleaned.anime_streaming;
              return cleaned;
            });
          }
        } catch (dbErr) {
          console.warn('[API /api/anime/top100] Supabase query notice:', dbErr);
        }
      }

      // If Supabase already provided the full list (e.g. 100 items), return it directly
      if (supabaseItems.length >= limit) {
        res.json({ success: true, data: supabaseItems.slice(0, limit) });
        return;
      }

      // Fetch external items to guarantee a full list of 100 items
      const externalItems = await serverGetTop100Anime({ filter, genre, year, limit });

      // Merge Supabase items and external items without duplicates
      const seenIds = new Set<number>();
      const combined: any[] = [];

      for (const item of supabaseItems) {
        if (item.mal_id && !seenIds.has(item.mal_id) && !isNsfwOrAdult(item)) {
          seenIds.add(item.mal_id);
          combined.push(item);
        }
      }

      for (const item of externalItems) {
        if (item.mal_id && !seenIds.has(item.mal_id) && !isNsfwOrAdult(item)) {
          seenIds.add(item.mal_id);
          combined.push(item);
        }
      }

      res.json({ success: true, data: combined.slice(0, limit) });
    } catch (err) {
      console.warn('[API /api/anime/top100] Error:', err);
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

  // Weekly Airing Schedule
  app.get('/api/anime/schedule', async (req: Request, res: Response): Promise<void> => {
    try {
      const day = typeof req.query.day === 'string' ? req.query.day : undefined;
      const data = await serverGetAiringSchedule(day);
      res.json({ success: true, data });
    } catch (err) {
      console.warn('[API /api/anime/schedule] Error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch schedule' });
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

  // Anime Recommendations
  app.get('/api/anime/:id/recommendations', async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }

    try {
      const data = await serverGetAnimeRecommendations(id);
      res.json({ success: true, data });
    } catch (err) {
      console.warn(`[API /api/anime/${id}/recommendations] Error:`, err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch recommendations' });
    }
  });

  // Character Details Explorer
  app.get('/api/characters/:id', async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const name = typeof req.query.name === 'string' ? req.query.name : undefined;

    try {
      const data = await serverGetCharacterDetails(id, name);
      if (!data) {
        res.status(404).json({ success: false, error: 'Character not found' });
        return;
      }
      res.json({ success: true, data });
    } catch (err) {
      console.warn(`[API /api/characters/${id}] Error:`, err);
      res.status(500).json({ success: false, error: 'Failed to fetch character details' });
    }
  });

  // Voice Actor / Staff Explorer
  app.get('/api/people/:id', async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const name = typeof req.query.name === 'string' ? req.query.name : undefined;

    try {
      const data = await serverGetPersonDetails(id, name);
      if (!data) {
        res.status(404).json({ success: false, error: 'Person not found' });
        return;
      }
      res.json({ success: true, data });
    } catch (err) {
      console.warn(`[API /api/people/${id}] Error:`, err);
      res.status(500).json({ success: false, error: 'Failed to fetch person details' });
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
      server: { middlewareMode: true, hmr: false },
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

  return app;
}

if (process.env.VERCEL !== '1') {
  createApp().then(app => {
    app.listen(3000, '0.0.0.0', () => {
      startBackgroundScraper();
      console.log('Kuro Shelf server online at http://0.0.0.0:3000');
    });
  });
}

// ---------------- Scheduled Sync Worker ----------------
// Note: In a production Supabase environment, this would ideally be
// triggered by pg_cron calling a Supabase Edge Function.
// For this environment, we simulate the scheduled ingestion worker
// by running it periodically from the Express server.
const SYNC_INTERVAL_MS = 1000 * 60 * 60 * 24; // 24 hours

if (process.env.VERCEL !== '1') {
  setInterval(() => {
    if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('[Cron] Starting scheduled catalog synchronization...');
      const { runIngestionJob } = require('./server/ingestionService');
      runIngestionJob('airing', '/top/anime?filter=airing', 1)
        .then(() => runIngestionJob('upcoming', '/top/anime?filter=upcoming', 1))
        .catch(e => console.error('[Cron] Sync job failed:', e));
    }
  }, SYNC_INTERVAL_MS);
}
