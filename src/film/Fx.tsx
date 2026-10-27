import React from 'react';
import {AbsoluteFill, useCurrentFrame, random, interpolate} from 'remotion';
import {Fx} from '../types';

// SMOKE: soft turbulent haze rising from the bottom (like the reference reel's smoke wisps)
const Smoke: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.55}}>
      {[0, 1, 2, 3].map((i) => {
        const y = interpolate((frame + i * 37) % 160, [0, 160], [1700, 900]);
        const x = 100 + i * 230 + Math.sin((frame + i * 20) / 25) * 60;
        const o = interpolate((frame + i * 37) % 160, [0, 40, 120, 160], [0, 0.9, 0.6, 0]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - 260,
              top: y - 260,
              width: 520,
              height: 520,
              opacity: o,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(220,215,205,0.55) 0%, rgba(200,195,185,0.2) 45%, transparent 70%)',
              filter: 'blur(28px)',
              transform: `scale(${1 + ((frame + i * 37) % 160) / 160})`,
            }}
          />
        );
      })}
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.35}}>
        <filter id="smk">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="4" seed={Math.floor(frame / 4)} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.83  0 0 0 0 0.8  0 0 0 1.6 -0.75" />
        </filter>
        <rect width="100%" height="100%" filter="url(#smk)" style={{transform: `translateY(${-frame * 1.5}px)`}} />
      </svg>
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(255,255,255,0.12), transparent 50%)'}} />
    </AbsoluteFill>
  );
};

// DUST: floating specks catching light
const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(40).fill(0).map((_, i) => {
        const x = random(`dx${i}`) * 1080 + Math.sin(frame / 30 + i) * 20;
        const y = (random(`dy${i}`) * 1920 - frame * (0.3 + random(`ds${i}`) * 0.8) + 1920) % 1920;
        const s = 2 + random(`dz${i}`) * 4;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#fff6dc', opacity: 0.25 + random(`do${i}`) * 0.5, filter: 'blur(0.6px)'}} />;
      })}
    </AbsoluteFill>
  );
};

// EMBERS: orange sparks rising (fire / destruction / bankruptcy moments)
const Embers: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {new Array(28).fill(0).map((_, i) => {
        const speed = 3 + random(`es${i}`) * 5;
        const y = 1950 - ((frame * speed + random(`ey${i}`) * 1900) % 1950);
        const x = random(`ex${i}`) * 1080 + Math.sin(frame / 12 + i) * 25;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 6, height: 6, borderRadius: '50%', background: '#ffb347', boxShadow: '0 0 12px 4px rgba(255,120,30,0.8)', opacity: 0.8}} />;
      })}
    </AbsoluteFill>
  );
};

// LIGHT LEAK: warm film burn sliding across the frame
const LightLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame % 120, [0, 120], [-30, 130]);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: 0.45,
        background: `radial-gradient(ellipse at ${x}% 20%, rgba(255,140,40,0.75) 0%, rgba(255,60,20,0.25) 25%, transparent 55%)`,
      }}
    />
  );
};

// GLITCH: brief horizontal tears (use for "digital", "internet", "streaming")
const Glitch: React.FC = () => {
  const frame = useCurrentFrame();
  if (random(`g${Math.floor(frame / 3)}`) > 0.3) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(5).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: random(`gy${frame}-${i}`) * 1920,
            height: 6 + random(`gh${frame}-${i}`) * 40,
            background: i % 2 ? 'rgba(0,255,255,0.18)' : 'rgba(255,0,80,0.18)',
            transform: `translateX(${(random(`gx${frame}-${i}`) - 0.5) * 80}px)`,
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

export const FxLayer: React.FC<{fx?: Fx[]}> = ({fx}) => (
  <>
    {fx?.includes('smoke') && <Smoke />}
    {fx?.includes('dust') && <Dust />}
    {fx?.includes('embers') && <Embers />}
    {fx?.includes('lightleak') && <LightLeak />}
    {fx?.includes('glitch') && <Glitch />}
  </>
);
