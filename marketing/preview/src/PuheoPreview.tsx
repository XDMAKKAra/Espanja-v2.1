import React from 'react';
import { AbsoluteFill, Sequence, Audio, staticFile } from 'remotion';
import { brand } from './brand';
import { scenes, FPS } from './timing';
import { ColdOpen } from './scenes/ColdOpen';
import { LandingHero } from './scenes/LandingHero';
import { VocabDrill } from './scenes/VocabDrill';
import { WritingHero } from './scenes/WritingHero';
import { StreakDashboard } from './scenes/StreakDashboard';
import { ClosingCTA } from './scenes/ClosingCTA';
import { useManifest } from './components/CapturedAsset';
import { useBeats } from './beats';

export type PreviewFormat = 'vertical' | 'landscape';
export type PreviewProps = { format: PreviewFormat };

const SCENE_COMPONENTS = {
  coldOpen: ColdOpen,
  landingHero: LandingHero,
  vocabDrill: VocabDrill,
  writingHero: WritingHero,
  streakDashboard: StreakDashboard,
  closingCta: ClosingCTA,
} as const;

const AUDIO_SRC = 'audio/bed.mp3';

// Snap a frame to the nearest beat if the offset is within `snapRadius`.
const snapToBeat = (frame: number, beats: number[], snapRadius = 6): number => {
  if (!beats.length) return frame;
  const sec = frame / FPS;
  let nearest = beats[0];
  let dist = Math.abs(sec - nearest);
  for (const t of beats) {
    const d = Math.abs(sec - t);
    if (d < dist) { dist = d; nearest = t; }
  }
  const snapped = Math.round(nearest * FPS);
  return Math.abs(snapped - frame) <= snapRadius ? snapped : frame;
};

export const PuheoPreview: React.FC<PreviewProps> = ({ format }) => {
  const manifest = useManifest();
  const beatsFile = useBeats();
  const hasAudio = manifest.audioAvailable;

  // Snap each scene boundary to nearest beat (within ±6 frames @ 30fps).
  const snapped = scenes.map((s) => {
    const newStart = snapToBeat(s.start, beatsFile.beats);
    return { ...s, start: newStart };
  });
  // Adjust each duration so neighbours don't overlap
  for (let i = 0; i < snapped.length - 1; i++) {
    snapped[i].duration = snapped[i + 1].start - snapped[i].start;
  }

  return (
    <AbsoluteFill style={{ background: brand.bg, fontFamily: brand.fontBody }}>
      <AbsoluteFill style={{ background: brand.bgGradient }} />

      {snapped.map((s) => {
        const Comp = SCENE_COMPONENTS[s.id as keyof typeof SCENE_COMPONENTS];
        if (!Comp) return null;
        return (
          <Sequence key={s.id} from={s.start} durationInFrames={s.duration}>
            <Comp format={format} />
          </Sequence>
        );
      })}

      {hasAudio ? <Audio src={staticFile(AUDIO_SRC)} volume={0.6} /> : null}
    </AbsoluteFill>
  );
};
