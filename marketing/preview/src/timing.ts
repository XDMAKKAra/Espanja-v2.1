// Per-scene timing in frames @ 30fps. Total 900 frames = 30s.
export const FPS = 30;
export const TOTAL_FRAMES = 900;

export type SceneTiming = {
  id: string;
  start: number;
  duration: number;
};

export const scenes: readonly SceneTiming[] = [
  { id: 'coldOpen', start: 0, duration: 90 }, // 0-3s
  { id: 'landingHero', start: 90, duration: 90 }, // 3-6s
  { id: 'vocabDrill', start: 180, duration: 180 }, // 6-12s
  { id: 'writingHero', start: 360, duration: 210 }, // 12-19s — hero
  { id: 'streakDashboard', start: 570, duration: 150 }, // 19-24s
  { id: 'closingCta', start: 720, duration: 180 }, // 24-30s
] as const;

// Cross-fade window between adjacent scenes (frames)
export const CROSSFADE = 8;
