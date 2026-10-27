import React, {createContext, useContext} from 'react';
import {Img, staticFile, AbsoluteFill} from 'remotion';

import type {Theme} from '../types';
export const EpisodeCtx = createContext<{id: string; accent: string; theme: Theme}>({id: '', accent: '#E50914', theme: {}});
export const useEpisode = () => useContext(EpisodeCtx);

// Paths in storyboard are relative to the episode folder (e.g. "assets/s1-bg.jpg").
// Paths starting with "/" are relative to /public (shared library).
export const useAsset = () => {
  const {id} = useEpisode();
  return (p?: string) => (p ? (p.startsWith('/') ? staticFile(p.slice(1)) : staticFile(`episodes/${id}/${p}`)) : undefined);
};

export const Photo: React.FC<{src?: string; style?: React.CSSProperties; fit?: 'cover' | 'contain'}> = ({src, style, fit = 'cover'}) => {
  const asset = useAsset();
  const url = asset(src);
  if (!url) return null;
  return <Img src={url} style={{width: '100%', height: '100%', objectFit: fit, ...style}} />;
};

// Fallback background when no image is given: dark paper texture gradient
export const PaperBg: React.FC<{tint?: string}> = ({tint = '#1b1712'}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(circle at 30% 20%, #3a3128 0%, ${tint} 60%, #0b0907 100%)`,
    }}
  />
);

// Torn-paper / polaroid style card used for foreground photos
export const Card: React.FC<{src: string; w: number; h: number; rotate?: number; style?: React.CSSProperties}> = ({src, w, h, rotate = 0, style}) => (
  <div
    style={{
      width: w,
      height: h,
      padding: 14,
      paddingBottom: 46,
      background: '#f2ead8',
      boxShadow: '0 30px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.15)',
      transform: `rotate(${rotate}deg)`,
      ...style,
    }}
  >
    <div style={{width: '100%', height: '100%', overflow: 'hidden', filter: 'contrast(1.05) saturate(0.9)'}}>
      <Photo src={src} />
    </div>
  </div>
);
