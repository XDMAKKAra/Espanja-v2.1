import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { brand } from '../brand';
import { PhoneFrame } from '../components/PhoneFrame';
import { BrowserChrome } from '../components/BrowserChrome';
import { CapturedAsset } from '../components/CapturedAsset';
import { WordReveal } from '../components/WordReveal';
import type { PreviewFormat } from '../PuheoPreview';

/**
 * Hero scene. Beats:
 *   0–60   : writing-input visible (Spanish text typing on if real video clip available)
 *   60–110 : crossfade to feedback screen
 *   115    : score badge pops in (overshoot spring)
 *   120–135: FREEZE frame, push in 8% scale, dim everything except the badge
 *   140–170: yellow underline animates under "vengas"
 *   170–195: subtle shake at impact, hold
 *   195–210: fade out
 */
export const WritingHero: React.FC<{ format: PreviewFormat }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 15, 200, 210], [0, 1, 1, 0]);

  // Writing input → feedback crossfade
  const feedbackOpacity = interpolate(frame, [60, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Freeze + push-in: scale 1.0 → 1.08 over frames 115→135
  const pushIn = interpolate(frame, [115, 135], [1.0, 1.08], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Dim mask 115→127, hold to 170, fade out 170→195
  const dimAlpha = interpolate(frame, [115, 127, 170, 195], [0, 0.6, 0.6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Score badge spring at frame 115
  const scoreSpring = spring({ frame: frame - 115, fps, config: { damping: 8, stiffness: 220, mass: 0.5 } });
  const scoreScale = interpolate(scoreSpring, [0, 1], [0.4, 1.0]);
  const pulse = 1 + 0.05 * Math.sin((frame - 115) * 0.22);
  const scoreOpacity = interpolate(frame, [115, 130, 195, 210], [0, 1, 1, 0]);

  // Yellow underline 140→170
  const underlineW = interpolate(frame, [140, 165], [0, 220], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const underlineOpacity = interpolate(frame, [140, 155, 195, 210], [0, 1, 1, 0]);

  // Tiny camera shake on impact (frames 115–121)
  const shakeAmt = frame >= 115 && frame < 121 ? Math.sin(frame * 4) * 1.5 : 0;

  // Phone enter
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });
  const phoneY = interpolate(enter, [0, 1], [60, 0]);

  // Caption word-by-word reveal — anchored, doesn't push in
  const captionOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });

  if (format === 'landscape') {
    // Browser fills the frame with the writing experience.
    const browserW = Math.round(width * 0.62);
    const browserH = Math.round(browserW * (1080 / 1920));

    return (
      <AbsoluteFill style={{ opacity: sceneOpacity }}>
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 80,
            padding: 80,
          }}
        >
          {/* Caption */}
          <div style={{ maxWidth: 580, opacity: captionOpacity }}>
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
              Kirjoittaminen · YTL-rubriikki
            </p>
            <h2
              style={{
                color: brand.text,
                fontFamily: brand.fontDisplay,
                fontWeight: 700,
                fontSize: 92,
                lineHeight: 1.04,
                margin: '18px 0 0',
                letterSpacing: '-0.02em',
              }}
            >
              <WordReveal text="AI-palaute sekunneissa." startFrame={12} staggerFrames={5} />
            </h2>
            <p
              style={{
                color: brand.textMuted,
                fontFamily: brand.fontBody,
                fontSize: 26,
                lineHeight: 1.4,
                margin: '24px 0 0',
                maxWidth: 540,
              }}
            >
              Tekoäly arvioi viestinnällisyyden, rakenteet, sanaston ja kokonaisuuden YTL-tyyliin.
            </p>
          </div>

          {/* Browser frame with the writing flow */}
          <div
            style={{
              position: 'relative',
              transform: `translate(${shakeAmt}px, ${phoneY + shakeAmt * 0.4}px) scale(${pushIn})`,
              transformOrigin: 'center',
            }}
          >
            <BrowserChrome width={browserW} height={browserH}>
              {/* Use real desktop video if present, else fall back to stills */}
              <div style={{ position: 'absolute', inset: 0 }}>
                <CapturedAsset id="writing-feedback-desktop-clip" viewport="desktop" fallbackLabel="" />
              </div>
              <div style={{ position: 'absolute', inset: 0 }}>
                <CapturedAsset id="writing-input" viewport="desktop" fallbackLabel="writing" />
              </div>
              <div style={{ position: 'absolute', inset: 0, opacity: feedbackOpacity }}>
                <CapturedAsset id="writing-feedback" viewport="desktop" fallbackLabel="writing-feedback" />
              </div>

              {/* Dim overlay — everything except the badge dims */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(10,10,10,1)',
                  opacity: dimAlpha,
                  pointerEvents: 'none',
                }}
              />

              {/* Yellow underline */}
              <div
                style={{
                  position: 'absolute',
                  left: '14%',
                  top: '64%',
                  height: 6,
                  width: underlineW,
                  background: brand.flagYellow,
                  borderRadius: 3,
                  opacity: underlineOpacity,
                  boxShadow: `0 0 12px ${brand.flagYellow}`,
                }}
              />
            </BrowserChrome>

            {/* Score badge — sits above the dim layer */}
            <div
              style={{
                position: 'absolute',
                top: -36,
                right: -36,
                transform: `scale(${scoreScale * pulse})`,
                opacity: scoreOpacity,
                background: brand.accent,
                color: '#0a0a0a',
                fontFamily: brand.fontDisplay,
                fontWeight: 700,
                fontSize: 34,
                padding: '20px 30px',
                borderRadius: 22,
                boxShadow: `0 18px 60px ${brand.accentGlow}`,
                textAlign: 'center',
                lineHeight: 1.05,
                zIndex: 10,
              }}
            >
              13 / 20
              <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.75, marginTop: 2 }}>YTL · arvosana E</div>
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Vertical: phone-centric (same beats, smaller)
  const phoneW = 720;
  const phoneH = Math.round(phoneW * 2.16);
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 50,
          padding: 80,
        }}
      >
        <div style={{ maxWidth: 900, textAlign: 'center', opacity: captionOpacity }}>
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
            Kirjoittaminen · YTL-rubriikki
          </p>
          <h2
            style={{
              color: brand.text,
              fontFamily: brand.fontDisplay,
              fontWeight: 700,
              fontSize: 78,
              lineHeight: 1.04,
              margin: '18px 0 0',
              letterSpacing: '-0.02em',
            }}
          >
            <WordReveal text="AI-palaute sekunneissa." startFrame={12} staggerFrames={5} />
          </h2>
        </div>

        <div
          style={{
            position: 'relative',
            transform: `translate(${shakeAmt}px, ${phoneY + shakeAmt * 0.4}px) scale(${pushIn})`,
          }}
        >
          <PhoneFrame width={phoneW} height={phoneH}>
            <div style={{ position: 'absolute', inset: 0 }}>
              <CapturedAsset id="writing-feedback-clip" viewport="mobile" fallbackLabel="" />
            </div>
            <div style={{ position: 'absolute', inset: 0 }}>
              <CapturedAsset id="writing-input" viewport="mobile" fallbackLabel="writing-input" />
            </div>
            <div style={{ position: 'absolute', inset: 0, opacity: feedbackOpacity }}>
              <CapturedAsset id="writing-feedback" viewport="mobile" fallbackLabel="writing-feedback" />
            </div>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(10,10,10,1)',
                opacity: dimAlpha,
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: '14%',
                top: '46%',
                height: 8,
                width: underlineW,
                background: brand.flagYellow,
                borderRadius: 4,
                opacity: underlineOpacity,
                boxShadow: `0 0 12px ${brand.flagYellow}`,
              }}
            />
          </PhoneFrame>

          <div
            style={{
              position: 'absolute',
              top: -28,
              right: -28,
              transform: `scale(${scoreScale * pulse})`,
              opacity: scoreOpacity,
              background: brand.accent,
              color: '#0a0a0a',
              fontFamily: brand.fontDisplay,
              fontWeight: 700,
              fontSize: 30,
              padding: '18px 28px',
              borderRadius: 22,
              boxShadow: `0 14px 40px ${brand.accentGlow}`,
              textAlign: 'center',
              lineHeight: 1.05,
              zIndex: 10,
            }}
          >
            13 / 20
            <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.75, marginTop: 2 }}>YTL · arvosana E</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
