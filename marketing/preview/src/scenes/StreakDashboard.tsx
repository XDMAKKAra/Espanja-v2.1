import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from 'remotion';
import { brand } from '../brand';
import { PhoneFrame } from '../components/PhoneFrame';
import { BrowserChrome } from '../components/BrowserChrome';
import { CapturedAsset } from '../components/CapturedAsset';
import { WordReveal } from '../components/WordReveal';
import type { PreviewFormat } from '../PuheoPreview';

// Animate streak 1 → 7 → 23
const tickStreak = (frame: number) => {
  if (frame < 24) return Math.round(interpolate(frame, [0, 24], [1, 7], { extrapolateRight: 'clamp' }));
  if (frame < 70) return Math.round(interpolate(frame, [24, 70], [7, 23], { extrapolateRight: 'clamp' }));
  return 23;
};

export const StreakDashboard: React.FC<{ format: PreviewFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 12, 138, 150], [0, 1, 1, 0]);

  const streak = tickStreak(frame);
  // Flame scale-pulses on every integer change — derive from the *change frame*
  // by computing the nearest tick boundary
  const ticksFrames = [0, 24, 32, 38, 44, 50, 56, 62, 68];
  const lastTick = ticksFrames.filter((t) => frame >= t).pop() ?? 0;
  const flamePulse = spring({ frame: frame - lastTick, fps, config: { damping: 6, stiffness: 280, mass: 0.5 } });
  const flameScale = 1 + interpolate(flamePulse, [0, 1], [0.5, 0]) * 0.45;

  // Progress ring fills C → M (40% → 78%) with snap at the end
  const ringPct = interpolate(frame, [10, 100, 110], [0.4, 0.74, 0.78], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Confetti burst at frame 110 (ring snap)
  const confetti = frame >= 108 && frame < 138;
  const confettiSpring = spring({ frame: frame - 108, fps, config: { damping: 10 } });

  const ringSize = 240;
  const stroke = 18;
  const r = (ringSize - stroke) / 2;
  const c = 2 * Math.PI * r;

  const Ring = (
    <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
      <circle cx={ringSize / 2} cy={ringSize / 2} r={r} stroke={brand.border} strokeWidth={stroke} fill="none" />
      <circle
        cx={ringSize / 2}
        cy={ringSize / 2}
        r={r}
        stroke={brand.accent}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - ringPct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={brand.text}
        fontFamily={brand.fontDisplay}
        fontWeight={700}
        fontSize={48}
      >
        {Math.round(ringPct * 100)}%
      </text>
    </svg>
  );

  const Confetti = confetti ? (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const dist = 80 + interpolate(confettiSpring, [0, 1], [0, 200]);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const opacity = interpolate(frame - 108, [0, 5, 25, 30], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const colors = [brand.accent, brand.flagYellow, brand.flagRed, '#fff'];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 8,
              height: 14,
              background: colors[i % colors.length],
              borderRadius: 2,
              transform: `translate(${x}px, ${y}px) rotate(${i * 30}deg)`,
              opacity,
            }}
          />
        );
      })}
    </div>
  ) : null;

  if (format === 'landscape') {
    const browserW = Math.round(width * 0.50);
    const browserH = Math.round(browserW * (1080 / 1920));
    return (
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 90,
            padding: 80,
          }}
        >
          <div style={{ maxWidth: 540, textAlign: 'left' }}>
            <p
              style={{
                color: brand.accent,
                fontFamily: brand.fontMono,
                fontSize: 22,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Edistyminen
            </p>
            <h2
              style={{
                color: brand.text,
                fontFamily: brand.fontDisplay,
                fontWeight: 700,
                fontSize: 80,
                lineHeight: 1.05,
                margin: '14px 0 0',
                letterSpacing: '-0.02em',
              }}
            >
              <WordReveal text="10 minuuttia päivässä." startFrame={8} />
              <br />
              <span style={{ color: brand.accent }}>
                <WordReveal text="C → M." startFrame={32} staggerFrames={3} />
              </span>
            </h2>

            <div
              style={{
                marginTop: 36,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 22px',
                borderRadius: 999,
                background: brand.accentSoft,
                border: `1px solid ${brand.accent}`,
                color: brand.text,
                fontFamily: brand.fontDisplay,
                fontWeight: 600,
                fontSize: 32,
              }}
            >
              <span style={{ display: 'inline-block', transform: `scale(${flameScale})`, fontSize: 38 }}>🔥</span>
              {streak} pv putki
            </div>

            <div style={{ marginTop: 36, display: 'inline-block', position: 'relative' }}>
              {Ring}
              {Confetti}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <BrowserChrome width={browserW} height={browserH}>
              <CapturedAsset id="dashboard-desktop-clip" viewport="desktop" fallbackLabel="" />
              <div style={{ position: 'absolute', inset: 0 }}>
                <CapturedAsset id="dashboard" viewport="desktop" fallbackLabel="dashboard" />
              </div>
            </BrowserChrome>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Vertical
  const phoneW = 720;
  const phoneH = Math.round(phoneW * 2.16);
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 40,
          padding: 80,
        }}
      >
        <div style={{ maxWidth: 900, textAlign: 'center' }}>
          <p
            style={{
              color: brand.accent,
              fontFamily: brand.fontMono,
              fontSize: 22,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Edistyminen
          </p>
          <h2
            style={{
              color: brand.text,
              fontFamily: brand.fontDisplay,
              fontWeight: 700,
              fontSize: 72,
              lineHeight: 1.05,
              margin: '14px 0 0',
              letterSpacing: '-0.02em',
            }}
          >
            <WordReveal text="10 min päivässä." startFrame={8} />
            <br />
            <span style={{ color: brand.accent }}>
              <WordReveal text="C → M." startFrame={32} staggerFrames={3} />
            </span>
          </h2>
          <div
            style={{
              marginTop: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 22px',
              borderRadius: 999,
              background: brand.accentSoft,
              border: `1px solid ${brand.accent}`,
              color: brand.text,
              fontFamily: brand.fontDisplay,
              fontWeight: 600,
              fontSize: 32,
            }}
          >
            <span style={{ display: 'inline-block', transform: `scale(${flameScale})`, fontSize: 38 }}>🔥</span>
            {streak} pv putki
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <PhoneFrame width={phoneW} height={phoneH}>
            <CapturedAsset id="dashboard" viewport="mobile" fallbackLabel="dashboard" />
          </PhoneFrame>
          {Confetti}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
