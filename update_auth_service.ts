import fs from 'fs';
let content = fs.readFileSync('src/services/authService.ts', 'utf-8');

// Change sendEmailOtp to NOT include emailRedirectTo, since we don't want magic link dependency.
// We just want them to use the code.
content = content.replace(
  /options: \{ shouldCreateUser: true, emailRedirectTo: window\.location\.origin \}/,
  'options: { shouldCreateUser: true }' // Removed emailRedirectTo
);

fs.writeFileSync('src/services/authService.ts', content);
