const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove blur filter from main content motion.div to fix lag
content = content.replace(/initial={{ opacity: 0, y: 15, filter: "blur\\(4px\\)" }}/, 'initial={{ opacity: 0, y: 15 }}');
content = content.replace(/animate={{ opacity: 1, y: 0, filter: "blur\\(0px\\)" }}/, 'animate={{ opacity: 1, y: 0 }}');
content = content.replace(/exit={{ opacity: 0, y: -15, filter: "blur\\(4px\\)" }}/, 'exit={{ opacity: 0, y: -15 }}');
// Remove from ExploreView if present
let exploreContent = fs.readFileSync('src/components/ExploreView.tsx', 'utf-8');
exploreContent = exploreContent.replace(/filter:\s*['"]blur\(\d+px\)['"]/g, '');

fs.writeFileSync('src/App.tsx', content);
fs.writeFileSync('src/components/ExploreView.tsx', exploreContent);
