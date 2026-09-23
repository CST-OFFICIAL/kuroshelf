import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Allow Vite to expose VITE_, NEXT_PUBLIC_, and SUPABASE_ variables injected by Vercel
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'SUPABASE_'],
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: false,
  },
});
