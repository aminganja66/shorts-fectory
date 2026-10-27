import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing, spring} from 'remotion';
import type {VoxScene, TypewriterScene, CounterScene, LineScene} from '../types';
import {Photo, useAsset, useEpisode} from './common';
import {boil, camera, fadeIn} from '../film/motion';
import {headlineFont} from '../fonts';

// "Vox-style" explainer scenes: locked paper-grid background, cut-out cards with a marker outline,
// halftone newsprint portraits, typewriter text, counters and self-drawing charts.
// Everything is drawn in code or from transparent PNG cut-outs — no paid tools needed.

export const INK = '#16120d';
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Locked, continuous paper background shared by every scene.
export const VoxBg: React.FC = () => (
  <AbsoluteFill style={{background: '#e4e0d5'}}>
    <AbsoluteFill
      style={{
        backgroundImage: 'linear-gradient(rgba(70,58,35,0.075) 2px, transparent 2px), linear-gradient(90deg, rgba(70,58,35,0.075) 2px, transparent 2px)',
        backgroundSize: '108px 108px',
      }}
    />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 38%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 62%)'}} />
    <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: 0.16}}>
      <svg width="100%" height="100%">
        <filter id="vox-paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={7} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#vox-paper)" />
      </svg>
    </AbsoluteFill>
  </AbsoluteFill>
);

const outline = (c: string, w: number) =>
  [
    [w, 0],
    [-w, 0],
    [0, w],
    [0, -w],
    [w * 0.7, w * 0.7],
    [-w * 0.7, w * 0.7],
    [w * 0.7, -w * 0.7],
    [-w * 0.7, -w * 0.7],
  ]
    .map(([x, y]) => `drop-shadow(${x}px ${y}px 0 ${c})`)
    .join(' ');

