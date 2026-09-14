import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `        } else {
          setCurrentUser(null);
        }`;

const replacement = `        } else {
          setCurrentUser(null);
          setShelf([]);
          setActivities([]);
          setUserVotes({});
        }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
