import React from 'react';
import { staticFile } from 'remotion';
import { FPS } from './timing';

export type BeatsFile = {
  bpm: number;
  beats: number[]; // seconds
  source?: string;
  durationSec?: number | null;
};

const FALLBACK: BeatsFile = { bpm: 120, beats: [] };
let cached: BeatsFile | null = null;

export const useBeats = (): BeatsFile => {
  const [b, setB] = React.useState<BeatsFile>(cached ?? FALLBACK);
  React.useEffect(() => {
    if (cached) return;
    let cancel = false;
    fetch(staticFile('audio/beats.json'))
      .then((r) => (r.ok ? r.json() : FALLBACK))
      .then((data: BeatsFile) => {
        if (cancel) return;
        cached = data;
        setB(data);
      })
      .catch(() => { cached = FALLBACK; });
    return () => { cancel = true; };
  }, []);
  return b;
};

/**
 * Snap a target frame to the nearest beat. If beats.json missing or empty,
 * returns the input frame unchanged. Snap radius is 6 frames @ 30fps (~200ms)
 * so unrelated triggers don't drift wildly.
 */
export const useBeatFrame = (targetFrame: number, snapRadius = 6): number => {
  const beats = useBeats();
  if (!beats.beats?.length) return targetFrame;
  const targetSec = targetFrame / FPS;
  let nearest = beats.beats[0];
  let nearestDist = Math.abs(targetSec - nearest);
  for (const t of beats.beats) {
    const d = Math.abs(targetSec - t);
    if (d < nearestDist) { nearest = t; nearestDist = d; }
  }
  const snappedFrame = Math.round(nearest * FPS);
  if (Math.abs(snappedFrame - targetFrame) > snapRadius) return targetFrame;
  return snappedFrame;
};
