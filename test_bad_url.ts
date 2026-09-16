import { createClient } from '@supabase/supabase-js';
const supabase = createClient('jshrvmlpsmahtycmgpdf.supabase.co', 'dummy_key');
supabase.auth.signInWithOtp({ email: 'test@example.com' }).then(res => console.log(res)).catch(e => console.log('ERROR:', e.message));
