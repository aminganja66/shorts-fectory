import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, spring} from 'remotion';
import {CollageScene, KineticScene, ChartScene, VersusScene, StackScene, EndScene} from '../types';
import {Photo, PaperBg, Card, useEpisode} from './common';
import {boil, camera, pop, fadeIn, drift} from '../film/motion';
import {headlineFont} from '../fonts';

const Headline: React.FC<{text: string; start?: number; top?: number; size?: number}> = ({text, start = 6, top = 220, size = 120}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const s = pop(frame, start, 12);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 60,
        right: 60,
        textAlign: 'center',
        fontFamily: headlineFont,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 0.95,
        color: '#fff',
        textTransform: 'uppercase',
        transform: `scale(${s})`,
        opacity: Math.min(1, s),
        textShadow: `0 6px 0 ${accent}, 0 12px 30px rgba(0,0,0,0.8)`,
      }}
    >
      {text.split('|').map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

// 1) COLLAGE: background + mid layer + foreground subject, each drifting at a different speed (parallax)
export const Collage: React.FC<{s: CollageScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const cam = camera(s.motion, frame, dur);
  const b1 = boil(frame, 'mid', 1.2);
  const b2 = boil(frame, 'fg', 2.2);
  const fgIn = spring({frame: frame - 4, fps: 30, config: {damping: 14, mass: 0.7}});
  // gold frame: welded to photo, detaches (scales away faster) mid-push
  const detach = interpolate(frame, [dur * 0.35, dur * 0.65], [1, 1.6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const frameOpacity = interpolate(frame, [dur * 0.5, dur * 0.7], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${cam.scale}) translate(${cam.x}px, ${cam.y}px)`}}>
        {s.bg ? <Photo src={s.bg} /> : <PaperBg />}
      </AbsoluteFill>
      {s.mid && (
        <AbsoluteFill
          style={{
            transform: `scale(${cam.scale * 1.04}) translate(${cam.x * 1.5 + b1.x}px, ${cam.y * 1.5 + b1.y}px)`,
            top: '30%',
            height: '55%',
          }}
        >
          <Photo src={s.mid} fit="contain" style={{filter: 'drop-shadow(0 25px 40px rgba(0,0,0,0.6))'}} />
        </AbsoluteFill>
      )}
      {s.fg &&
        (s.fgStyle === 'cutout' ? (
          <AbsoluteFill
            style={{
              top: '36%',
              height: '64%',
              left: s.fg2 ? '-12%' : 0,
              width: s.fg2 ? '68%' : '100%',
              transform: `translate(${b2.x + drift(frame, dur, -10, 10)}px, ${(1 - fgIn) * 400 + b2.y}px) rotate(${b2.r}deg) scale(${cam.scale * 1.05})`,
            }}
          >
            <Photo src={s.fg} fit="contain" style={{objectPosition: 'bottom', filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.7))'}} />
          </AbsoluteFill>
        ) : (
          <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 760}}>
            <div style={{transform: `translate(${b2.x}px, ${(1 - fgIn) * 500 + b2.y}px) rotate(${-4 + b2.r}deg)`}}>
              <Card src={s.fg} w={520} h={580} />
            </div>
          </AbsoluteFill>
        ))}
      {s.goldFrame && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: frameOpacity}}>
          <div
            style={{
              width: 760,
              height: 1100,
              border: '18px solid #c9a24a',
              boxShadow: 'inset 0 0 0 4px #7a5b1c, 0 0 0 4px #e9cf8a, 0 30px 80px rgba(0,0,0,0.6)',
              transform: `scale(${cam.scale * detach})`,
            }}
          />
        </AbsoluteFill>
      )}
      {s.fg2 && (
        <AbsoluteFill
          style={{
            top: '36%',
              height: '64%',
            left: '44%',
            width: '68%',
            transform: `translate(${-b2.x + drift(frame, dur, 10, -10)}px, ${(1 - spring({frame: frame - 9, fps: 30, config: {damping: 14, mass: 0.7}})) * 400 - b2.y}px) rotate(${-b2.r}deg) scale(${cam.scale * 1.05})`,
          }}
        >
          <Photo src={s.fg2} fit="contain" style={{objectPosition: 'bottom', filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.7))'}} />
        </AbsoluteFill>
      )}
      {s.logo && (
        <AbsoluteFill
          style={{
            justifyContent: s.logoPos === 'bottom' ? 'flex-end' : s.logoPos === 'center' ? 'center' : 'flex-start',
            alignItems: 'center',
            padding: s.logoPos === 'bottom' ? '0 0 760px' : s.logoPos === 'center' ? 0 : '420px 0 0',
          }}
        >
          <div style={{width: 560, height: 220, transform: `scale(${pop(frame, 10, 12)}) rotate(${boil(frame, 'logo', 1).r}deg)`}}>
            <Photo src={s.logo} fit="contain" style={{filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.85))'}} />
          </div>
        </AbsoluteFill>
      )}
      {s.headline && <Headline text={s.headline} />}
    </AbsoluteFill>
  );
};

// 2) KINETIC TYPE: words punch in one by one
export const Kinetic: React.FC<{s: KineticScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const cam = camera('push', frame, dur);
  const lines = s.text.split('|').map((l) => l.trim().split(/\s+/));
  let idx = 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${cam.scale})`, filter: 'brightness(0.45) blur(2px)'}}>
        {s.bg ? <Photo src={s.bg} /> : <PaperBg />}
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 70}}>
        {lines.map((words, li) => (
          <div key={li} style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22}}>
            {words.map((w) => {
              const i = idx++;
              const p = pop(frame, 3 + i * 4, 9);
              const hot = s.highlight?.some((h) => w.includes(h));
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: headlineFont,
                    fontWeight: 700,
                    fontSize: 150,
                    lineHeight: 1,
                    color: hot ? accent : '#fff',
                    transform: `scale(${p}) translateY(${(1 - Math.min(p, 1)) * 40}px)`,
                    opacity: Math.min(1, p * 1.5),
                    textShadow: '0 10px 30px rgba(0,0,0,0.7)',
                    display: 'inline-block',
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 3) CHART: bars grow + numbers count up
export const Chart: React.FC<{s: ChartScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const {accent} = useEpisode();
  const max = Math.max(...s.bars.map((b) => b.value));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'brightness(0.35)'}}>{s.bg ? <Photo src={s.bg} /> : <PaperBg />}</AbsoluteFill>
      <Headline text={s.title} start={0} top={250} size={100} />
      {/* chart lives between the title (y≈250-360) and the captions (y≈1230) */}
      <div style={{position: 'absolute', top: 430, height: 720, left: 90, right: 90, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 20}}>
        {s.bars.map((b, i) => {
          const g = interpolate(frame, [8 + i * 8, 8 + i * 8 + dur * 0.45], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          const h = Math.max(6, (b.value / max) * 470 * g);
          const val = b.value * g;
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 210}}>
              <div style={{fontFamily: headlineFont, fontSize: 96, lineHeight: 1, color: '#fff', fontWeight: 700, textShadow: '0 6px 20px rgba(0,0,0,0.8)'}}>
                {val >= 100 ? Math.round(val) : val >= 1 ? val.toFixed(1) : val.toFixed(2)}
                <span style={{fontSize: 56}}>{s.unit ?? ''}</span>
              </div>
              <div style={{width: '100%', height: h, background: b.color ?? accent, boxShadow: '0 20px 50px rgba(0,0,0,0.6)'}} />
              <div style={{fontFamily: headlineFont, fontSize: 60, lineHeight: 1, color: '#eee', marginTop: 18, textAlign: 'center', height: 70}}>{b.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 4) VERSUS: two halves slide in, loser desaturates
export const Versus: React.FC<{s: VersusScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {accent} = useEpisode();
  const inL = spring({frame, fps, config: {damping: 16}});
  const inR = spring({frame: frame - 5, fps, config: {damping: 16}});
  const verdict = interpolate(frame, [dur * 0.55, dur * 0.75], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const side = (which: 'left' | 'right') => {
    const d = which === 'left' ? s.left : s.right;
    const loser = s.winner && s.winner !== which;
    const p = which === 'left' ? inL : inR;
    const b = boil(frame, which, 1.5);
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: which === 'left' ? 0 : '50%',
          height: '50%',
          overflow: 'hidden',
          transform: `translateX(${(1 - p) * (which === 'left' ? -1100 : 1100)}px)`,
        }}
      >
        <div style={{position: 'absolute', inset: -20, transform: `scale(${drift(frame, dur, 1.05, 1.15)}) translate(${b.x}px, ${b.y}px)`, filter: loser ? `grayscale(${verdict}) brightness(${1 - verdict * 0.4})` : undefined}}>
          <Photo src={d.image} />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: which === 'left' ? 30 : undefined,
            top: which === 'right' ? 30 : undefined,
            left: 40,
            fontFamily: headlineFont,
            fontSize: 110,
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 8px 24px rgba(0,0,0,0.9)',
            textDecoration: loser && verdict > 0.5 ? `line-through 10px ${accent}` : undefined,
          }}
        >
          {d.label}
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {side('left')}
      {side('right')}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            fontFamily: headlineFont,
            fontSize: 130,
            fontWeight: 700,
            color: '#fff',
            background: accent,
            padding: '0 34px',
            transform: `scale(${pop(frame, 10, 10)}) rotate(-4deg)`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          VS
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 5) STACK: polaroids drop onto a table one after another
export const Stack: React.FC<{s: StackScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = camera('drift', frame, dur);
  const rots = [-7, 5, -3, 8];
  const offs = [
    [-120, -260],
    [130, -60],
    [-90, 160],
    [110, 330],
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${cam.scale})`, filter: 'brightness(0.55)'}}>{s.bg ? <Photo src={s.bg} /> : <PaperBg />}</AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        {s.images.slice(0, 4).map((img, i) => {
          const start = 2 + i * Math.max(6, Math.floor(dur / (s.images.length + 2)));
          const p = spring({frame: frame - start, fps, config: {damping: 12, mass: 0.6}});
          const b = boil(frame, `st${i}`, 1.6);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                transform: `translate(${offs[i][0] + b.x}px, ${offs[i][1] + b.y}px) scale(${2.2 - p * 1.2}) rotate(${rots[i] + b.r}deg)`,
                opacity: p > 0.02 ? 1 : 0,
              }}
            >
              <Card src={img} w={520} h={560} />
            </div>
          );
        })}
      </AbsoluteFill>
      {s.caption && <Headline text={s.caption} start={dur * 0.5} top={1380} size={100} />}
    </AbsoluteFill>
  );
};

// 6) END: punchline over slow pull
export const End: React.FC<{s: EndScene; dur: number}> = ({s, dur}) => {
  const frame = useCurrentFrame();
  const cam = camera('pull', frame, dur);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${cam.scale})`, filter: 'brightness(0.5)'}}>{s.bg ? <Photo src={s.bg} /> : <PaperBg />}</AbsoluteFill>
      <Headline text={s.text} start={4} top={620} size={140} />
      {s.sub && (
        <div
          style={{
            position: 'absolute',
            top: 1000,
            left: 80,
            right: 80,
            textAlign: 'center',
            fontFamily: headlineFont,
            fontSize: 72,
            color: '#ddd',
            opacity: fadeIn(frame, 18, 12),
          }}
        >
          {s.sub}
        </div>
      )}
    </AbsoluteFill>
  );
};
