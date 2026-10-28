import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      // Cache the renderer separately; the Supabase SDK is already lazy-loaded.
      output: { manualChunks: { three: ['three'] } }
    }
  }
});
