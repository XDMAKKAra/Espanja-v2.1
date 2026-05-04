import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { brand } from '../brand';
import { PhoneFrame } from '../components/PhoneFrame';
import { BrowserChrome } from '../components/BrowserChrome';
import { CapturedAsset } from '../components/CapturedAsset';
import { WordReveal } from '../components/WordReveal';
import type { PreviewFormat } from '../PuheoPreview';

export const VocabDrill: React.FC<{ format: PreviewFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 10, stiffness: 180, mass: 0.6 } });
  const phoneY = interpolate(enter, [0, 1], [80, 0]);
  const sceneOpacity = interpolate(frame, [0, 15, 168, 180], [0, 1, 1, 0]);

  // Crossfade: question → success at frame 80 (overshoot spring)
  const successSpring = spring({ frame: frame - 80, fps, config: { damping: 10, stiffness: 200, mass: 0.6 } });
  const successOpacity = interpolate(successSpring, [0, 1], [0, 1], { extrapolateRight: 'clamp' });

  // +XP badge spring at frame 100
  const xpSpring = spring({ frame: frame - 100, fps, config: { damping: 8, stiffness: 220, mass: 0.5 } });
  const xpScale = interpolate(xpSpring, [0, 1], [0.3, 1.05]);
  const xpOpacity = interpolate(frame, [100, 115, 165, 180], [0, 1, 1, 0]);

  // Parallax on the captures: slow zoom 1.0 → 1.06 over the scene
  const parallaxScale = interpolate(frame, [0, 180], [1.0, 1.06]);

  if (format === 'landscape') {
    // 60% browser / 40% phone, side by side. Synchronised: when browser shows
    // question, phone shows the answer. Phone is offset slightly for depth.
    const browserW = Math.round(width * 0.46);
    const browserH = Math.round(browserW * (1080 / 1920));
    const phoneW = 320;
    const phoneH = Math.round(phoneW * 2.16);

    return (
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 60,
            padding: 80,
          }}
        >
          {/* Caption */}
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
              Sanasto
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
              <WordReveal text="2 000+ sanaa." startFrame={10} />
              <br />
              <span style={{ color: brand.textMuted, fontSize: 38, fontWeight: 500 }}>
                <WordReveal text="Toistoväli kasvaa kun muistat." startFrame={32} staggerFrames={3} />
              </span>
            </h2>
          </div>

          {/* Browser */}
          <div style={{ position: 'relative', transform: `scale(${parallaxScale})` }}>
            <BrowserChrome width={browserW} height={browserH}>
              <div style={{ position: 'absolute', inset: 0 }}>
                <CapturedAsset id="vocab-question" viewport="desktop" fallbackLabel="vocab" />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: successOpacity }}>
                <CapturedAsset id="vocab-success" viewport="desktop" fallbackLabel="vocab-success" />
              </div>
            </BrowserChrome>
          </div>

          {/* Phone */}
          <div
            style={{
              position: 'relative',
              transform: `translateY(${phoneY}px) scale(${parallaxScale})`,
              alignSelf: 'center',
            }}
          >
            <PhoneFrame width={phoneW} height={phoneH}>
              <div style={{ position: 'absolute', inset: 0 }}>
                <CapturedAsset id="vocab-question" viewport="mobile" fallbackLabel="vocab" />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: successOpacity }}>
                <CapturedAsset id="vocab-success" viewport="mobile" fallbackLabel="vocab-success" />
              </div>
            </PhoneFrame>
            {/* +XP badge */}
            <div
              style={{
                position: 'absolute',
                top: 80,
                right: -30,
                transform: `scale(${xpScale})`,
                opacity: xpOpacity,
                background: brand.accent,
                color: '#0a0a0a',
                fontFamily: brand.fontDisplay,
                fontWeight: 700,
                fontSize: 28,
                padding: '12px 22px',
                borderRadius: 999,
                boxShadow: `0 12px 36px ${brand.accentGlow}`,
              }}
            >
              +10 XP
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Vertical: phone-centric
  const phoneW = 720;
  const phoneH = Math.round(phoneW * 2.16);
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity, alignItems: 'center', justifyContent: 'center' }}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 60,
          padding: 80,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 800 }}>
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
            Sanasto
          </p>
          <h2
            style={{
              color: brand.text,
              fontFamily: brand.fontDisplay,
              fontWeight: 700,
              fontSize: 64,
              lineHeight: 1.05,
              margin: '14px 0 0',
              letterSpacing: '-0.02em',
            }}
          >
            <WordReveal text="2 000+ sanaa." startFrame={10} />
            <br />
            <WordReveal text="Toistoväli kasvaa kun muistat." startFrame={28} staggerFrames={3} />
          </h2>
        </div>

        <div style={{ position: 'relative', transform: `translateY(${phoneY}px) scale(${parallaxScale})` }}>
          <PhoneFrame width={phoneW} height={phoneH}>
            <div style={{ position: 'absolute', inset: 0 }}>
              <CapturedAsset id="vocab-question" viewport="mobile" fallbackLabel="vocab-question" />
            </div>
            <div style={{ position: 'absolute', inset: 0, opacity: successOpacity }}>
              <CapturedAsset id="vocab-success" viewport="mobile" fallbackLabel="vocab-success" />
            </div>
          </PhoneFrame>
          <div
            style={{
              position: 'absolute',
              top: 80,
              right: -40,
              transform: `scale(${xpScale})`,
              opacity: xpOpacity,
              background: brand.accent,
              color: '#0a0a0a',
              fontFamily: brand.fontDisplay,
              fontWeight: 700,
              fontSize: 36,
              padding: '14px 26px',
              borderRadius: 999,
              boxShadow: `0 12px 36px ${brand.accentGlow}`,
            }}
          >
            +10 XP
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
