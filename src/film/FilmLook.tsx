import React from 'react';
import {AbsoluteFill, useCurrentFrame, random} from 'remotion';
import type {Look} from '../types';

// The "texture sandwich" that turns flat digital images into a documentary look:
// colour grade (applied on content) + gate weave + grain + scan lines + vignette + corner blur.

export const gradeFilter = (grade?: 'warm' | 'cold' | 'mono', look?: Look) => {
  if (look === 'noir' || grade === 'mono') return 'grayscale(0.7) contrast(1.08) brightness(1.02)'; // soft noir: keeps a little colour, no crushed blacks
  if (look === 'neon') return 'contrast(1.08) saturate(1.15) hue-rotate(-12deg) brightness(0.98)';
  if (look === 'gold') return 'contrast(1.12) saturate(0.95) sepia(0.22) brightness(0.98)';
  if (look === 'paper') return 'contrast(1.05) saturate(0.75) sepia(0.2) brightness(1.02)';
  if (look === 'clean') return 'contrast(1.05) saturate(1.05)';
  if (look === 'vox') return 'none'; // flat, bright editorial colour — no grading
  if (grade === 'cold') return 'contrast(1.1) saturate(0.8) hue-rotate(-8deg) brightness(0.95)';
  return 'contrast(1.05) saturate(0.95) sepia(0.1) brightness(1.0)'; // archive / warm
};

// Gate weave: the whole frame wobbles a tiny bit like film in a projector gate.
export const GateWeave: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const f = Math.floor(frame / 4); // slow, tiny wobble: constant jitter tires the eyes
  const x = (random(`gw-x-${f}`) - 0.5) * 0.8;
  const y = (random(`gw-y-${f}`) - 0.5) * 0.8;
  return <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(1.01)`}}>{children}</AbsoluteFill>;
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 50; // grain changes every 2 frames
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.12, pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Grunge: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = 100 + (Math.floor(frame / 6) % 8);
  return (
    <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: 0.08, pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`grunge-${seed}`}>
          <feTurbulence type="turbulence" baseFrequency="0.012" numOctaves="3" seed={seed} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 1.4 -0.35" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grunge-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const ScanLines: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      // 1.6px black line at 16% opacity every 4px
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1.6px, transparent 1.6px, transparent 4px)',
    }}
  />
);

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)',
    }}
  />
);

const Flicker: React.FC = () => {
  const frame = useCurrentFrame();
  const o = 0.01 + random(`fl-${Math.floor(frame / 6)}`) * 0.015; // barely-there, slow
  return <AbsoluteFill style={{background: '#fff8e7', opacity: o, mixBlendMode: 'soft-light', pointerEvents: 'none'}} />;
};

const PaperTexture: React.FC = () => (
  <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: 0.35, pointerEvents: 'none'}}>
    <svg width="100%" height="100%">
      <filter id="paper">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" seed={3} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.93  0 0 0 0 0.88  0 0 0 0 0.78  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper)" />
    </svg>
  </AbsoluteFill>
);

const NeonEdge: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none', boxShadow: 'inset 0 0 160px rgba(0,200,255,0.25), inset 0 0 40px rgba(255,0,140,0.2)'}} />
);

const GoldLeak: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.18, background: `radial-gradient(ellipse at ${50 + Math.sin(frame / 40) * 30}% 0%, #ffcf70 0%, transparent 60%)`}} />;
};

// Each "look" is a different finishing recipe so the channel never feels templated.
export const FilmOverlay: React.FC<{look?: Look}> = ({look = 'archive'}) => {
  switch (look) {
    case 'noir':
      return (
        <>
          <Grain />
          <Vignette />
        </>
      );
    case 'neon':
      return (
        <>
          <Grain />
          <ScanLines />
          <NeonEdge />
          <Vignette />
        </>
      );
    case 'paper':
      return (
        <>
          <PaperTexture />
          <Grain />
          <Vignette />
        </>
      );
    case 'gold':
      return (
        <>
          <Grain />
          <GoldLeak />
          <Vignette />
        </>
      );
    case 'clean':
      return <Vignette />;
    case 'vox':
      return null; // paper grain is part of the scene background
    case 'archive':
    default:
      return (
        <>
          <Grunge />
          <Grain />
          <Vignette />
        </>
      );
  }
};
