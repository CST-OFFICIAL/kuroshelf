import { supabase } from './src/lib/supabase';
import { sendEmailOtp } from './src/services/authService';

async function test() {
  const email = 'sima72460+testotp123@gmail.com';
  console.log('Sending OTP to', email);
  const res = await sendEmailOtp(email);
  console.log('Send OTP result:', res);
}
test().catch(console.error);
