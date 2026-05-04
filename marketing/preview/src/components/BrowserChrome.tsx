import React from 'react';
import { brand } from '../brand';

type Props = {
  width: number;
  height: number;
  url?: string;
  title?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

/**
 * Mac-style browser frame around desktop captures. Mirrors the PhoneFrame API.
 * Chrome bar height is fixed (40px) — the inner content area is `height - 40`.
 */
export const BrowserChrome: React.FC<Props> = ({
  width,
  height,
  url = `${brand.domain}/app`,
  title = 'Puheo',
  children,
  style,
}) => {
  const radius = 14;
  const chromeH = 40;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: '#1a1a1a',
        boxShadow:
          '0 50px 140px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 80px rgba(45,212,191,0.12)',
        overflow: 'hidden',
        position: 'relative',
        border: `1px solid ${brand.border}`,
        ...style,
      }}
    >
      {/* Chrome bar */}
      <div
        style={{
          height: chromeH,
          background: '#202020',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 14,
          fontFamily: brand.fontBody,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
        </div>
        {/* URL pill */}
        <div
          style={{
            flex: 1,
            margin: '0 12px',
            padding: '6px 14px',
            background: '#0f0f0f',
            borderRadius: 8,
            color: brand.textMuted,
            fontFamily: brand.fontMono,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={brand.textMuted} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>{url}</span>
        </div>
        {/* Tab title */}
        <div style={{ color: brand.textMuted, fontSize: 12, fontFamily: brand.fontBody }}>{title}</div>
      </div>
      {/* Content area */}
      <div
        style={{
          width: '100%',
          height: height - chromeH,
          background: brand.bg,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
};
