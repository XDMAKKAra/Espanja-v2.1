# Puheo preview v2 — beat-matched, real captures, desktop-first

Paste into Claude Code in the Puheo repo. This iterates on the existing `marketing/preview/` project — don't rebuild from scratch.

---

## What's wrong with v1

I watched the render. The phone frame and the vocab card are great — keep those. But:

1. **Wrong product positioning.** The dashboard scene shows "C → M (or whatever YO grade progression makes sense)" — that's CEFR scale, which is for general language courses. **Puheo is NOT a language course.** It's a YO-koe (ylioppilastutkinto) prep/revision course for Finnish high schoolers taking the matriculation exam in Spanish (lyhyt oppimäärä). The success metric is the YO grade scale: **I, A, B, C, M, E, L** (improbatur, approbatur, lubenter approbatur, cum laude approbatur, magna cum laude approbatur, eximia cum laude approbatur, laudatur). Every CEFR reference (A1, A2, B1, B2 etc.) in captures, overlays, captions, and the actual app must be replaced with YO grades. This is a positioning fix, not just copy — it changes who the product is for.
2. **Too phone-heavy.** Most viewers will see this on the puheo.fi website on a desktop/laptop. The landscape version especially needs to lead with desktop browser footage, not a centered phone.
3. **Too static and boring between scenes.** It feels like a slideshow with fades. I want kinetic energy — beat-matched cuts, parallax, scale punches on key frames, text that animates word-by-word, UI elements that pop in with overshoot springs.
4. **Auth-locked screens are still stubs.** I've now added real `TEST_PRO_EMAILS` and `TEST_FREE_EMAILS` (with passwords) to `.env`. Recapture for real.
5. **No music.** I'm dropping my own MP3 in. The cuts need to land on the beats.

## Tasks (in order)

### 0. Fix the CEFR → YO grade positioning everywhere (do this first)

This is the most important change. Before recapturing anything:

- **Audit the codebase** for CEFR references: grep for `A1`, `A2`, `B1`, `B2`, `C1`, `C2`, `CEFR`, and Finnish equivalents in `app.html`, `app.js`, `index.html`, `routes/`, `lib/`, email templates, and any docs under `docs/`. Show me a list of every hit before changing anything — some may be legitimate (e.g. internal difficulty tags) and I'll tell you which to keep.
- **Replace user-facing CEFR mentions with YO grade scale**: I, A, B, C, M, E, L (improbatur → laudatur). Where the app currently shows a level progression, it should show a YO grade target / current estimate.
  - Dashboard "level" widget → "YO-tavoite: M" or "Nykyinen taso: C → tavoite M".
  - Progress ring → fills toward a YO grade goal, not a CEFR band.
  - Any onboarding "what's your level" question → "Mihin YO-arvosanaan tähtäät?" with options I, A, B, C, M, E, L.
- **Re-capture** after the code changes so the screenshots reflect the corrected UI. The video is downstream of the app — don't paper over it with overlays.
- **Update every video caption** that implies "language learning" to instead imply "YO-koe revision":
  - Hook line options: "YO-koe lähestyy.", "Espanjan YO, valmiina.", "Laudaturin matka alkaa tästä.", "I:stä L:ään."
  - CTA: "Aloita YO-kertaus" instead of "Aloita ilmaiseksi" (or both).
  - Anywhere it currently says "Spanish learning" / "kielikurssi" / "oppia espanjaa" → "YO-kertauskurssi" / "espanjan YO-valmennus".
- The Finnish hook copy should make it unmistakable in the first 2 seconds that this is **YO-koe revision**, not Duolingo. Lukio students searching for "espanjan yo kertaus" should recognize themselves immediately.

If you find that the app codebase itself uses CEFR pervasively and changing it is a much bigger job than the video preview warrants, **stop and tell me** — I'd rather scope that as a separate task than have you half-rip-out CEFR across the app.

### 1. Wire up real auth-gated captures

Update `marketing/preview/scripts/capture.mjs`:

- Read `TEST_PRO_EMAILS`, `TEST_PRO_PASSWORD`, `TEST_FREE_EMAILS`, `TEST_FREE_PASSWORD` from `.env`. (If the password vars aren't there, log clearly and stop — don't silently fall back to stubs.)
- Add a `loginAs(page, email, password)` helper that walks through the actual login flow (find the email field, type, find password, type, submit, wait for the post-login screen).
- Re-capture: vocab mid-question, vocab success state, grammar drill, reading task, writing task with text typed, **writing task showing AI feedback** (this is the hero shot — give it extra love), dashboard with streak + progress.
- Capture both as Pro (so paid features show) and as Free (so we have one shot of the upgrade prompt / paywall, if there is one — gives the video a CTA moment).
- For the writing AI feedback: type a *real* short Spanish answer, hit submit, and **record video** (not just a screenshot) of the feedback rendering — that animation is the wow moment.

### 2. Heavy desktop capture pass

Right now we have 1440×900 desktop captures but the video barely uses them. Change that:

- At 1920×1080 (not 1440×900) capture every screen in a Chrome window with realistic chrome — use Playwright's headed mode in capture if it gives a nicer result, or a chromeless screenshot wrapped later in a Remotion `<BrowserChrome>` component (URL bar showing `puheo.fi/app`, tab title "Puheo", close/min/max buttons, light or dark per OS preference).
- Build a `<BrowserChrome>` component in `src/components/BrowserChrome.tsx` mirroring the existing `<PhoneFrame>` API. Drop shadow, rounded corners, the works.
- Capture short *interaction recordings* on desktop too: hovering nav items, scrolling the dashboard, opening the writing task. Desktop scroll recordings parallax really well.

