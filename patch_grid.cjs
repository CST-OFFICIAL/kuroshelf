const fs = require('fs');
const glob = require('glob');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace standard grid cols with auto-fill minmax
  const regex = /grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[56] xl:grid-cols-[68]/g;
  const regex2 = /grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6/g;
  const regex3 = /grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5/g;
  
  const replacement = 'grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]';
  
  let modified = false;
  if (content.match(regex)) { content = content.replace(regex, replacement); modified = true; }
  if (content.match(regex2)) { content = content.replace(regex2, replacement); modified = true; }
  if (content.match(regex3)) { content = content.replace(regex3, replacement); modified = true; }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}

glob.sync('src/**/*.tsx').forEach(processFile);
