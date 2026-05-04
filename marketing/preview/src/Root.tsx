import React from 'react';
import { Composition } from 'remotion';
import { PuheoPreview } from './PuheoPreview';
import { FPS, TOTAL_FRAMES } from './timing';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="PuheoPreviewVertical"
        component={PuheoPreview}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ format: 'vertical' as const }}
      />
      <Composition
        id="PuheoPreviewLandscape"
        component={PuheoPreview}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ format: 'landscape' as const }}
      />
    </>
  );
};
