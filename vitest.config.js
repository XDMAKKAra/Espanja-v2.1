import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.{js,mjs}', 'tests/**/*.spec.{js,mjs}'],
    exclude: ['tests/**/e2e-*.spec.js', 'node_modules/**', 'tests/training/e2e-*.spec.*'],
    globals: false,
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['lib/**/*.js', 'middleware/**/*.js'],
      exclude: [
        'lib/openai.js',           // thin OpenAI wrapper; covered by fixtures, not worth threshold
        '**/*.test.js',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
