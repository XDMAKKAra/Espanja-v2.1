import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { brand } from '../brand';
import { WordReveal } from '../components/WordReveal';
import type { PreviewFormat } from '../PuheoPreview';

export const ColdOpen: React.FC<{ format: PreviewFormat }> = ({ format }) => {
  const frame = useCurrentFrame();

  const bgOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Brand-color sweep behind the text (left → right wash)
  const sweepX = interpolate(frame, [0, 60], [-100, 100], {
    easing: Easing.out(Easing.quad),
  });

  // Spanish flag underline draw 36→66
  const underlineProgress = interpolate(frame, [36, 66], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Scene exit fade 80→90
  const exit = interpolate(frame, [80, 90], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleSize = format === 'vertical' ? 130 : 156;

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <AbsoluteFill style={{ background: '#000', opacity: 1 - bgOpacity }} />
      {/* Brand sweep wash */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(120deg, transparent 0%, ${brand.accentGlow} 50%, transparent 100%)`,
          transform: `translateX(${sweepX}%)`,
          mixBlendMode: 'screen',
          opacity: 0.55,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: format === 'vertical' ? 60 : 120,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              color: brand.text,
              fontFamily: brand.fontDisplay,
              fontWeight: 700,
              fontSize: titleSize,
              lineHeight: 1.05,
              margin: 0,
              letterSpacing: '-0.03em',
            }}
          >
            <WordReveal text="YO-koe lähestyy." startFrame={18} staggerFrames={6} />
          </h1>
          <div
            style={{
              marginTop: 36,
              height: 14,
              width: 360,
              marginLeft: 'auto',
              marginRight: 'auto',
              borderRadius: 7,
              overflow: 'hidden',
              transform: `scaleX(${underlineProgress})`,
              transformOrigin: 'left center',
              display: 'flex',
            }}
          >
            <div style={{ flex: 1, background: brand.flagRed }} />
            <div style={{ flex: 1, background: brand.flagYellow }} />
            <div style={{ flex: 1, background: brand.flagRed }} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
