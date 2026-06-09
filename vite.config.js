import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg', 'favicon.svg'],
      manifest: {
        name: 'Boutikonect',
        short_name: 'Boutikonect',
        description: 'Le marché à portée de main — Achetez et vendez au Bénin',
        theme_color: '#030712',
        background_color: '#030712',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'fr-FR',
        categories: ['shopping', 'business', 'lifestyle'],
        shortcuts: [
          {
            name: 'Produits',
            short_name: 'Produits',
            url: '/products',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Messages',
            short_name: 'Messages',
            url: '/messages',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Notifications',
            short_name: 'Alertes',
            url: '/notifications',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
          },
        ],
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
