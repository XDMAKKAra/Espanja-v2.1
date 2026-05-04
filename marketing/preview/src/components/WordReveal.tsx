import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

type Props = {
  text: string;
  /** Frame inside the local Sequence where the first word starts */
  startFrame?: number;
  /** Frames between consecutive word entries */
  staggerFrames?: number;
  /** Springs config — the brief asks for damping:12 stiffness:200 by default */
  damping?: number;
  stiffness?: number;
  style?: React.CSSProperties;
};

/**
 * Spring-staggered word-by-word entrance. Each word springs up + fades in.
 * `damping: 12, stiffness: 200, stagger: 4 frames` matches the brief default.
 */
export const WordReveal: React.FC<Props> = ({
  text,
  startFrame = 0,
  staggerFrames = 4,
  damping = 12,
  stiffness = 200,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');
  return (
    <span style={{ display: 'inline-block', ...style }}>
      {words.map((w, i) => {
        const localFrame = frame - startFrame - i * staggerFrames;
        const s = spring({ frame: localFrame, fps, config: { damping, stiffness, mass: 0.6 } });
        const y = interpolate(s, [0, 1], [24, 0]);
        const opacity = interpolate(s, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
        return (
          <span
            key={`${w}-${i}`}
            style={{
              display: 'inline-block',
              transform: `translateY(${y}px)`,
              opacity,
              marginRight: '0.28em',
              willChange: 'transform, opacity',
            }}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
};
