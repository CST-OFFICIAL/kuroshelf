import type { Request, Response } from 'express';
import { createApp } from '../server';

let appHandler: any = null;

export default async function handler(req: Request, res: Response) {
  if (!appHandler) {
    appHandler = await createApp();
  }
  const originalUrl = (req.headers['x-forwarded-uri'] || req.headers['x-matched-path']) as string;
  if (originalUrl && originalUrl.startsWith('/api') && req.url !== originalUrl) {
    req.url = originalUrl;
  }
  return appHandler(req, res);
}
