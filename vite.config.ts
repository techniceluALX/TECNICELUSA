import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

function imageManifest() {
  const walk = (dir: string, base = ''): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name), `${base}${e.name}/`) : [`${base}${e.name}`],
    )
  return {
    name: 'image-manifest',
    buildStart() {
      try {
        const dirs = ['public/productos', 'productos']
        const files = dirs.flatMap((dir) => fs.existsSync(dir) ? walk(dir, 'productos/') : []).filter((f) => /\.(webp|png|jpe?g)$/i.test(f))
        fs.writeFileSync('public/productos-manifest.json', JSON.stringify(files))
      } catch {
        /* productos dir missing — skip */
      }
    },
    closeBundle() {
      if (fs.existsSync('productos')) fs.cpSync('productos', 'dist/productos', { recursive: true })
    },
  };
}

const BUILD_ID = process.env.BUILD_ID || String(Date.now());

function buildId() {
  return {
    name: 'build-id',
    transformIndexHtml(html: string) {
      return html.replace(/__BUILD_ID__/, BUILD_ID);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    imageManifest(),
    buildId(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'https://assets.tecnicelu.store/favicon.svg',
        'https://assets.tecnicelu.store/icons.svg',
        'https://assets.tecnicelu.store/favicon/favicon.ico',
        'https://assets.tecnicelu.store/favicon/favicon-32x32.png',
        'https://assets.tecnicelu.store/favicon/favicon-16x16.png',
        'https://assets.tecnicelu.store/favicon/wordlogo-apple-touch-icon.png',
        'https://assets.tecnicelu.store/logos/*.webp',
        'https://assets.tecnicelu.store/logos/*.png',
        // First-party brand marks: WebP for the storefront, PNG kept for
        // social/OG consumers that do not accept WebP.
        'brand-mark-avatar.webp',
        'brand-mark-avatar.png',
        'brand-mark-with-wordmark.webp',
        'brand-mark-with-wordmark.png',
        'productos-manifest.json',
      ],
      manifest: {
        id: '/',
        name: 'TECNICELU S.A.',
        short_name: 'TECNICELU S.A.',
        description: 'Tienda online de tecnología en Colombia',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'es-CO',
        background_color: '#020617',
        theme_color: '#06b6d4',
        icons: [
          { src: 'https://assets.tecnicelu.store/favicon/wordlogo-apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
          { src: 'https://assets.tecnicelu.store/favicon/wordlogo-pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'https://assets.tecnicelu.store/favicon/wordlogo-pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        cacheId: `tecnicelu-static-${BUILD_ID}`,
        importScripts: ['/push-sw.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webm,mp4,woff2}'],
        globIgnores: ['**/productos/**/*', '**/logos/**/*', 'productos-manifest.json', 'dist/productos/**/*', '**/sw.js', '**/registerSW.js', '**/workbox-*.js'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `tecnicelu-assets-${BUILD_ID}`,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/productos\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `tecnicelu-product-img-${BUILD_ID}`,
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/logos\/.*|\/favicon\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `tecnicelu-assets2-${BUILD_ID}`,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/zustand')) return 'ui'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})