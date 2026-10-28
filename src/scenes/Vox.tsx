import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, spring, staticFile} from 'remotion';
import type {VoxScene, TypewriterScene, CounterScene, LineScene, ChapterScene, TimelineScene} from '../types';
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
    {/* paper grain = a static noise tile (an SVG feTurbulence filter was re-rasterised every frame and made renders ~slow) */}
    <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: 0.16, backgroundImage: `url(${staticFile('textures/paper-noise.png')})`, backgroundSize: '512px 512px'}} />
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

// Rectangular photo (no transparent cut-out available) shown on purpose as a tilted polaroid:
// white paper border, halftone newsprint photo, marker outline around the card, soft paper shadow.
const PhotoCard: React.FC<{src: string; box: React.CSSProperties; aspect: number; halftone?: boolean; stroke?: boolean; delay?: number; rot?: number}> = ({
  src,
  box,
  aspect,
  halftone = true,
  stroke = true,
  delay = 0,
  rot = -4,
}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const enter = spring({frame: frame - delay, fps: 30, config: {damping: 14, mass: 0.8}});
  const dx = (1 - enter) * -620;
  const b = boil(frame, src, 0.8, 3);
  const draw = interpolate(frame, [delay + 4, delay + 16], [0, 1], CLAMP);
  const filters = [stroke ? outline(accent, 6 * draw) : '', 'drop-shadow(16px 20px 0 rgba(0,0,0,0.16))'].filter(Boolean).join(' ');
  return (
    <div style={{position: 'absolute', ...box, transform: `translate(${dx + b.x}px, ${b.y}px) rotate(${rot * enter + b.r}deg)`, filter: filters, opacity: Math.min(1, enter * 1.4)}}>
      <div style={{background: '#fbf8f0', padding: '22px 22px 86px', boxSizing: 'border-box'}}>
        <div style={{position: 'relative', width: '100%', aspectRatio: String(aspect), overflow: 'hidden', background: '#d9d4c7'}}>
          <Photo src={src} fit="cover" style={{objectPosition: 'center top', filter: halftone ? 'grayscale(1) contrast(1.25) brightness(1.18)' : undefined}} />
          {halftone && (
            <AbsoluteFill
              style={{
                backgroundImage: 'radial-gradient(circle at center, rgba(0,0,0,0.42) 0 24%, rgba(0,0,0,0) 30%)',
                backgroundSize: '8px 8px',
                mixBlendMode: 'multiply',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// 16:9 long videos reuse every scene: wide = text in a left column, visuals on the right, captions at the bottom (y ≈ 880–1010).
export const useWide = () => {
  const {width, height} = useVideoConfig();
  return width > height;
};

const VoxHeadline: React.FC<{text: string; sub?: string; top?: number; size?: number; center?: boolean}> = ({text, sub, top = 150, size = 170, center}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const wide = useWide();
  const s = interpolate(frame, [0, 10], [0.86, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const bar = interpolate(frame, [6, 22], [0, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const lines = text.split('|');
  const longest = Math.max(...lines.map((l) => l.length));
  const col = wide && !center;
  const width = wide ? (center ? 1600 : 780) : 940;
  const fit = Math.min(wide ? 150 : size, Math.floor(width / (longest * 0.47))); // never wrap: shrink long lines to fit the column
  const box: React.CSSProperties = col ? {top: 330 - lines.length * 40, left: 110, width, textAlign: 'left', transformOrigin: 'left center'} : {top: wide ? 380 - lines.length * 50 : top, left: 50, right: 50, textAlign: 'center'};
  return (
    <div style={{position: 'absolute', ...box, transform: `scale(${s})`, opacity: fadeIn(frame, 0, 6)}}>
      {lines.map((l, i) => (
        <div key={i} style={{fontFamily: headlineFont, fontWeight: 700, fontSize: fit, lineHeight: 0.92, color: INK, textTransform: 'uppercase', letterSpacing: -1}}>
          {l}
        </div>
      ))}
      <div style={{height: 12, width: `${bar * 62}%`, margin: col ? '14px 0 0' : '14px auto 0', background: accent, borderRadius: 6}} />
      {sub && <div style={{marginTop: 18, fontFamily: headlineFont, fontWeight: 700, fontSize: wide ? 54 : 64, color: '#3b342a', opacity: fadeIn(frame, 14, 10)}}>{sub}</div>}
    </div>
  );
};

// 1) VOX: headline + midground cut-out(s) + foreground cut-out anchoring the bottom
export const Vox: React.FC<{s: VoxScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const cam = camera(s.motion ?? 'push', frame, dur);
  const zoom = 1 + (cam.scale - 1) * 0.35; // gentle: the paper stays put, only the subjects breathe
  const two = !!s.mid2;
  const wide = useWide();
  if (wide) {
    // 16:9: headline column on the left, cut-outs on the right half
    const visuals = !!(s.mid || s.fg);
    return (
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <VoxBg />
        <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '72% 50%'}}>
          {s.mid && s.card && <PhotoCard src={s.mid} aspect={0.86} halftone={s.halftone ?? true} stroke={s.stroke ?? true} delay={4} rot={-4} box={{left: '50%', width: '26%', top: '7%'}} />}
          {s.mid2 && s.card && <Cut src={s.mid2} halftone={s.mid2Halftone ?? false} stroke={s.stroke ?? true} delay={10} from="right" rot={8} pos="center center" box={{left: '74%', width: '20%', top: '22%', height: '34%'}} />}
          {s.mid && !s.card && (
            <Cut src={s.mid} halftone={s.halftone ?? false} stroke={s.stroke ?? true} delay={4} from={two ? 'left' : 'right'} rot={two ? -3 : 0} pos="center center" box={two ? {left: '42%', width: '28%', top: '8%', height: '70%'} : {left: '46%', width: '50%', top: '7%', height: '74%'}} />
          )}
          {s.mid2 && !s.card && <Cut src={s.mid2} halftone={s.mid2Halftone ?? s.halftone ?? false} stroke={s.stroke ?? true} delay={10} from="right" rot={3} pos="center center" box={{left: '70%', width: '28%', top: '8%', height: '70%'}} />}
          {s.fg && <Cut src={s.fg} stroke={s.fgStroke ?? false} delay={14} from="bottom" box={{left: '50%', width: '46%', top: '68%', height: '28%'}} />}
        </AbsoluteFill>
        {s.headline && <VoxHeadline text={s.headline} sub={s.sub} center={!visuals} />}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <VoxBg />
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        {s.mid && s.card && (
          <PhotoCard src={s.mid} aspect={0.86} halftone={s.halftone ?? true} stroke={s.stroke ?? true} delay={4} rot={-4} box={{left: '6%', width: '56%', top: s.sub ? '35%' : '31%'}} />
        )}
        {s.mid2 && s.card && (
          <Cut src={s.mid2} halftone={s.mid2Halftone ?? false} stroke={s.stroke ?? true} delay={10} from="right" rot={8} pos="center center" box={{left: '60%', width: '34%', top: s.sub ? '41%' : '37%', height: '19%'}} />
        )}
        {s.mid && !s.card && (
          <Cut
            src={s.mid}
            halftone={s.halftone ?? false}
            stroke={s.stroke ?? true}
            delay={4}
            from={two ? 'left' : 'bottom'}
            rot={two ? -3 : 0}
            box={two ? {left: '2%', width: '50%', top: s.sub ? '34%' : '30%', height: s.sub ? '48%' : '52%'} : {left: '6%', width: '88%', top: s.sub ? '33%' : '28%', height: s.sub ? '49%' : '54%'}}
          />
        )}
        {s.mid2 && !s.card && <Cut src={s.mid2} halftone={s.mid2Halftone ?? s.halftone ?? false} stroke={s.stroke ?? true} delay={10} from="right" rot={3} box={{left: '48%', width: '50%', top: '30%', height: '52%'}} />}
        {s.fg && <Cut src={s.fg} stroke={s.fgStroke ?? false} delay={14} from="bottom" box={{left: '0%', width: '100%', top: '75%', height: '21%'}} />}
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
  const typed = Math.floor(interpolate(frame, [6, Math.max(20, dur * 0.68)], [0, total], CLAMP));
  let left = typed;
  const shown = lines.map((l) => {
    const n = Math.max(0, Math.min(l.length, left));
    left -= l.length;
    return l.slice(0, n);
  });
  const lastIdx = shown.reduce((acc, l, i) => (l.length > 0 ? i : acc), 0);
  const cursorOn = Math.floor(frame / 8) % 2 === 0 || typed < total;
  const prop = interpolate(frame, [0, 24], [420, 0], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const wide = useWide();
  // wide: text block on the left (or centred without a prop), prop standing on the right
  const textBox: React.CSSProperties = wide ? {top: 300, left: 150, right: s.prop ? 780 : 150, fontSize: s.prop ? 96 : 116} : {top: 520, left: 70, right: 70, fontSize: 118};
  const fs = textBox.fontSize as number;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <VoxBg />
      <div style={{position: 'absolute', ...textBox, fontFamily: '"Courier New", "DejaVu Sans Mono", monospace', fontWeight: 700, lineHeight: 1.18, color: INK}}>
        {shown.map((l, i) => (
          <div key={i} style={{minHeight: fs * 1.18}}>
            {l}
            {i === lastIdx && <span style={{display: 'inline-block', width: fs * 0.49, height: fs * 0.95, marginLeft: 6, verticalAlign: 'text-bottom', background: cursorOn ? INK : 'transparent'}} />}
          </div>
        ))}
      </div>
      {s.sub && <div style={{position: 'absolute', top: wide ? 200 : 520, left: wide ? 150 : 70, fontFamily: headlineFont, fontWeight: 700, fontSize: wide ? 56 : 64, color: accent, opacity: fadeIn(frame, 8, 8)}}>{s.sub}</div>}
      {s.prop && (
        <div style={{position: 'absolute', ...(wide ? {right: 90, width: 640, top: 150, height: 640} : {left: 0, right: 0, bottom: 10, height: 520}), transform: `translateY(${prop}px)`, perspective: 1100}}>
          <div style={{width: '100%', height: '100%', transform: 'rotateX(24deg) scale(1)', transformOrigin: 'center bottom', filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.25))'}}>
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
  // Long suffixes ("LAKH CRORE", "BILLION") go on their own line under the number so nothing runs off the 1080 px frame.
  const stacked = (s.suffix ?? '').trim().length > 3;
  const wide = useWide();
  // wide: icon on the left third, number block on the right
  const iconBox: React.CSSProperties = wide ? {left: '6%', width: '30%', top: '12%', height: '62%'} : stacked ? {left: '26%', width: '48%', top: '5%', height: '21%'} : {left: '22%', width: '56%', top: '7%', height: '25%'};
  const numBox: React.CSSProperties = wide ? {top: stacked ? 190 : 260, left: s.icon ? 700 : 80, right: 80} : {top: stacked ? 500 : 700, left: 30, right: 30};
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <VoxBg />
      {s.icon && <Cut src={s.icon} stroke delay={2} from={wide ? 'left' : 'top'} rot={-4} box={iconBox} pos="center center" />}
      <div style={{position: 'absolute', ...numBox, textAlign: 'center', transform: `scale(${pop})`}}>
        <div style={{fontFamily: headlineFont, fontWeight: 700, fontSize: 300, lineHeight: 0.95, color: INK, letterSpacing: -2}}>
          {s.prefix}
          {txt}
          {!stacked && <span style={{color: accent, fontSize: (s.suffix ?? '').trim().length > 2 ? 150 : undefined, letterSpacing: 0}}>{s.suffix}</span>}
        </div>
        {stacked && <div style={{fontFamily: headlineFont, fontWeight: 700, fontSize: 150, lineHeight: 0.95, color: accent, letterSpacing: 0}}>{(s.suffix ?? '').trim()}</div>}
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
  const wide = useWide();
  const W = wide ? 1280 : 860;
  const H = wide ? 540 : 520;
  const pad = {l: 70, r: 30, t: 30, b: 60};
  const all = [...s.points, ...(s.previous ?? [])];
  const lo = Math.min(0, ...all);
  const hi = Math.max(...all) * 1.12;
  // x position: by real value (s.xs, e.g. years -> a missing year leaves an honest gap) or evenly by index
  const xs = s.xs && s.xs.length === s.points.length ? s.xs : null;
  const x = (i: number, n: number) => {
    if (xs && n === xs.length) return pad.l + ((xs[i] - xs[0]) / Math.max(1e-9, xs[xs.length - 1] - xs[0])) * (W - pad.l - pad.r);
    return pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r);
  };
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i, arr.length).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const draw = interpolate(frame, [8, Math.max(24, dur * 0.7)], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.cubic)});
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => lo + (hi - lo) * t);
  const enter = interpolate(frame, [0, 10], [0.9, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const calloutAt = Math.max(24, dur * 0.7);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <VoxBg />
      {/* title = big headline above the card (readable from frame 0), callout = big label between card and captions (y < 1230) */}
      {/* wide: title left-aligned over the card, callout in the title row on the right (captions sit below the card) */}
      <div style={{position: 'absolute', ...(wide ? {top: 60, left: 270, right: 700, textAlign: 'left'} : {top: 120, left: 40, right: 40, textAlign: 'center'})}}>
        <div style={{fontFamily: headlineFont, fontWeight: 700, fontSize: wide ? 92 : 104, lineHeight: 0.95, color: INK, textTransform: 'uppercase', letterSpacing: -1, whiteSpace: wide ? 'nowrap' : undefined}}>{s.title}</div>
        <div style={{height: 12, width: `${interpolate(frame, [4, 20], [0, 60], CLAMP)}%`, margin: wide ? '14px 0 0' : '16px auto 0', background: accent, borderRadius: 6}} />
      </div>
      <div style={{position: 'absolute', left: wide ? 270 : 60, top: wide ? 200 : 330, width: wide ? 1380 : 960, boxSizing: wide ? 'border-box' : undefined, padding: wide ? '26px 50px 22px' : '30px 50px 26px', background: '#faf6ea', borderRadius: 34, boxShadow: '0 30px 60px rgba(60,40,10,0.22), 0 0 0 2px rgba(60,40,10,0.08)', transform: `scale(${enter})`, opacity: fadeIn(frame, 0, 6)}}>
        {s.unit && <div style={{fontFamily: headlineFont, fontWeight: 700, fontSize: 44, color: '#6b6354'}}>{s.unit}</div>}
        <svg width={W} height={H} style={{marginTop: 10, overflow: 'visible'}}>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(60,50,30,0.14)" strokeWidth={2} />
              <text x={pad.l - 14} y={y(t) + 10} textAnchor="end" fontSize={34} fontFamily={headlineFont} fill="#6b6354">
                {Math.round(t)}
              </text>
            </g>
          ))}
          {(s.labels ?? []).map((l, i, a) => (
            <text key={i} x={x(i, a.length)} y={H - 12} textAnchor="middle" fontSize={38} fontFamily={headlineFont} fill="#6b6354">
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
      </div>
      {s.callout && (
        <div style={{position: 'absolute', ...(wide ? {right: 270, top: 40} : {left: 0, right: 0, top: 1010, justifyContent: 'center'}), display: 'flex', opacity: fadeIn(frame, calloutAt, 8), transform: `scale(${interpolate(frame, [calloutAt, calloutAt + 8], [0.7, 1], {...CLAMP, easing: Easing.out(Easing.back(1.8))})})`}}>
          <div style={{display: 'flex', gap: 28, alignItems: 'baseline', padding: '14px 36px', background: '#fff', border: `7px solid ${accent}`, borderRadius: 22, boxShadow: '0 18px 36px rgba(60,40,10,0.18)', fontFamily: headlineFont, fontWeight: 700, fontSize: wide ? 84 : 100, lineHeight: 1, color: INK}}>
            {s.callout.split('|').map((l, i) => (
              <span key={i} style={{color: i ? accent : INK}}>
                {l}
              </span>
            ))}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// 5) CHAPTER (long videos): "CHAPTER 3" pill + big chapter title + optional year/sub line and icon cut-out
export const ChapterCard: React.FC<{s: ChapterScene; dur: number}> = ({s}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const wide = useWide();
  const pill = spring({frame: frame - 2, fps: 30, config: {damping: 14}});
  const lines = s.title.split('|');
  const longest = Math.max(...lines.map((l) => l.length));
  const fit = Math.min(wide ? 190 : 170, Math.floor((wide ? 1600 : 940) / (longest * 0.47)));
  const top = s.icon ? (wide ? 470 : 820) : wide ? 330 : 640;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <VoxBg />
      {s.icon && <Cut src={s.icon} stroke delay={6} from="top" rot={-3} pos="center center" box={wide ? {left: '38%', width: '24%', top: '6%', height: '36%'} : {left: '25%', width: '50%', top: '14%', height: '22%'}} />}
      <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center'}}>
        {s.number !== undefined && (
          <div style={{display: 'inline-block', padding: '8px 30px', marginBottom: 22, background: accent, color: '#fff', borderRadius: 40, fontFamily: headlineFont, fontWeight: 700, fontSize: wide ? 46 : 52, letterSpacing: 3, transform: `scale(${pill})`}}>
            CHAPTER {s.number}
          </div>
        )}
        <div style={{transform: `scale(${interpolate(frame, [0, 12], [0.88, 1], {...CLAMP, easing: Easing.out(Easing.cubic)})})`, opacity: fadeIn(frame, 2, 8)}}>
          {lines.map((l, i) => (
            <div key={i} style={{fontFamily: headlineFont, fontWeight: 700, fontSize: fit, lineHeight: 0.92, color: INK, textTransform: 'uppercase', letterSpacing: -1}}>
              {l}
            </div>
          ))}
        </div>
        <div style={{height: 14, width: `${interpolate(frame, [10, 28], [0, 40], CLAMP)}%`, margin: '20px auto 0', background: accent, borderRadius: 7}} />
        {s.sub && <div style={{marginTop: 22, fontFamily: headlineFont, fontWeight: 700, fontSize: wide ? 56 : 64, color: '#3b342a', opacity: fadeIn(frame, 16, 10)}}>{s.sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

// 6) TIMELINE: dated events pop in one after another along a self-drawing line (horizontal in 16:9, vertical on a phone)
export const Timeline: React.FC<{s: TimelineScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const wide = useWide();
  const n = s.events.length;
  const draw = interpolate(frame, [6, Math.max(20, dur * 0.75)], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.cubic)});
  const shownAt = (i: number) => 6 + (Math.max(20, dur * 0.75) - 6) * (n === 1 ? 0 : i / (n - 1));
  const hl = s.highlight ?? n - 1;
  const a = wide ? {x0: 180, x1: 1740, y: 540} : {x: 200, y0: 420, y1: 1150};
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <VoxBg />
      {s.title && (
        <div style={{position: 'absolute', top: wide ? 90 : 150, left: 60, right: 60, textAlign: 'center', fontFamily: headlineFont, fontWeight: 700, fontSize: wide ? 96 : 104, lineHeight: 0.95, color: INK, textTransform: 'uppercase', opacity: fadeIn(frame, 0, 6)}}>
          {s.title}
        </div>
      )}
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
        {wide ? (
          <line x1={a.x0} x2={a.x0! + (a.x1! - a.x0!) * draw} y1={a.y} y2={a.y} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        ) : (
          <line x1={a.x} x2={a.x} y1={a.y0} y2={a.y0! + (a.y1! - a.y0!) * draw} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        )}
      </svg>
      {s.events.map((e, i) => {
        const at = shownAt(i);
        const p = spring({frame: frame - at, fps: 30, config: {damping: 12, mass: 0.7}});
        if (frame < at) return null;
        const big = i === hl;
        const pos = n === 1 ? 0.5 : i / (n - 1);
        const dot = big ? 46 : 32;
        if (wide) {
          const x = a.x0! + (a.x1! - a.x0!) * pos;
          const up = i % 2 === 0; // alternate above / below the line so labels never collide
          return (
            <div key={i} style={{position: 'absolute', left: x - 170, width: 340, top: 0, height: '100%', transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: `170px ${a.y}px`, opacity: Math.min(1, p * 1.5)}}>
              <div style={{position: 'absolute', left: 170 - dot / 2, top: a.y! - dot / 2, width: dot, height: dot, borderRadius: '50%', background: big ? accent : '#faf6ea', border: `7px solid ${big ? INK : accent}`, boxSizing: 'border-box'}} />
              <div style={{position: 'absolute', left: 0, right: 0, textAlign: 'center', ...(up ? {bottom: 1080 - a.y! + 40} : {top: a.y! + 40})}}>
                <div style={{fontFamily: headlineFont, fontWeight: 700, fontSize: big ? 80 : 64, lineHeight: 1, color: big ? accent : INK}}>{e.year}</div>
                <div style={{marginTop: 8, fontFamily: headlineFont, fontWeight: 700, fontSize: 40, lineHeight: 1.05, color: '#3b342a', textTransform: 'uppercase'}}>{e.label}</div>
              </div>
            </div>
          );
        }
        const y = a.y0! + (a.y1! - a.y0!) * pos;
        return (
          <div key={i} style={{position: 'absolute', left: a.x! - dot / 2, top: y - 50, right: 60, display: 'flex', alignItems: 'flex-start', gap: 36, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * 60}px)`}}>
            <div style={{flex: 'none', width: dot, height: dot, marginTop: 50 - dot / 2, borderRadius: '50%', background: big ? accent : '#faf6ea', border: `7px solid ${big ? INK : accent}`, boxSizing: 'border-box'}} />
            <div>
              <div style={{fontFamily: headlineFont, fontWeight: 700, fontSize: big ? 92 : 76, lineHeight: 1, color: big ? accent : INK}}>{e.year}</div>
              <div style={{fontFamily: headlineFont, fontWeight: 700, fontSize: 48, lineHeight: 1.05, color: '#3b342a', textTransform: 'uppercase'}}>{e.label}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
