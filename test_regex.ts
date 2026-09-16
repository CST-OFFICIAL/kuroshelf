const urls = [
  'https://jshrvmlpsmahtycmgpdf.supabase.co',
  'https://jshrvmlpsmahtycmgpdf.supabase.co/',
  'https://jshrvmlpsmahtycmgpdf.supabase.co/rest/v1',
  'https://jshrvmlpsmahtycmgpdf.supabase.co/rest/v1/',
  'https://jshrvmlpsmahtycmgpdf.supabase.co/rest/v1//',
  'https://jshrvmlpsmahtycmgpdf.supabase.co/auth/v1'
];
for (const u of urls) {
  const fixed = u.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  console.log(u, '=>', fixed);
}
