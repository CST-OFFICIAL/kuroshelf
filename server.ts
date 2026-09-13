import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  serverSearchAnime,
  serverGetTopAnime,
  serverGetSeasonalAnime,
  serverGetUpcomingAnime,
  serverGetAnimeDetails,
  serverGetAnimeCharacters,
  serverGetTopManga,
  serverSearchManga,
  warmUpCatalog,
} from './server/jikanService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes First
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'kuroshelf-api' });
  });

  // Anime Search endpoint
  app.get('/api/anime/search', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const limit = Number(req.query.limit) || 24;
    try {
      const results = await serverSearchAnime(query, limit);
      res.json({ success: true, data: results });
    } catch (err) {
      console.warn('API /api/anime/search error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to search anime' });
    }
  });

  // Top Anime
  app.get('/api/anime/top', async (req, res) => {
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'bypopularity';
    const limit = Number(req.query.limit) || 20;
    try {
      const results = await serverGetTopAnime(filter, limit);
      res.json({ success: true, data: results });
    } catch (err) {
      console.warn('API /api/anime/top error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch top anime' });
    }
  });

  // Seasonal Anime
  app.get('/api/anime/seasonal', async (req, res) => {
    const limit = Number(req.query.limit) || 20;
    try {
      const results = await serverGetSeasonalAnime(limit);
      res.json({ success: true, data: results });
    } catch (err) {
      console.warn('API /api/anime/seasonal error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch seasonal anime' });
    }
  });

  // Upcoming Anime
  app.get('/api/anime/upcoming', async (req, res) => {
    const limit = Number(req.query.limit) || 20;
    try {
      const results = await serverGetUpcomingAnime(limit);
      res.json({ success: true, data: results });
    } catch (err) {
      console.warn('API /api/anime/upcoming error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch upcoming anime' });
    }
  });

  // Anime Details
  app.get('/api/anime/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }
    try {
      const data = await serverGetAnimeDetails(id);
      res.json({ success: true, data });
    } catch (err) {
      console.warn(`API /api/anime/${id} error:`, err);
      res.status(500).json({ success: false, data: null, error: 'Failed to fetch anime details' });
    }
  });

  // Anime Characters
  app.get('/api/anime/:id/characters', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid anime ID' });
      return;
    }
    try {
      const data = await serverGetAnimeCharacters(id);
      res.json({ success: true, data });
    } catch (err) {
      console.warn(`API /api/anime/${id}/characters error:`, err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch anime characters' });
    }
  });

  // Top Manga
  app.get('/api/manga/top', async (req, res) => {
    const limit = Number(req.query.limit) || 20;
    try {
      const results = await serverGetTopManga(limit);
      res.json({ success: true, data: results });
    } catch (err) {
      console.warn('API /api/manga/top error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch top manga' });
    }
  });

  // Search Manga
  app.get('/api/manga/search', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const limit = Number(req.query.limit) || 20;
    try {
      const results = await serverSearchManga(query, limit);
      res.json({ success: true, data: results });
    } catch (err) {
      console.warn('API /api/manga/search error:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to search manga' });
    }
  });

  // Vite middleware for development vs static dist for production
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
    console.log(`Kuro Shelf server running on http://localhost:${PORT}`);
    warmUpCatalog();
  });
}

startServer();
