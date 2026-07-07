import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png', 'app-icon.png'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000, // 5MB
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.includes('/api/matches/live'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'live-matches-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 2, // 2 hours
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
          navigateFallbackDenylist: [
            /^\/api\//, 
            /^\/export-download\//, 
            /\.zip$/, 
            /safara90-production\.zip/,
            /\.xml$/,
            /\.txt$/,
            /robots\.txt/,
            /sitemap.*\.xml/
          ],
        },
        manifest: {
          name: 'GoalTime Pro',
          short_name: 'GoalTime',
          description: 'تطبيق بث مباريات كرة القدم المباشر والأخبار الرياضية',
          theme_color: '#00ff88',
          background_color: '#050505',
          display: 'standalone',
          orientation: 'portrait',
          dir: 'rtl',
          lang: 'ar',
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 5000,
      rollupOptions: {
        output: {
          // Automatic chunking based on dependency usage
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
