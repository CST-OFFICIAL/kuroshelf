const fs = require('fs');
const glob = require('glob');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf-8');
  
  if (content.includes('useEffect(() => {') && content.includes('onClose: () => void;')) {
    // It's a modal!
    const target = `  useEffect(() => {`;
    const replacement = `  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {`;
    
    // Only apply if not already present
    if (!content.includes('document.body.style.overflow = \'hidden\'')) {
       // Replace first occurrence carefully by finding a suitable place, e.g. right after component declaration
       const fnRegex = /export function [a-zA-Z]+\(.*\) \{/;
       const match = content.match(fnRegex);
       if (match) {
         content = content.replace(match[0], match[0] + `\n  // Lock body scroll\n  useEffect(() => {\n    document.body.style.overflow = 'hidden';\n    return () => { document.body.style.overflow = ''; };\n  }, []);\n`);
         fs.writeFileSync(file, content);
         console.log('Patched', file);
       }
    }
  }
}

['src/components/AnimeDetailModal.tsx', 'src/components/AuthModal.tsx', 'src/components/InfoModal.tsx'].forEach(processFile);
