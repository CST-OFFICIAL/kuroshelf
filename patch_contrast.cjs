const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      content = content.replace(/text-neutral-500/g, 'text-neutral-400');
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir('src/components');
let appContent = fs.readFileSync('src/App.tsx', 'utf-8');
appContent = appContent.replace(/text-neutral-500/g, 'text-neutral-400');
fs.writeFileSync('src/App.tsx', appContent);
