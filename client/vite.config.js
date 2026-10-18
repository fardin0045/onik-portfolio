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

//  rendere 
// {
//   "$schema": "https://openapi.vercel.sh/vercel.json",
//   "rewrites": [
//     { "source": "/api/:path*", "destination": "https://onik-portfolio-api.onrender.com/api/:path*" },
//     { "source": "/uploads/:path*", "destination": "https://onik-portfolio-api.onrender.com/uploads/:path*" },
//     { "source": "/sitemap.xml", "destination": "https://onik-portfolio-api.onrender.com/sitemap.xml" },
//     { "source": "/robots.txt", "destination": "https://onik-portfolio-api.onrender.com/robots.txt" },
//     { "source": "/((?!assets/).*)", "destination": "/index.html" }
//   ],
//   "headers": [
//     {
//       "source": "/assets/(.*)",
//       "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
//     },
//     {
//       "source": "/(.*)",
//       "headers": [
//         { "key": "X-Content-Type-Options", "value": "nosniff" },
//         { "key": "X-Frame-Options", "value": "DENY" },
//         { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
//         { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
//         {
//           "key": "Content-Security-Policy",
//           "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
//         }
//       ]
//     }
//   ]
// }