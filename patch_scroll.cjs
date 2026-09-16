const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const scrollEffect = `  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    if (isSearchActive) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSearchActive]);`;

content = content.replace(
  /  useEffect\(\(\) => \{\n    const fetchStats = async \(\)/,
  scrollEffect + '\n\n  useEffect(() => {\n    const fetchStats = async ()'
);

fs.writeFileSync('src/App.tsx', content);
