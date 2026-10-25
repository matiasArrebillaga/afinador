import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  base: '/afinador/',
  plugins: [preact(), basicSsl()],
  server: { host: true },
  test: { include: ['tests/**/*.test.ts'], passWithNoTests: true },
});
