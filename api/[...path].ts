import type { Request, Response } from 'express';
import { createApp } from '../server.ts';

const appPromise = createApp();

export default async function handler(req: Request, res: Response) {
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }
  const app = await appPromise;
  return app(req, res);
}