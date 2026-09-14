import { supabase } from './server/supabase.js';

async function testSignup() {
  const email = `testuser${Date.now()}@example.com`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password1234',
    options: {
      data: {
        user_name: 'tester'
      }
    }
  });
  console.log('Signup result:', { id: data.user?.id, email: data.user?.email, error });
}
testSignup();
