import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

export default defineConfig(({ mode }) => {
  // The Vercel Supabase integration exposes server-style names (SUPABASE_*).
  // Map only the public URL/key into Vite's client-side environment at build time.
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    env.VITE_SUPABASE_URL
  const supabasePublishableKey =
    process.env.SUPABASE_ANON_KEY ??
    env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY

  return {
    define: {
      __SUPABASE_URL__: JSON.stringify(supabaseUrl ?? ''),
      __SUPABASE_PUBLISHABLE_KEY__: JSON.stringify(supabasePublishableKey ?? ''),
    },
    plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Inventário TI Saluxx',
        short_name: 'Inventário TI',
        description: 'Sistema de inventário de equipamentos de TI para rede hospitalar',
        theme_color: '#0a0f1e',
        background_color: '#0a0f1e',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }
            }
          }
        ]
      }
    })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
    port: 5173,
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://login.microsoftonline.com https://graph.microsoft.com",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        "worker-src 'self' blob:",
        "frame-ancestors 'none'",
      ].join('; ')
    }
    }
  }
})
