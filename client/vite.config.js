import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_DEV_API_PROXY || 'http://localhost:4000';
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // Same-origin in development: cookies work without CORS gymnastics.
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/uploads': { target: apiTarget, changeOrigin: true },
        '/sitemap.xml': { target: apiTarget, changeOrigin: true },
        '/robots.txt': { target: apiTarget, changeOrigin: true },
      },
    },
    build: {
      target: 'es2022',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Keep rarely-changing vendor code in its own long-cached chunks.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\/](react|react-dom|scheduler|react-router)[\/]/.test(id)) return 'react';
            if (id.includes('@tanstack')) return 'query';
            if (/react-markdown|remark|micromark|mdast|unist|hast|vfile|property-information|decode-named|character-/.test(id)) return 'markdown';
            return undefined;
          },
        },
      },
    },
  };
});
