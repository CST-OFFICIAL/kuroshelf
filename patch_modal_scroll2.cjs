const fs = require('fs');

let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');
if (!content.includes("document.body.style.overflow = 'hidden'")) {
  const target = `  const [communityScore, setCommunityScore] = useState<{ score: number | null, users: number } | null>(null);`;
  const replacement = target + `\n\n  // Lock body scroll\n  useEffect(() => {\n    document.body.style.overflow = 'hidden';\n    return () => { document.body.style.overflow = ''; };\n  }, []);\n`;
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
}
