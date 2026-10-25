import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

const BASE = '/afinador/';

export default defineConfig({
  base: BASE,
  plugins: [
    preact(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        // Explicit id/scope: other PWAs live on the same github.io origin.
        id: BASE,
        scope: BASE,
        start_url: BASE,
        name: 'Afinador',
        short_name: 'Afinador',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0b0b',
        theme_color: '#0b0b0b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg}'] },
    }),
  ],
  server: { host: true },
  test: { include: ['tests/**/*.test.ts'], passWithNoTests: true },
});
