import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    legacy({
      targets: [
        'Android >= 4.4', // Android 4.4+ (Chromium 30+)
        'Chrome >= 30',   // Chrome 30+ (2013)
        'iOS >= 9',       // iOS Safari 9+ (2015)
        'Safari >= 9',    // Safari 9+ (2015)
      ],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      polyfills: [
        'es.promise',
        'es.array.iterator',
        'es.object.assign',
        'es.string.includes',
        'es.array.includes',
        'es.array.find',
        'es.array.from',
        'es.symbol',
      ],
      modernPolyfills: false, // Don't polyfill for modern browsers
    }),
    VitePWA({
      registerType: "prompt", // User must confirm update (not automatic)
      includeAssets: ["icons/*.png", "icons/*.svg", "data/*.json"],
      manifest: false, // Use our custom manifest.webmanifest
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff,woff2,ttf,webmanifest}"],
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/(?!data\/)/], // Allow all except /data/
        cleanupOutdatedCaches: true,
        skipWaiting: false, // Wait for user confirmation before activating new SW
        clientsClaim: false, // Don't take control immediately
        runtimeCaching: [
          {
            // SPA Navigation - always serve index.html for navigation requests
            urlPattern: ({ request, url }) => {
              return request.mode === 'navigate' && !url.pathname.startsWith('/data/');
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /\/data\/.+\.json$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "kfz-data-cache",
              networkTimeoutSeconds: 5, // Fallback to cache after 5s
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
