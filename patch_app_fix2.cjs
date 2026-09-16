const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Reverse the broken </main>
content = content.replace(
  /          <\/motion\.div>\n        <\/AnimatePresence>\n      <\/main>/,
  '      </main>'
);

// Apply the correct wrapper around the content inside main
content = content.replace(
  /<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">/,
  '<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">\n        <AnimatePresence mode="wait">\n          <motion.div\n            key={activeTab}\n            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}\n            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}\n            exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}\n            transition={{ duration: 0.25, ease: "easeInOut" }}\n            className="w-full space-y-10"\n          >'
);

content = content.replace(
  /        \{\/\* Detail Modal \*\/\}/,
  '          </motion.div>\n        </AnimatePresence>\n\n        {/* Detail Modal */}'
);

fs.writeFileSync('src/App.tsx', content);
