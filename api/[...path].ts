import type { Request, Response } from 'express';
import { createApp } from '../server';

export default async function handler(req: Request, res: Response) {
  try {
    if (!req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
    }

    const app = await createApp();
    return app(req, res);
  } catch (error: any) {
    console.error('[KuroShelf Vercel Function Error]', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'KuroShelf API startup failed',
        message: error?.message || String(error),
        name: error?.name || 'UnknownError',
        stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack,
      });
    }
  }
}
