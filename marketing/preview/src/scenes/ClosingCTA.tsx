import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from 'remotion';
import { brand } from '../brand';
import { CapturedAsset } from '../components/CapturedAsset';
import { WordReveal } from '../components/WordReveal';
import type { PreviewFormat } from '../PuheoPreview';

const ORBIT_THUMBS: Array<{ id: string; viewport: 'mobile' | 'desktop' }> = [
  { id: 'vocab-success', viewport: 'mobile' },
  { id: 'writing-feedback', viewport: 'desktop' },
  { id: 'dashboard', viewport: 'mobile' },
];

export const ClosingCTA: React.FC<{ format: PreviewFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const accentOpacity = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const wordmarkSpring = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });
  const wordmarkY = interpolate(wordmarkSpring, [0, 1], [40, 0]);
  const wordmarkOpacity = interpolate(frame, [20, 40, 160, 180], [0, 1, 1, 0]);

  const ctaSpring = spring({ frame: frame - 50, fps, config: { damping: 9, stiffness: 220, mass: 0.5 } });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0.85, 1.0]);
  const ctaPulse = 1 + 0.04 * Math.sin((frame - 60) * 0.18);
  const ctaOpacity = interpolate(frame, [50, 70, 160, 180], [0, 1, 1, 0]);

  // Tiny shake on CTA reveal (frames 50–56)
  const ctaShake = frame >= 50 && frame < 56 ? Math.sin(frame * 4) * 1.2 : 0;

  // Orbiting thumbnails — gentle rotation around the CTA
  const orbitAngle = (frame / 90) * Math.PI * 2; // 1 full rev / 3s
  const thumbRadius = format === 'landscape' ? 360 : 280;
  const thumbW = format === 'landscape' ? 220 : 200;
  const thumbH = Math.round(thumbW * 0.75);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: brand.bg }} />
      <AbsoluteFill
        style={{
          opacity: accentOpacity,
          background: `radial-gradient(circle at 50% 50%, ${brand.accentGlow} 0%, rgba(10,10,10,1) 70%)`,
        }}
      />

      {/* Orbiting thumbs */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 0, height: 0 }}>
          {ORBIT_THUMBS.map((thumb, i) => {
            const a = orbitAngle + (i / ORBIT_THUMBS.length) * Math.PI * 2;
            const x = Math.cos(a) * thumbRadius;
            const y = Math.sin(a) * thumbRadius * 0.55; // squashed for perspective
            const z = Math.sin(a); // depth proxy [-1, 1]
            const scale = 0.85 + 0.18 * (z * 0.5 + 0.5);
            const opacity = interpolate(frame, [70, 100, 150, 170], [0, 0.6, 0.6, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }) * (0.55 + 0.45 * (z * 0.5 + 0.5));
            return (
              <div
                key={thumb.id + i}
                style={{
                  position: 'absolute',
                  width: thumbW,
                  height: thumbH,
                  left: -thumbW / 2,
                  top: -thumbH / 2,
                  transform: `translate(${x}px, ${y}px) scale(${scale})`,
                  opacity,
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: `1px solid ${brand.border}`,
                  boxShadow: `0 18px 60px rgba(0,0,0,0.5)`,
                  background: brand.bgElevated,
                }}
              >
                <CapturedAsset id={thumb.id} viewport={thumb.viewport} fallbackLabel={thumb.id} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            transform: `translateY(${wordmarkY}px)`,
            opacity: wordmarkOpacity,
          }}
        >
          <h1
            style={{
              color: brand.text,
              fontFamily: brand.fontDisplay,
              fontWeight: 700,
              fontSize: format === 'vertical' ? 180 : 220,
              margin: 0,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            Puhe<span style={{ color: brand.accent }}>o</span>
          </h1>
          <p
            style={{
              color: brand.textMuted,
              fontFamily: brand.fontMono,
              fontSize: format === 'vertical' ? 32 : 30,
              margin: '24px 0 0',
              letterSpacing: '0.04em',
            }}
          >
            {brand.domain}
          </p>
        </div>

        <div
          style={{
            marginTop: 60,
            transform: `translate(${ctaShake}px, 0) scale(${ctaScale * ctaPulse})`,
            opacity: ctaOpacity,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              padding: '24px 44px',
              borderRadius: 999,
              background: brand.accent,
              color: '#0a0a0a',
              fontFamily: brand.fontDisplay,
              fontWeight: 700,
              fontSize: format === 'vertical' ? 44 : 40,
              boxShadow: `0 18px 60px ${brand.accentGlow}`,
            }}
          >
            <WordReveal text="Aloita YO-kertaus" startFrame={55} staggerFrames={4} />
            <span style={{ fontSize: '0.9em' }}>→</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
