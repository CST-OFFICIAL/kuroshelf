import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(url, key);

async function testOtp() {
  console.log('Sending OTP...');
  const res = await supabase.auth.signInWithOtp({ email: 'test_invalid_path@example.com', options: { emailRedirectTo: 'https://ais-dev.example.com' } });
  console.log('OTP Result:', res);
}

testOtp();