### 3. Recompose the landscape version (1920×1080)

Make landscape its own scene file set, not just a stretched vertical. Landscape is the primary version since most viewers are on PC.

Suggested landscape structure (~30s @ 30fps):

1. **Hook (0–2.5s)** — Big Finnish text fills the frame: word-by-word reveal, each word springs in on a beat. Brand-color sweep behind it.
2. **Landing in browser (2.5–5s)** — Real landing-page capture inside `<BrowserChrome>`, slow parallax zoom. Tagline overlays. Cuts to next scene on a beat.
3. **Vocab desktop (5–10s)** — Side-by-side: 60% width browser showing the vocab screen on desktop, 40% width phone frame showing the same flow. Synchronized — when desktop shows the question, phone shows the answer being tapped. Cards crossfade with overshoot springs.
4. **Writing AI grade (10–17s)** — Hero moment. Browser fills the frame. Spanish text types on (use the actual recorded video clip). When the AI feedback appears, **freeze the frame, push in 8% scale, dim everything except the score badge**, then unfreeze and let a yellow underline animate under the corrected word. Big Finnish caption: "AI-palaute sekunneissa." word-by-word.
5. **Streak + dashboard (17–22s)** — Browser dashboard. Numbers tick: 1 → 7 → 23 days, flame scales on each tick (overshoot spring, not linear). Progress ring fills C → M (or whatever YO grade progression makes sense) with a satisfying snap at the end. Confetti burst at the snap.
6. **CTA (22–30s)** — Browser zooms out, dashboard becomes a small thumbnail floating among 2-3 other screen thumbnails (vocab card, writing feedback, streak). Thumbnails orbit gently. Domain + "Aloita ilmaiseksi" button overlaid, button has a subtle hover-state animation. Hold 1.5s, fade.

Vertical (1080×1920) keeps the phone-centric structure since that's where it'll play, but apply the same animation upgrades.

### 4. Animation upgrades (apply to both formats)

This is the boring → kinetic part. Concrete rules:

- **Word-by-word text reveals** for any caption longer than 3 words. Each word: spring in with `damping: 12, stiffness: 200`, stagger 4 frames apart.
- **Overshoot springs everywhere.** Use `spring({ frame, fps, config: { damping: 10, stiffness: 180, mass: 0.6 } })` as the default — this gives a satisfying punch.
- **Parallax on every static screenshot.** Slow zoom (1.0 → 1.08 over scene duration) plus a 2-3% pan in a direction that makes sense for the next cut.
- **Number counters animate**, never just appear. Streak goes 0→1→2→...→23 in 30 frames with a flame scale-pulse on each integer change.
- **Highlights and emphasis.** When the AI feedback shows the score, everything else dims to 40% opacity for 12 frames while the score badge scales 1.0 → 1.15 → 1.0.
- **Transitions between scenes:** alternate between (a) whip-pan blur (short motion blur + horizontal slide), (b) scale-and-fade (next scene starts at 1.1 scale and settles), (c) mask wipe in brand color. Don't repeat the same transition twice in a row.
- **Camera shake** — tiny (1–2px), 6-frame, applied on the "moment of impact" frames: AI score badge appearing, streak hitting 23, CTA button revealing.

### 5. Beat-matched audio

I will drop my MP3 at `marketing/preview/public/audio/bed.mp3` before re-rendering. Build the comp so cuts land on beats:

- Add a beat-detection pass to `capture.mjs` (or a new `scripts/analyze-audio.mjs`): use `web-audio-beat-detector` or run a quick ffmpeg + `aubio` pass to extract beat timestamps. Output `marketing/preview/public/audio/beats.json` with `{ bpm, beats: number[] }`.
- In `src/timing.ts`, read `beats.json` if it exists and snap scene boundaries to the nearest beat. If the file doesn't exist, fall back to the manual timing.
- Major animation triggers (text word reveals, score badge pop, streak ticks, CTA button) should also align to beats — provide a `useBeatFrame()` hook that returns the closest beat frame to a given target frame.
- If the track is too long, loop the comp's last scene or trim the audio with `<Audio startFrom={...} endAt={...} />`.

Tell me what BPM the script detected and which scene boundaries you snapped — I want to sanity-check.

### 6. Quality bar

- Don't break v1 — both vertical and landscape compositions render successfully.
- Strict TS, no `any`.
- Update `marketing/preview/README.md` with the new scripts, the audio drop-in instructions, and a "tweaking the beat snap" section.
- After rendering, **open both MP4s yourself with `start` and confirm** the AI feedback scene actually freezes and pushes in, the streak counter actually ticks (not just fades in), and at least 80% of the major cuts land within 2 frames of a beat.

## Order of work

1. **CEFR → YO grade audit and fix (step 0). Do this first and confirm with me before continuing.**
2. Recapture with real auth (step 1) — captures must reflect the YO grade UI.
3. Heavy desktop pass + `<BrowserChrome>` component (step 2).
4. Beat analysis script + `beats.json` (step 5, the analysis half — I'll drop the MP3 when you tell me you're ready).
5. Landscape recomp (step 3).
6. Animation upgrades pass on both compositions (step 4).
7. Render, watch, fix.

If anything's blocked (login flow doesn't work the way you expected, beat detection library is flaky, my MP3 isn't there yet), stop and tell me — don't ship something half-baked.
