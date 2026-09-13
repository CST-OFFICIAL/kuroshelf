const fs = require('fs');
let code = fs.readFileSync('src/components/MediaImage.tsx', 'utf8');
if (!code.includes('console.log("candidatesKey changed", candidatesKey)')) {
  code = code.replace(
    'useEffect(() => {',
    'useEffect(() => { console.log("candidatesKey changed", candidatesKey);'
  );
  fs.writeFileSync('src/components/MediaImage.tsx', code);
}
