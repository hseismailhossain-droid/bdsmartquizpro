
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows us to use process.env.API_KEY in our frontend code
    // It picks the value from the environment during build time
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "")
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    cssCodeSplit: true,
    sourcemap: false
  },
  server: {
    port: 3000,
    host: true
  }
});
