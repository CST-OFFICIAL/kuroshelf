import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `    // Check user auth session
    getCurrentUser().then((user) => {
      setCurrentUser(user);
      if (user) {
        syncUserData(user);
      }
    });`;

const replacement = `    // Check user auth session and subscribe to changes
    import('./lib/supabase').then(({ supabase }) => {
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email!,
            username: session.user.user_metadata?.user_name || session.user.email?.split('@')[0] || 'User',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            created_at: session.user.created_at || new Date().toISOString(),
          };
          setCurrentUser(user);
          syncUserData(user);
        } else {
          setCurrentUser(null);
        }
      });
    });

    getCurrentUser().then((user) => {
      setCurrentUser(user);
      if (user) {
        syncUserData(user);
      }
    });`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
