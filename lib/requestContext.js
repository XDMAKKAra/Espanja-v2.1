// lib/requestContext.js — per-request memoization via AsyncLocalStorage.
//
// L-V340 finding #3: the authenticated AI path makes many redundant Supabase
// round-trips per request — isPro() is computed twice (once in
// checkMonthlyCostLimit, once inside getUserTier), and user_profile is read
// 3-4 times. Under a slow/contended database those serial round-trips are the
// first bottleneck (throughput collapsed ~150× at +50ms/query in the load
// test).
//
// This gives each request its own memo Map so a value computed once (e.g. the
// user's tier) is reused for the rest of that request. It memoizes ONLY within
// a single request: outside a request context (unit tests calling isPro
// directly, scripts) memoizeRequest just runs the function, so there is never
// any cross-request staleness — a user who upgrades sees it on their very next
// request.

import { AsyncLocalStorage } from "node:async_hooks";

export const requestStore = new AsyncLocalStorage();

// Express middleware: start a fresh memo Map for each request. Register early
// (before the routes) so every downstream handler shares the same context.
export function requestContextMiddleware(req, res, next) {
  // Escape hatch for the load test's memo-on/off A/B benchmark only.
  if (process.env.DISABLE_REQUEST_MEMO === "1") return next();
  requestStore.run(new Map(), () => next());
}

// L-V392 P1-3: per-request Supabase client. requireAuth stashes the RLS-scoped
// req.supabase here so helper functions deep in the call stack can run user
// queries through the user-scoped client (RLS enforces isolation) without
// threading it through every signature. Outside a request, or before auth ran,
// getRequestDb returns the admin fallback the caller passes — so cron jobs,
// webhooks, and unit tests keep working unchanged.
export function setRequestDb(db) {
  const store = requestStore.getStore();
  if (store && db) store.set("__db", db);
}
export function getRequestDb(adminFallback) {
  const store = requestStore.getStore();
  return (store && store.get("__db")) || adminFallback;
}

// Memoize an async computation for the lifetime of the current request.
// Stores the PROMISE (not the resolved value) so two awaits firing back-to-back
// within one request share a single in-flight DB call.
export function memoizeRequest(key, fn) {
  const store = requestStore.getStore();
  if (!store) return fn();
  if (store.has(key)) return store.get(key);
  const p = fn();
  store.set(key, p);
  return p;
}
