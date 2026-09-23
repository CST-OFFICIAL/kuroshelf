import type { Request, Response } from 'express';
import { createApp } from '../server';

let appHandler: any = null;

export default async function handler(req: Request, res: Response) {
  if (!appHandler) {
    appHandler = await createApp();
  }
  return appHandler(req, res);
}
