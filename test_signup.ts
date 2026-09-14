import { supabase } from './server/supabase.js';

async function testSignup() {
  const email = `test${Date.now()}@example.com`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password1234',
    options: {
      data: {
        user_name: 'tester'
      }
    }
  });
  console.log('Signup result:', { id: data.user?.id, error });

  if (data.user?.id) {
    const { data: profile, error: profError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    console.log('Profile auto-created?', { profile, profError });
  }
}
testSignup();
