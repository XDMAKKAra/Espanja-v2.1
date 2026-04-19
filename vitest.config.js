import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.{js,mjs}', 'tests/**/*.spec.{js,mjs}'],
    exclude: ['tests/**/e2e-*.spec.js', 'node_modules/**', 'tests/training/e2e-*.spec.*'],
    globals: false,
    testTimeout: 10_000,
  },
});
