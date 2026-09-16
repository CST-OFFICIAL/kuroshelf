import dotenv from 'dotenv';
dotenv.config();
console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL);
const supabaseUrlRaw = process.env.VITE_SUPABASE_URL || '';
const supabaseUrl = supabaseUrlRaw.trim().replace(/\/rest\/v1\/?$/, '');
console.log("Transformed:", supabaseUrl);
