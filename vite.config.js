import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'JOBit',
        short_name: 'JOBit',
        description: 'Hyperlocal home service and job marketplace connecting customers and verified workers with transparent pricing.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0EA5E0',
        background_color: '#FFFFFF',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(?:.*\.googleapis\.com|.*\.firebaseio\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|.*\.firebasestorage\.app)/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
});
