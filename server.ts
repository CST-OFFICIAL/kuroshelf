import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import {
  initDatabase,
  createUser,
  getUserByEmail,
  getUserByUsername,
  verifyPassword,
  createSession,
  getSessionUser,
  deleteSession,
  getUserBookmarks,
  upsertBookmark,
  deleteBookmark,
  getUserLikes,
  toggleLike,
  getUserRatings,
  setRating,
  removeRating,
  getPolls,
  votePoll,
  UserRow,
} from './server/db';
import {
  serverSearchAnime,
  serverGetTopAnime,
  serverGetSeasonalAnime,
  serverGetUpcomingAnime,
  serverGetAnimeDetails,
  serverGetAnimeCharacters,
  serverGetAnimeGenres,
  serverGetTopManga,
  serverSearchManga,
} from './server/jikanService';

// Extend Express Request type with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: Omit<UserRow, 'password_hash' | 'salt'> | null;
  voterHash?: string;
}

async function startServer() {
  // Initialize Database schemas & seeds
  initDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Security & Voter-Hash Middleware
  app.use((req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    // Generate an anonymous device/IP voter hash for rate limiting & guest voting
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    req.voterHash = crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');

    // Extract auth token from cookie or Authorization header
    const token = req.cookies?.kuro_token || req.headers.authorization?.replace(/^Bearer\s+/, '');
    if (token) {
      req.user = getSessionUser(token);
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

  // ---------------- Authentication Endpoints ----------------

  // Register
  app.post('/api/auth/register', (req: AuthenticatedRequest, res: Response): void => {
    const { email, username, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'A valid email address is required.' });
      return;
    }
    if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
      res.status(400).json({ success: false, error: 'Username must be between 3 and 30 characters.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
      return;
    }

    // Check unique email and username
    if (getUserByEmail(email)) {
      res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }
    if (getUserByUsername(username)) {
      res.status(409).json({ success: false, error: 'This username is already taken.' });
      return;
    }

    try {
      const user = createUser(email, username, password);
      const token = createSession(user.id);

      res.cookie('kuro_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
        },
        token,
      });
    } catch (err) {
      console.error('[Auth Register] Error:', err);
      res.status(500).json({ success: false, error: 'Failed to create user account.' });
    }
  });

  // Login
  app.post('/api/auth/login', (req: AuthenticatedRequest, res: Response): void => {
    const { identifier, password } = req.body || {};

    if (!identifier || typeof identifier !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ success: false, error: 'Email/username and password are required.' });
      return;
    }

    const user = identifier.includes('@') ? getUserByEmail(identifier) : getUserByUsername(identifier);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials.' });
      return;
    }

    const valid = verifyPassword(password, user.password_hash, user.salt);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials.' });
      return;
    }

    const token = createSession(user.id);
    res.cookie('kuro_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
      token,
    });
  });

  // Logout
  app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response): void => {
    const token = req.cookies?.kuro_token || req.headers.authorization?.replace(/^Bearer\s+/, '');
    if (token) {
      deleteSession(token);
    }
    res.clearCookie('kuro_token');
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Get Current User Profile
  app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response): void => {
    res.json({
      success: true,
      user: req.user || null,
    });
  });

  // ---------------- Personal Shelf / Bookmarks ----------------

  // Get Shelf Items
  app.get('/api/shelf', (req: AuthenticatedRequest, res: Response): void => {
    if (!req.user) {
      res.json({ success: true, data: [] });
      return;
    }
    try {
      const items = getUserBookmarks(req.user.id);
      res.json({ success: true, data: items });
    } catch (err) {
      console.error('[Shelf GET] Error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to retrieve shelf' });
    }
  });

  // Upsert Shelf Item
  app.post('/api/shelf', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
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
      const record = upsertBookmark({
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
  app.delete('/api/shelf/:mediaType/:mediaId', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    const mediaId = Number(req.params.mediaId);
    const mediaType = req.params.mediaType as 'anime' | 'manga';

    if (isNaN(mediaId) || (mediaType !== 'anime' && mediaType !== 'manga')) {
      res.status(400).json({ success: false, error: 'Invalid parameters' });
      return;
    }

    try {
      deleteBookmark(req.user!.id, mediaId, mediaType);
      res.json({ success: true, message: 'Removed from shelf' });
    } catch (err) {
      console.error('[Shelf Delete] Error:', err);
      res.status(500).json({ success: false, error: 'Failed to remove shelf item' });
    }
  });

  // ---------------- Likes ----------------

  app.get('/api/likes', (req: AuthenticatedRequest, res: Response): void => {
    if (!req.user) {
      res.json({ success: true, data: [] });
      return;
    }
    const likes = getUserLikes(req.user.id);
    res.json({ success: true, data: likes });
  });

  app.post('/api/likes/toggle', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    const { mediaId, mediaType, title, imageUrl } = req.body || {};
    if (!mediaId || typeof mediaId !== 'number' || (mediaType !== 'anime' && mediaType !== 'manga')) {
      res.status(400).json({ success: false, error: 'Valid mediaId and mediaType required' });
      return;
    }
    const result = toggleLike(req.user!.id, mediaId, mediaType, title || 'Unknown Title', imageUrl);
    res.json({ success: true, liked: result.liked });
  });

  // ---------------- Ratings ----------------

  app.get('/api/ratings', (req: AuthenticatedRequest, res: Response): void => {
    if (!req.user) {
      res.json({ success: true, data: [] });
      return;
    }
    const ratings = getUserRatings(req.user.id);
    res.json({ success: true, data: ratings });
  });

  app.post('/api/ratings', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
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
    setRating(req.user!.id, mediaId, mediaType, Math.round(numRating));
    res.json({ success: true, rating: Math.round(numRating) });
  });

  app.delete('/api/ratings/:mediaType/:mediaId', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    const mediaId = Number(req.params.mediaId);
    const mediaType = req.params.mediaType as 'anime' | 'manga';
    if (isNaN(mediaId) || (mediaType !== 'anime' && mediaType !== 'manga')) {
      res.status(400).json({ success: false, error: 'Invalid parameters' });
      return;
    }
    removeRating(req.user!.id, mediaId, mediaType);
    res.json({ success: true, message: 'Rating removed' });
  });

  // ---------------- Community Prediction Polls ----------------

  app.get('/api/polls', (req: AuthenticatedRequest, res: Response): void => {
    try {
      const polls = getPolls(req.user?.id || null, req.voterHash);
      res.json({ success: true, data: polls });
    } catch (err) {
      console.error('[Polls GET] Error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch prediction polls' });
    }
  });

  app.post('/api/polls/:id/vote', (req: AuthenticatedRequest, res: Response): void => {
    const pollId = Number(req.params.id);
    const optionId = Number(req.body?.optionId);

    if (isNaN(pollId) || isNaN(optionId)) {
      res.status(400).json({ success: false, error: 'Invalid poll ID or option ID' });
      return;
    }

    const result = votePoll(pollId, optionId, req.user?.id || null, req.voterHash!);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.message || 'Failed to submit vote' });
      return;
    }

    // Return updated poll data
    const polls = getPolls(req.user?.id || null, req.voterHash);
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
      const result = await serverSearchAnime({
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
      console.warn('[API /api/anime/search] Error:', err);
      res.status(500).json({ success: false, data: [], error: 'Catalog search currently unavailable' });
    }
  });

  // Top Anime Rankings
  app.get('/api/anime/top', async (req: Request, res: Response): Promise<void> => {
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'bypopularity';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;

    try {
      const result = await serverGetTopAnime(filter, page, limit);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      console.warn('[API /api/anime/top] Error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch rankings' });
    }
  });

  // Seasonal Anime
  app.get('/api/anime/seasonal', async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;

    try {
      const result = await serverGetSeasonalAnime(page, limit);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      console.warn('[API /api/anime/seasonal] Error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch seasonal anime' });
    }
  });

  // Upcoming Anime
  app.get('/api/anime/upcoming', async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;

    try {
      const result = await serverGetUpcomingAnime(page, limit);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (err) {
      console.warn('[API /api/anime/upcoming] Error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch upcoming anime' });
    }
  });

  // Anime Genres
  app.get('/api/anime/genres', async (_req: Request, res: Response): Promise<void> => {
    try {
      const genres = await serverGetAnimeGenres();
      res.json({ success: true, data: genres });
    } catch (err) {
      console.warn('[API /api/anime/genres] Error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch genres' });
    }
  });

  // Anime Details (Full with Relations and Streaming)
  app.get('/api/anime/:id', async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }

    try {
      const data = await serverGetAnimeDetails(id);
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
      console.warn('[API /api/manga/top] Error:', err);
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
      console.warn('[API /api/manga/search] Error:', err);
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
    console.log(`Kuro Shelf server online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
