# Puheo · Preview reel (Remotion) — v2

Renders a ~30s preview video of the Puheo app in two formats:

- `out/puheo-preview-vertical.mp4` — 1080×1920 (TikTok / Reels / Shorts)
- `out/puheo-preview-landscape.mp4` — 1920×1080 (puheo.fi hero, YouTube)

**Landscape is the primary version** — most viewers see it on desktop. The
landscape composition leads with `<BrowserChrome>`-framed desktop captures;
the phone frame appears as a side-by-side companion in the vocab scene.

## Prerequisites

- Node 18+
- Repo `npm install` already done at the project root (Playwright 1.59 is there)
- `ffmpeg` + `ffprobe` on PATH (optional — converts `.webm` → `.mp4`, runs the
  beat detector. Falls back to `.webm` and a 120 BPM grid if missing.)
- `.env` at the repo root with **all four** test creds:
  - `TEST_PRO_EMAILS`, `TEST_PRO_PASSWORD`
  - `TEST_FREE_EMAILS`, `TEST_FREE_PASSWORD`

  Without Pro creds the script exits with code 2. Without Free creds it skips
  the paywall capture only.

## Three scripts (run from repo root)

```powershell
npm run preview:capture          # capture screenshots/clips with real auth
npm run preview:analyze-audio    # detect BPM + beats from public/audio/bed.mp3
npm run preview:studio           # open Remotion Studio for live editing
npm run preview:render           # render both MP4s into marketing/preview/out/
```

## Architecture

- `src/timing.ts` — per-scene start frames + total duration (30 fps, 900 frames).
- `src/PuheoPreview.tsx` — composition root. **Snaps every scene boundary to
  the nearest beat** (within ±6 frames) when `public/audio/beats.json` exists.
- `src/beats.ts` — `useBeats()` and `useBeatFrame(frame)` for snapping
  individual animation triggers (badge pops, ticks, etc.) inside scenes.
- `src/brand.ts` — palette + fonts mirrored from `/css/landing-tokens.css`.
- `src/components/PhoneFrame.tsx` — phone bezel for mobile captures.
- `src/components/BrowserChrome.tsx` — Mac-style browser frame for desktop
  captures (traffic lights, URL pill, tab title). Mirrors the PhoneFrame API.
- `src/components/WordReveal.tsx` — staggered word-by-word spring entrance.
  Default config matches the brief: `damping: 12, stiffness: 200, stagger: 4f`.
- `src/components/CapturedAsset.tsx` — looks up assets in
  `public/captures/manifest.json`. Falls back to a labelled placeholder if a
  capture is missing — render never crashes.
- `src/scenes/*.tsx` — six scenes (see roster below).

## Scene roster

| Frames | Scene | Notes |
| ------ | ----- | ----- |
| 0–90 | `ColdOpen` | Word-by-word reveal of "YO-koe lähestyy.", brand-color sweep, Spanish-flag underline |
| 90–180 | `LandingHero` | Landscape: real `<BrowserChrome>` desktop capture w/ slow Ken-Burns. Vertical: phone-centric |
| 180–360 | `VocabDrill` | Landscape: 60% browser + 40% phone, synchronised. Vertical: phone-centric. Overshoot springs on card transitions, +10 XP badge pop |
| 360–570 | `WritingHero` | **Hero.** Crossfade input → AI feedback. Score badge spring, **freeze + 8% push-in + dim mask**, yellow underline animates under "vengas", 6-frame camera shake on impact |
| 570–720 | `StreakDashboard` | 1→7→23 streak counter with flame scale-pulse on each tick, C→M progress ring with snap, confetti burst at 78% |
| 720–900 | `ClosingCTA` | Orbiting `<CapturedAsset>` thumbnails (vocab, writing, dashboard), wordmark spring-in, "Aloita YO-kertaus" CTA word-reveal with subtle pulse + 6-frame shake on entrance |

## Capture pipeline (v2)

`scripts/capture.mjs` does:

1. Reads `.env` for `TEST_PRO_EMAILS / TEST_PRO_PASSWORD / TEST_FREE_EMAILS /
   TEST_FREE_PASSWORD`.
2. For each viewport (`mobile 390×844`, `desktop 1920×1080`):
   - Captures public screens (landing, auth) without auth.
   - Logs in as **Pro** via the real `#auth-email` / `#auth-password` /
     `#btn-auth-submit` flow, then captures vocab / grammar / reading /
     writing / dashboard.
   - Logs in as **Free** in a separate context and captures the paywall
     (settings page is the most reliable upgrade-prompt surface).
3. Records six MP4/webm clips:
   - Mobile: `vocab-success-clip`, `writing-feedback-clip`, `dashboard-clip`
   - Desktop: `writing-feedback-desktop-clip`, `dashboard-desktop-clip`,
     `landing-desktop-clip`
   - The writing-feedback clips type a real Spanish answer
     ("Hola Marta…") and submit, recording the live AI grading animation —
     the hero shot.
4. Writes `public/captures/manifest.json`.

If a screen fails to render (auth-locked w/ login failure, network error),
a brand-coherent **stub overlay** kicks in so the still PNG is never blank.
Real screen takes precedence whenever it renders.

## Audio + beat detection

1. Drop a track at `public/audio/bed.mp3` (royalty-free, ~30s).
2. `npm run preview:analyze-audio` — uses ffmpeg's `astats` filter to extract
   an RMS curve, detects energy peaks above 1.6× rolling mean, and writes
   `public/audio/beats.json`:

   ```json
   { "bpm": 124, "beats": [0.481, 0.967, 1.452, ...], "source": "ffmpeg" }
   ```

   - Detection inconclusive? Falls back to a 120 BPM grid (`source: "fallback-auto"`).
   - No ffmpeg? Falls back to a 120 BPM grid (`source: "fallback-no-ffmpeg"`).
   - Force a tempo manually: `node marketing/preview/scripts/analyze-audio.mjs --bpm 132`.

3. The composition reads `beats.json` and **snaps each scene's start frame
   to the nearest beat** within ±6 frames (200ms @ 30 fps). Triggers inside a
   scene can use `useBeatFrame(targetFrame)` for the same snap.

### Tweaking the beat snap

- Snap radius too aggressive? Edit `snapRadius` in `PuheoPreview.tsx` and
  `useBeatFrame()` in `beats.ts`.
- Wrong beats? Either re-run with `--bpm <correct>` or hand-edit
  `beats.json` — the format is plain JSON.
- Cuts feel off-tempo even with correct beats? Adjust the scene start frames
  in `timing.ts` to land closer to a strong beat before snap kicks in.

## Recapturing after UI changes

Run `npm run preview:capture` again. The manifest is regenerated and
Remotion picks up the new files automatically. If the writing screen layout
shifts enough that the yellow underline overlay in `WritingHero.tsx` lands
on the wrong word, tweak its `left` / `top` constants to match.

## Positioning notes

The reel is positioned for **YO-koe revision**, not general Spanish learning.
All level references use the YO grade scale (I, A, B, C, M, E, L) — never
CEFR (A1, A2, B1, B2). The dashboard scene shows a `C → M` progression as
the YO-grade target, not `A2 → B1`.
