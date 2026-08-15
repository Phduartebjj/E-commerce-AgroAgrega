import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/app/core'),
      '@features': path.resolve(__dirname, './src/app/features'),
      '@mocks': path.resolve(__dirname, './src/app/mocks'),
      '@models': path.resolve(__dirname, './src/app/models'),
    },
  },
});
