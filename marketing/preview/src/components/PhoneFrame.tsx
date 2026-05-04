import React from 'react';
import { brand } from '../brand';

type Props = {
  width: number;
  height: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

export const PhoneFrame: React.FC<Props> = ({ width, height, children, style }) => {
  const radius = Math.round(width * 0.09);
  const notchW = Math.round(width * 0.32);
  const notchH = Math.round(width * 0.045);

  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: '#000',
        padding: 8,
        boxSizing: 'border-box',
        boxShadow:
          '0 40px 120px rgba(0,0,0,0.55), 0 0 0 1.5px rgba(255,255,255,0.06) inset, 0 0 60px rgba(45,212,191,0.18)',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${brand.border}`,
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius - 8,
          overflow: 'hidden',
          background: brand.bgElevated,
          position: 'relative',
        }}
      >
        {children}
        {/* Notch */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: notchW,
            height: notchH,
            borderRadius: notchH / 2,
            background: '#000',
            zIndex: 5,
          }}
        />
      </div>
    </div>
  );
};
