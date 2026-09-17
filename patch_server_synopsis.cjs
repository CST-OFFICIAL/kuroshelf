const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const importRegex = /import \{[\s\S]*?\} from '.\/server\/catalogService';/;
if (code.match(importRegex)) {
  code = code.replace("getCatalogAnimeById", "getCatalogAnimeById, updateAnimeSynopsis");
}

const newEndpoint = `
  app.post('/api/anime/:id/synopsis/generate', async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const title = req.body.title;
      if (!id || !title) {
        res.status(400).json({ success: false, error: 'Missing id or title' });
        return;
      }
      
      const { rewriteSynopsis } = require('./server/aiService');
      const newSynopsis = await rewriteSynopsis("placeholder", title); // Force placeholder to trigger search
      
      if (newSynopsis && newSynopsis !== "placeholder") {
        await updateAnimeSynopsis(id, newSynopsis);
        res.json({ success: true, synopsis: newSynopsis });
      } else {
        res.status(500).json({ success: false, error: 'Failed to generate synopsis' });
      }
    } catch (err) {
      console.warn('[API /api/anime/:id/synopsis/generate] Error:', err);
      res.status(500).json({ success: false, error: 'Failed to generate synopsis' });
    }
  });
`;

code = code.replace("// Top Anime Rankings", newEndpoint + "\n  // Top Anime Rankings");

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
