import React, {createContext, useContext} from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import type {Backdrop} from '../types';

// Which background the vox scenes draw. Short.tsx sets it per scene (line.backdrop ?? theme.backdrop ?? 'paper').
export const SceneCtx = createContext<{backdrop: Backdrop}>({backdrop: 'paper'});
export const useBackdrop = () => useContext(SceneCtx).backdrop;

const grid = (c: string, size: number, w = 2) => `linear-gradient(${c} ${w}px, transparent ${w}px), linear-gradient(90deg, ${c} ${w}px, transparent ${w}px)`;
const noise = `url(${staticFile('textures/paper-noise.png')})`;

// All backdrops are LIGHT on purpose: the ink-black headlines, white counter cards and accent strokes stay readable on every one.
const RECIPES: Record<Backdrop, {base: string; layers: React.CSSProperties[]; glow?: string; grain?: number}> = {
  // warm grey grid (the original house paper)
  paper: {base: '#e4e0d5', layers: [{backgroundImage: grid('rgba(70,58,35,0.075)', 108), backgroundSize: '108px 108px'}], glow: 'rgba(255,255,255,0.5)', grain: 0.16},
  // pale engineering blue: fine grid + heavier lines every 5 cells → tech, science, engineering, "how it works"
  blueprint: {
    base: '#dbe6ee',
    layers: [
      {backgroundImage: grid('rgba(40,90,140,0.10)', 54, 1), backgroundSize: '54px 54px'},
      {backgroundImage: grid('rgba(40,90,140,0.16)', 270, 2), backgroundSize: '270px 270px'},
    ],
    glow: 'rgba(255,255,255,0.55)',
    grain: 0.1,
  },
  // warm peach light, no grid → comebacks, growth, launches, optimism
  sunrise: {
    base: '#f6e6d2',
    layers: [{backgroundImage: 'radial-gradient(circle at 78% 12%, rgba(255,190,110,0.55) 0%, rgba(255,190,110,0) 55%), radial-gradient(circle at 12% 100%, rgba(255,140,90,0.28) 0%, rgba(255,140,90,0) 50%)'}],
    glow: 'rgba(255,250,240,0.55)',
    grain: 0.12,
  },
  // cool grey panels → money, corporate, industry, markets
  concrete: {
    base: '#d9dcde',
    layers: [
      {backgroundImage: 'linear-gradient(90deg, rgba(60,70,80,0.09) 3px, transparent 3px)', backgroundSize: '216px 100%'},
      {backgroundImage: 'linear-gradient(rgba(60,70,80,0.06) 2px, transparent 2px)', backgroundSize: '100% 216px'},
    ],
    glow: 'rgba(255,255,255,0.42)',
    grain: 0.2,
  },
  // yellowed newsprint with ruled lines → history, heritage, scandals, "what the papers said"
  newsprint: {
    base: '#ebe0c3',
    layers: [{backgroundImage: 'linear-gradient(rgba(110,80,30,0.11) 2px, transparent 2px)', backgroundSize: '100% 54px'}, {backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(120,85,30,0.12) 0 22%, transparent 26%)', backgroundSize: '14px 14px', opacity: 0.35}],
    glow: 'rgba(255,248,225,0.45)',
    grain: 0.22,
  },
  // soft lavender dot grid → psychology, mind, behaviour
  dots: {base: '#e6e3f0', layers: [{backgroundImage: 'radial-gradient(circle, rgba(90,70,160,0.20) 0 4px, transparent 5px)', backgroundSize: '54px 54px'}], glow: 'rgba(255,255,255,0.55)', grain: 0.1},
  // pale sage with diagonal stripes → health, nature, sustainability, calm explainers
  sage: {base: '#dfe6d6', layers: [{backgroundImage: 'repeating-linear-gradient(135deg, rgba(60,100,60,0.07) 0 3px, transparent 3px 40px)'}], glow: 'rgba(255,255,255,0.5)', grain: 0.14},
};

export const BackdropLayer: React.FC<{kind?: Backdrop}> = ({kind}) => {
  const ctx = useBackdrop();
  const r = RECIPES[kind ?? ctx] ?? RECIPES.paper;
  return (
    <AbsoluteFill style={{background: r.base}}>
      {r.layers.map((l, i) => (
        <AbsoluteFill key={i} style={l} />
      ))}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 38%, ${r.glow ?? 'rgba(255,255,255,0.5)'} 0%, rgba(255,255,255,0) 62%)`}} />
      {/* paper grain = a static noise tile (an SVG feTurbulence filter was re-rasterised every frame and made renders slow) */}
      <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: r.grain ?? 0.16, backgroundImage: noise, backgroundSize: '512px 512px'}} />
    </AbsoluteFill>
  );
};
