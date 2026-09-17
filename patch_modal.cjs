const fs = require('fs');
let code = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

const target = `<h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">Synopsis</h3>`;
const replacement = `<div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">Synopsis</h3>
                  <button onClick={async () => {
                    try {
                      const res = await fetch(\`/api/anime/\${anime.mal_id}/synopsis/generate\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: anime.title })
                      });
                      const data = await res.json();
                      if (data.success && data.synopsis) {
                         alert('Synopsis updated! Close and reopen to see changes.');
                      } else {
                         alert('Failed to update synopsis. The AI API might be busy or out of quota.');
                      }
                    } catch (err) {
                      alert('Error updating synopsis.');
                    }
                  }} className="opacity-0 group-hover:opacity-100 p-1 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-md transition-all flex items-center gap-1 text-[10px] font-bold" title="Regenerate Synopsis with AI (Requires Auth/AI Key)">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Enhance</span>
                  </button>
                </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/AnimeDetailModal.tsx', code);
  console.log("Patched modal");
}

let importCode = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');
if (!importCode.includes('Sparkles')) {
   importCode = importCode.replace('import { ', 'import { Sparkles, ');
   fs.writeFileSync('src/components/AnimeDetailModal.tsx', importCode);
}
