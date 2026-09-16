const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove the forced redirect block
content = content.replace(
  /\/\/ Redirect to profile tab if setup is incomplete\n  useEffect\(\(\) => \{\n    if \(currentUser && !currentUser\.profile_setup_complete\) \{\n      setAuthModalOpen\(false\);\n      setActiveTab\("profile"\);\n    \}\n  \}, \[currentUser\]\);\n/g,
  ""
);

fs.writeFileSync('src/App.tsx', content);
