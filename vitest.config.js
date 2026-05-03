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
        'lib/dailyCap.js',         // browser-side module that uses window/localStorage; covered by e2e
        'lib/curriculumData.js',   // pure data file (no logic to test)
        'lib/placementQuestions.js', // pure data file (no logic to test)
        'middleware/basicAuth.js', // pre-launch HTTP Basic gate; env-driven, covered by manual + integration
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
