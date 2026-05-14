/**
 * lazyScreen — F-ARCH-1 §A
 *
 * Wraps a screen module's `import()` factory so the network fetch is
 * deferred until the user navigates there for the first time, and the
 * one-time `init(deps)` is run exactly once per page lifetime.
 *
 * Why a wrapper at all: every Puheo screen is two-phase:
 *   1. init(deps) — wires DOM event handlers, runs at boot.
 *   2. show()/load() — runs every time the screen is navigated to.
 *
 * For lazy screens we need (1) to run when the module first lands, then
 * (2) to run on this and every subsequent call. The wrapper handles
 * that bookkeeping plus a 250 ms threshold spinner-shown-to-the-user.
 *
 *   const lazy = makeLazyScreen({
 *     key: "profile",
 *     factory: () => import("../screens/profile.js"),
 *     init: (mod, deps) => mod.initProfile(deps),
 *     deps: () => ({}),
 *   });
 *   await lazy(); // returns the module, init guaranteed once.
 */

const SPINNER_THRESHOLD_MS = 250;

export function makeLazyScreen({ key, factory, init, deps }) {
  let modulePromise = null;
  let initialised = false;

  return async function load() {
    if (!modulePromise) {
      // Surface a non-intrusive loading hint only if the network fetch
      // takes longer than 250 ms — anything faster feels instant.
      const timer = setTimeout(() => {
        document.documentElement.dataset.lazyLoading = key;
      }, SPINNER_THRESHOLD_MS);
      modulePromise = factory().finally(() => {
        clearTimeout(timer);
        delete document.documentElement.dataset.lazyLoading;
      });
    }
    const mod = await modulePromise;
    if (!initialised) {
      try {
        init(mod, typeof deps === "function" ? deps() : (deps || {}));
      } finally {
        initialised = true;
      }
    }
    return mod;
  };
}
