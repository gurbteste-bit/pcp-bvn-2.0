import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Identificador do build: o app compara com /version.json do servidor para saber se há versão nova publicada
const BUILD_ID = String(Date.now())

export default defineConfig({
  define: {
    __APP_BUILD__: JSON.stringify(BUILD_ID),
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  plugins: [
    {
      name: 'pcp-version-json',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) })
      },
    },
    react({
      jsxRuntime: 'automatic',
      babel: {
        parserOpts: {
          sourceType: 'module',
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true
        }
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
      },
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon.png'
      ],
      manifest: {
        name: 'BVN PCP — Controle de Produção',
        short_name: 'BVN PCP',
        description: 'PCP — Controle de Produção (BVN Hidráulica e Pneumática)',
        theme_color: '#1B1B1F',
        background_color: '#1B1B1F',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
})
