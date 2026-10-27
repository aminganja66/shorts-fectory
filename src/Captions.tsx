import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {Word, CaptionStyle} from './types';
import {captionFont} from './fonts';
import {useEpisode} from './scenes/common';

// Groups words into short chunks (max 3 words, or split at pauses) and highlights the spoken word.
const chunk = (words: Word[]) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const pause = prev && w.start - prev.end > 0.3;
    if (cur.length >= 3 || (pause && cur.length)) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
    if (/[.!?।,]$/.test(w.text)) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) out.push(cur);
  return out;
};

export const Captions: React.FC<{words: Word[]; style?: CaptionStyle}> = ({words, style = 'highlight'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {accent} = useEpisode();
  const t = frame / fps;
  const hl = accent === '#E50914' ? '#FFD400' : accent;

  // POP: one word at a time, big and punchy
  if (style === 'pop') {
    const w = words.find((x) => t >= x.start - 0.03 && t <= x.end + 0.08);
    if (!w) return null;
    const p = interpolate(t, [w.start - 0.03, w.start + 0.06, w.start + 0.14], [0.6, 1.15, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <div style={{position: 'absolute', top: 1180, left: 40, right: 40, textAlign: 'center', transform: `scale(${p})`}}>
        <span style={{fontFamily: captionFont, fontWeight: 800, fontSize: 118, color: '#fff', WebkitTextStroke: '5px #000', paintOrder: 'stroke fill', textShadow: `0 8px 0 ${hl}`}}>{w.text}</span>
      </div>
    );
  }

  const groups = chunk(words);
  const g = groups.find((c) => t >= c[0].start - 0.05 && t <= c[c.length - 1].end + 0.15);
  if (!g) return null;
  const enter = interpolate(t, [g[0].start - 0.05, g[0].start + 0.08], [0.85, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const boxed = style === 'boxed';
  return (
    <div
      style={{
        position: 'absolute',
        top: 1230,
        left: 50,
        right: 50,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: boxed ? 14 : 18,
        transform: `scale(${enter})`,
        ...(boxed ? {background: 'rgba(0,0,0,0.62)', padding: '18px 26px', borderRadius: 18, left: 90, right: 90} : {}),
      }}
    >
      {g.map((w, i) => {
        const active = t >= w.start && t <= w.end + 0.05;
        const past = t > w.end + 0.05;
        const base: React.CSSProperties = {fontFamily: captionFont, fontWeight: 800, fontSize: boxed ? 74 : 84, lineHeight: 1.15, padding: '0 10px', borderRadius: 10, display: 'inline-block'};
        const stroke: React.CSSProperties = {WebkitTextStroke: '3px #000', paintOrder: 'stroke fill', textShadow: '0 6px 18px rgba(0,0,0,0.9)'};
        let st: React.CSSProperties;
        switch (style) {
          case 'outline':
            st = {...base, ...stroke, color: active ? hl : '#fff', transform: `scale(${active ? 1.12 : 1})`};
            break;
          case 'boxed':
            st = {...base, color: '#fff', borderBottom: active ? `6px solid ${hl}` : '6px solid transparent', borderRadius: 0};
            break;
          case 'karaoke':
            st = {...base, ...stroke, color: active || past ? hl : 'rgba(255,255,255,0.75)'};
            break;
          case 'highlight':
          default:
            st = active ? {...base, color: '#111', background: hl} : {...base, ...stroke, color: '#fff'};
        }
        return (
          <span key={i} style={st}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
