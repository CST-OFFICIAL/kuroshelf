import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: 'VITE_',
  server: {
    host: '0.0.0.0',
    port: 3000,
    // The Express host owns the dev server lifecycle; disable Vite's client
    // injection so the preview does not try to connect to a non-existent HMR socket.
    hmr: false,
  },
});
