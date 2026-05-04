import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from 'remotion';
import { brand } from '../brand';
import { CapturedAsset } from '../components/CapturedAsset';
import { BrowserChrome } from '../components/BrowserChrome';
import { WordReveal } from '../components/WordReveal';
import type { PreviewFormat } from '../PuheoPreview';

export const LandingHero: React.FC<{ format: PreviewFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Slow Ken-Burns
  const scale = interpolate(frame, [0, 90], [1.02, 1.10], { easing: Easing.out(Easing.cubic) });
  const pan = interpolate(frame, [0, 90], [0, -20]);

  const t = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });
  const opacity = interpolate(frame, [0, 12, 78, 90], [0, 1, 1, 0]);

  if (format === 'landscape') {
    // Landscape: real desktop landing capture inside BrowserChrome,
    // with the headline overlaid on the lower-left.
    const browserW = Math.round(width * 0.74);
    const browserH = Math.round(browserW * (1080 / 1920));
    return (
      <AbsoluteFill style={{ opacity }}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              transform: `scale(${scale}) translateY(${pan * 0.6}px)`,
              transformOrigin: 'center',
            }}
          >
            <BrowserChrome width={browserW} height={browserH}>
              {/* Prefer the desktop scroll clip if present; else still */}
              <CapturedAsset id="landing-desktop-clip" viewport="desktop" fallbackLabel="" />
              <div style={{ position: 'absolute', inset: 0, opacity: 0 }}>
                <CapturedAsset id="landing" viewport="desktop" fallbackLabel="Landing" />
              </div>
            </BrowserChrome>
          </div>
        </AbsoluteFill>

        {/* Vignette */}
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(to bottom, rgba(10,10,10,0.0) 60%, rgba(10,10,10,0.85) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Lower-left tagline */}
        <AbsoluteFill
          style={{
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            paddingBottom: 80,
            paddingLeft: 120,
          }}
        >
          <div
            style={{
              transform: `translateY(${interpolate(t, [0, 1], [30, 0])}px)`,
              opacity: t,
              maxWidth: 1100,
            }}
          >
            <p
              style={{
                color: brand.accent,
                fontFamily: brand.fontMono,
                fontSize: 22,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Puheo · espanjan YO-kertaus
            </p>
            <h2
              style={{
                color: brand.text,
                fontFamily: brand.fontDisplay,
                fontWeight: 700,
                fontSize: 92,
                lineHeight: 1.04,
                margin: '16px 0 0',
                letterSpacing: '-0.02em',
              }}
            >
              <WordReveal text="Pärjää espanjan YO-kokeessa." startFrame={10} />
            </h2>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Vertical: original phone-centric look
  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translateY(${pan}px)`,
          transformOrigin: 'center',
        }}
      >
        <CapturedAsset id="landing" viewport="mobile" fallbackBg={brand.bg} fallbackLabel="Landing" />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,10,0.0) 50%, rgba(10,10,10,0.85) 100%)',
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 220,
          paddingLeft: 60,
          paddingRight: 60,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            transform: `translateY(${interpolate(t, [0, 1], [30, 0])}px)`,
            opacity: t,
          }}
        >
          <p
            style={{
              color: brand.accent,
              fontFamily: brand.fontMono,
              fontSize: 28,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Puheo
          </p>
          <h2
            style={{
              color: brand.text,
              fontFamily: brand.fontDisplay,
              fontWeight: 700,
              fontSize: 72,
              lineHeight: 1.08,
              margin: '20px 0 0',
              letterSpacing: '-0.02em',
              maxWidth: 900,
            }}
          >
            <WordReveal text="Pärjää espanjan YO-kokeessa." startFrame={10} />
          </h2>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
