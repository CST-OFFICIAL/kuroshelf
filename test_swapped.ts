import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_ANON_KEY!;
const key = process.env.VITE_SUPABASE_URL!;
let fixedUrl = url;
try {
  fixedUrl = new URL(url).origin;
} catch (e) { }

console.log("URL:", fixedUrl);
const supabase = createClient(fixedUrl, key);

async function testOtp() {
  console.log('Sending OTP...');
  const res = await supabase.auth.signInWithOtp({ email: 'sima72460+test10@gmail.com' });
  console.log('OTP Result:', res);
}

testOtp().catch(e => console.log('CAUGHT:', e));
