import js from "@eslint/js";

const browserGlobals = {
  document: "readonly",
  window: "readonly",
  self: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  indexedDB: "readonly",
  navigator: "readonly",
  location: "readonly",
  history: "readonly",
  alert: "readonly",
  confirm: "readonly",
  prompt: "readonly",
  matchMedia: "readonly",
  getComputedStyle: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  queueMicrotask: "readonly",
  performance: "readonly",
  atob: "readonly",
  btoa: "readonly",
  Element: "readonly",
  HTMLElement: "readonly",
  Node: "readonly",
  CustomEvent: "readonly",
  Event: "readonly",
  KeyboardEvent: "readonly",
  MouseEvent: "readonly",
  IntersectionObserver: "readonly",
  MutationObserver: "readonly",
  ResizeObserver: "readonly",
  Notification: "readonly",
  Worker: "readonly",
  Image: "readonly",
  ImageData: "readonly",
  OffscreenCanvas: "readonly",
  DOMMatrix: "readonly",
  Path2D: "readonly",
  Blob: "readonly",
  File: "readonly",
  FileReader: "readonly",
  FormData: "readonly",
  PushManager: "readonly",
  ServiceWorkerRegistration: "readonly",
};

const nodeGlobals = {
  Buffer: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  global: "readonly",
};

const vitestGlobals = {
  describe: "readonly",
  it: "readonly",
  test: "readonly",
  expect: "readonly",
  beforeAll: "readonly",
  beforeEach: "readonly",
  afterAll: "readonly",
  afterEach: "readonly",
  vi: "readonly",
};

const serviceWorkerGlobals = {
  self: "readonly",
  caches: "readonly",
  clients: "readonly",
  Response: "readonly",
  Request: "readonly",
  Headers: "readonly",
  FormData: "readonly",
  Blob: "readonly",
  registration: "readonly",
  skipWaiting: "readonly",
  importScripts: "readonly",
};

export default [
  js.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
        fetch: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        crypto: "readonly",
        ...nodeGlobals,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
      // Empty catch blocks are an idiomatic "best-effort" pattern in this codebase
      // (e.g. `try { localStorage.setItem(...) } catch {}` for private-mode browsers).
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // Browser-shipped frontend code (extends both .js and .mjs to cover vendored libs)
  {
    files: ["js/**/*.{js,mjs}", "app.js", "lib/dailyCap.js"],
    languageOptions: { globals: browserGlobals },
  },

  // Vendored third-party libs may legitimately re-declare polyfilled globals
  {
    files: ["js/vendor/**/*"],
    rules: {
      "no-redeclare": "off",
      "no-unused-vars": "off",
    },
  },

  // Service worker
  {
    files: ["sw.js", "sw/**/*.js"],
    languageOptions: { globals: serviceWorkerGlobals },
  },

  // Vitest unit tests — Node + browser globals + vitest helpers
  {
    files: ["tests/**/*.{js,mjs}"],
    languageOptions: {
      globals: { ...browserGlobals, ...vitestGlobals, ...nodeGlobals },
    },
  },

  // Playwright agent-test scripts that drive a real browser via page.evaluate
  {
    files: ["scripts/agent-test/**/*.{js,mjs}", "training/**/*.{js,mjs}", "ui-ux/**/*.{js,mjs}"],
    languageOptions: {
      globals: { ...browserGlobals, ...nodeGlobals },
    },
    rules: {
      // These are throwaway debug scripts — irregular whitespace from copy-paste is OK.
      "no-irregular-whitespace": "off",
    },
  },

  // Testing harness env shims
  {
    files: ["testing/**/*.{js,mjs}"],
    languageOptions: { globals: { __ENV: "readonly" } },
  },

  {
    ignores: [
      "node_modules/",
      ".vercel/",
      ".agents/",
      ".venv/",
      ".superpowers/",
      "coverage/",
      "playwright-report/",
      "test-results/",
    ],
  },
];
