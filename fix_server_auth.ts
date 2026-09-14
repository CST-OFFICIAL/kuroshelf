import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

// Replace the buggy auth middleware
content = content.replace(
  /req\.user = getSessionUser\(token\);/g,
  `const { data } = await import('./server/supabase').then(m => m.supabase.auth.getUser(token));\n      req.user = data.user ? { id: data.user.id, email: data.user.email, raw_user_meta_data: data.user.user_metadata } : null;`
);

// We need to make the middleware async
content = content.replace(
  /app\.use\(\(req: AuthenticatedRequest, _res: Response, next: NextFunction\) => \{/g,
  `app.use(async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {`
);

fs.writeFileSync('server.ts', content);
