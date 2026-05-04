import React from 'react';
import { Img, Video, staticFile } from 'remotion';

type AssetType = 'image' | 'video';

export type ManifestEntry = {
  id: string;
  path: string;
  viewport: 'mobile' | 'desktop';
  type: AssetType;
  screen: string;
};

export type Manifest = {
  assets: ManifestEntry[];
  audioAvailable: boolean;
};

// Compile-time fallback manifest — overridden at runtime by public/captures/manifest.json
// when present (read via fetch(staticFile)).
const FALLBACK: Manifest = { assets: [], audioAvailable: false };

let cached: Manifest | null = null;

export const useManifest = (): Manifest => {
  const [m, setM] = React.useState<Manifest>(cached ?? FALLBACK);
  React.useEffect(() => {
    if (cached) return;
    let cancel = false;
    fetch(staticFile('captures/manifest.json'))
      .then((r) => (r.ok ? r.json() : FALLBACK))
      .then((data: Manifest) => {
        if (cancel) return;
        cached = data;
        setM(data);
      })
      .catch(() => {
        cached = FALLBACK;
      });
    return () => {
      cancel = true;
    };
  }, []);
  return m;
};

export const findAsset = (
  manifest: Manifest,
  id: string,
  viewport?: 'mobile' | 'desktop',
): ManifestEntry | undefined => {
  return manifest.assets.find(
    (a) => a.id === id && (!viewport || a.viewport === viewport),
  );
};

type Props = {
  id: string;
  viewport?: 'mobile' | 'desktop';
  style?: React.CSSProperties;
  fallbackBg?: string;
  fallbackLabel?: string;
};

export const CapturedAsset: React.FC<Props> = ({
  id,
  viewport,
  style,
  fallbackBg = '#141414',
  fallbackLabel,
}) => {
  const manifest = useManifest();
  const asset = findAsset(manifest, id, viewport);

  if (!asset) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: fallbackBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a1a1aa',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 24,
          ...style,
        }}
      >
        {fallbackLabel ?? id}
      </div>
    );
  }

  const src = staticFile(asset.path);
  if (asset.type === 'video') {
    return (
      <Video
        src={src}
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
      />
    );
  }
  return (
    <Img
      src={src}
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
    />
  );
};
