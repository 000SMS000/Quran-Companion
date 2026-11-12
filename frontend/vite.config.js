import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    restoreMocks: true,
    sequence: {
      concurrent: false,
    },
  },
});