// One cut-out layer. `halftone` = black-and-white newsprint dot portrait, `stroke` = hand-drawn marker outline in the accent colour.
const Cut: React.FC<{
  src: string;
  box: React.CSSProperties;
  halftone?: boolean;
  stroke?: boolean;
  delay?: number;
  from?: 'bottom' | 'left' | 'right' | 'top';
  rot?: number;
  pos?: string;
}> = ({src, box, halftone, stroke = true, delay = 0, from = 'bottom', rot = 0, pos = 'center bottom'}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const asset = useAsset();
  const url = asset(src);
  const enter = spring({frame: frame - delay, fps: 30, config: {damping: 13, mass: 0.8}});
  const off = (1 - enter) * 520;
  const dx = from === 'left' ? -off : from === 'right' ? off : 0;
  const dy = from === 'bottom' ? off : from === 'top' ? -off : 0;
  const b = boil(frame, src, 1.1, 4);
  const draw = interpolate(frame, [delay + 4, delay + 16], [0, 1], CLAMP);
  const filters = [stroke ? outline(accent, 5 * draw) : '', 'drop-shadow(14px 16px 0 rgba(0,0,0,0.16))'].filter(Boolean).join(' ');
  return (
    <div style={{position: 'absolute', ...box, transform: `translate(${dx + b.x}px, ${dy + b.y}px) rotate(${rot * enter + b.r}deg)`, filter: filters, opacity: Math.min(1, enter * 1.4)}}>
      {halftone ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            WebkitMaskImage: `url(${url})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: pos,
          }}
        >
          <Photo src={src} fit="contain" style={{objectPosition: pos, filter: 'grayscale(1) contrast(1.6) brightness(1.08)'}} />
          <AbsoluteFill
            style={{
              backgroundImage: 'radial-gradient(circle at center, rgba(0,0,0,0.5) 0 26%, rgba(0,0,0,0) 30%)',
              backgroundSize: '9px 9px',
              mixBlendMode: 'multiply',
            }}
          />
        </div>
      ) : (
        <Photo src={src} fit="contain" style={{objectPosition: pos}} />
      )}
    </div>
  );
};

const VoxHeadline: React.FC<{text: string; sub?: string; top?: number; size?: number}> = ({text, sub, top = 150, size = 170}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const s = interpolate(frame, [0, 10], [0.86, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const bar = interpolate(frame, [6, 22], [0, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const lines = text.split('|');
  return (
    <div style={{position: 'absolute', top, left: 50, right: 50, textAlign: 'center', transform: `scale(${s})`, opacity: fadeIn(frame, 0, 6)}}>
      {lines.map((l, i) => (
        <div key={i} style={{fontFamily: headlineFont, fontWeight: 700, fontSize: size, lineHeight: 0.92, color: INK, textTransform: 'uppercase', letterSpacing: -1}}>
          {l}
        </div>
      ))}
      <div style={{height: 12, width: `${bar * 62}%`, margin: '14px auto 0', background: accent, borderRadius: 6}} />
      {sub && <div style={{marginTop: 18, fontFamily: headlineFont, fontWeight: 700, fontSize: 64, color: '#3b342a', opacity: fadeIn(frame, 14, 10)}}>{sub}</div>}
    </div>
  );
};

// 1) VOX: headline + midground cut-out(s) + foreground cut-out anchoring the bottom
export const Vox: React.FC<{s: VoxScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const cam = camera(s.motion ?? 'push', frame, dur);
  const zoom = 1 + (cam.scale - 1) * 0.35; // gentle: the paper stays put, only the subjects breathe
  const two = !!s.mid2;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <VoxBg />
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        {s.mid && (
          <Cut
            src={s.mid}
            halftone={s.halftone ?? false}
            stroke={s.stroke ?? true}
            delay={4}
            from={two ? 'left' : 'bottom'}
            rot={two ? -3 : 0}
            box={two ? {left: '2%', width: '50%', top: '30%', height: '52%'} : {left: '6%', width: '88%', top: '28%', height: '54%'}}
          />
        )}
        {s.mid2 && <Cut src={s.mid2} halftone={s.halftone ?? false} stroke={s.stroke ?? true} delay={10} from="right" rot={3} box={{left: '48%', width: '50%', top: '30%', height: '52%'}} />}
        {s.fg && <Cut src={s.fg} stroke={s.fgStroke ?? false} delay={14} from="bottom" box={{left: '0%', width: '100%', top: '62%', height: '36%'}} />}
      </AbsoluteFill>
      {s.headline && <VoxHeadline text={s.headline} sub={s.sub} />}
    </AbsoluteFill>
  );
};

// 2) TYPEWRITER: black mono text typed out with a block cursor, optional prop rising from the bottom (e.g. a dollar bill)
export const Typewriter: React.FC<{s: TypewriterScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const lines = s.text.split('|');
  const total = lines.join('').length;
  const typed = Math.floor(interpolate(frame, [6, Math.max(20, dur * 0.62)], [0, total], CLAMP));
  let left = typed;
  const shown = lines.map((l) => {
    const n = Math.max(0, Math.min(l.length, left));
    left -= l.length;
    return l.slice(0, n);
  });
  const lastIdx = shown.reduce((acc, l, i) => (l.length > 0 ? i : acc), 0);
  const cursorOn = Math.floor(frame / 8) % 2 === 0 || typed < total;
  const prop = interpolate(frame, [0, 24], [420, 0], {...CLAMP, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <VoxBg />
      <div style={{position: 'absolute', top: 520, left: 70, right: 70, fontFamily: '"Courier New", "DejaVu Sans Mono", monospace', fontWeight: 700, fontSize: 92, lineHeight: 1.18, color: INK}}>
        {shown.map((l, i) => (
          <div key={i} style={{minHeight: 108}}>
            {l}
            {i === lastIdx && <span style={{display: 'inline-block', width: 46, height: 88, marginLeft: 6, verticalAlign: 'text-bottom', background: cursorOn ? INK : 'transparent'}} />}
          </div>
        ))}
      </div>
      {s.sub && <div style={{position: 'absolute', top: 400, left: 70, fontFamily: headlineFont, fontWeight: 700, fontSize: 64, color: accent, opacity: fadeIn(frame, 8, 8)}}>{s.sub}</div>}
      {s.prop && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: -80, height: 620, transform: `translateY(${prop}px)`, perspective: 1100}}>
          <div style={{width: '100%', height: '100%', transform: 'rotateX(52deg) scale(1.15)', transformOrigin: 'center bottom', filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.25))'}}>
            <Photo src={s.prop} fit="contain" />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// 3) COUNTER: a big number that counts up/down, with a label and an optional icon cut-out
export const Counter: React.FC<{s: CounterScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const k = interpolate(frame, [4, Math.max(16, dur * 0.7)], [0, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const v = (s.from ?? 0) + ((s.to - (s.from ?? 0)) * k);
  const txt = v.toLocaleString('en-US', {minimumFractionDigits: s.decimals ?? 0, maximumFractionDigits: s.decimals ?? 0});
  const pop = interpolate(frame, [0, 8], [0.85, 1], {...CLAMP, easing: Easing.out(Easing.back(1.8))});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <VoxBg />
      {s.icon && <Cut src={s.icon} stroke delay={2} from="top" rot={-4} box={{left: '22%', width: '56%', top: '10%', height: '28%'}} pos="center center" />}
      <div style={{position: 'absolute', top: 640, left: 30, right: 30, textAlign: 'center', transform: `scale(${pop})`}}>
        <div style={{fontFamily: headlineFont, fontWeight: 700, fontSize: 300, lineHeight: 0.95, color: INK, letterSpacing: -2}}>
          {s.prefix}
          {txt}
          <span style={{color: accent}}>{s.suffix}</span>
        </div>
        <div style={{height: 14, width: `${interpolate(frame, [6, 22], [0, 70], CLAMP)}%`, margin: '10px auto 0', background: accent, borderRadius: 7}} />
        {s.label && <div style={{marginTop: 30, fontFamily: headlineFont, fontWeight: 700, fontSize: 84, color: '#3b342a', textTransform: 'uppercase', opacity: fadeIn(frame, 12, 10)}}>{s.label}</div>}
      </div>
    </AbsoluteFill>
  );
};

// 4) LINE: cream chart card with a self-drawing orange line, grey "previous trend" and a callout bubble
export const LineChart: React.FC<{s: LineScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const W = 860;
  const H = 520;
  const pad = {l: 70, r: 30, t: 30, b: 60};
  const all = [...s.points, ...(s.previous ?? [])];
  const lo = Math.min(0, ...all);
  const hi = Math.max(...all) * 1.12;
  const x = (i: number, n: number) => pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i, arr.length).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const draw = interpolate(frame, [8, Math.max(24, dur * 0.7)], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.cubic)});
  const lastX = x(s.points.length - 1, s.points.length);
  const lastY = y(s.points[s.points.length - 1]);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => lo + (hi - lo) * t);
  const enter = interpolate(frame, [0, 10], [0.9, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <VoxBg />
      <div style={{position: 'absolute', left: 60, top: 420, width: 960, padding: '34px 50px 30px', background: '#faf6ea', borderRadius: 34, boxShadow: '0 30px 60px rgba(60,40,10,0.22), 0 0 0 2px rgba(60,40,10,0.08)', transform: `scale(${enter})`, opacity: fadeIn(frame, 0, 6)}}>
        <div style={{fontFamily: headlineFont, fontWeight: 700, fontSize: 56, color: INK, textTransform: 'uppercase', letterSpacing: 1}}>{s.title}</div>
        <svg width={W} height={H} style={{marginTop: 10, overflow: 'visible'}}>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(60,50,30,0.14)" strokeWidth={2} />
              <text x={pad.l - 14} y={y(t) + 8} textAnchor="end" fontSize={28} fontFamily={headlineFont} fill="#6b6354">
                {Math.round(t)}
                {s.unit ?? ''}
              </text>
            </g>
          ))}
          {(s.labels ?? []).map((l, i, a) => (
            <text key={i} x={x(i, a.length)} y={H - 14} textAnchor="middle" fontSize={26} fontFamily={headlineFont} fill="#6b6354">
              {l}
            </text>
          ))}
          {s.previous && <path d={path(s.previous)} fill="none" stroke="#a9a397" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />}
          <path d={path(s.points)} fill="none" stroke={accent} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          {s.points.map((v, i) => {
            const shown = draw >= i / Math.max(1, s.points.length - 1);
            return shown ? <circle key={i} cx={x(i, s.points.length)} cy={y(v)} r={11} fill="#faf6ea" stroke={accent} strokeWidth={6} /> : null;
          })}
        </svg>
        {s.callout && (
          <div style={{position: 'absolute', left: Math.min(lastX + 20, 930) - 190, top: 120 + Math.max(0, lastY - 190), width: 280, padding: '10px 16px', background: '#fff', border: `5px solid ${accent}`, borderRadius: 16, fontFamily: headlineFont, fontWeight: 700, fontSize: 52, textAlign: 'center', color: INK, lineHeight: 1, opacity: fadeIn(frame, Math.max(24, dur * 0.7), 8), transform: `scale(${interpolate(frame, [Math.max(24, dur * 0.7), Math.max(24, dur * 0.7) + 8], [0.7, 1], CLAMP)})`}}>
            {s.callout.split('|').map((l, i) => (
              <div key={i} style={{color: i ? accent : INK}}>
                {l}
              </div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
