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

export const Captions: React.FC<{words: Word[]; style?: CaptionStyle; onDark?: boolean}> = ({words, style = 'highlight', onDark = false}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const wide = width > height; // 16:9: smaller captions at the bottom (lower third), never one-word pops for 10 minutes
  const {accent} = useEpisode();
  const t = frame / fps;
  const hl = accent === '#E50914' ? '#FFD400' : accent;

  // POP: one word at a time, big and punchy
  if (style === 'pop' && !wide) {
    const w = words.find((x) => t >= x.start - 0.03 && t <= x.end + 0.08);
    if (!w) return null;
    const p = interpolate(t, [w.start - 0.03, w.start + 0.06, w.start + 0.14], [0.6, 1.15, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <div style={{position: 'absolute', top: 1180, left: 40, right: 40, textAlign: 'center', transform: `scale(${p})`}}>
        <span style={{fontFamily: captionFont, fontWeight: 800, fontSize: 118, color: '#fff', background: 'rgba(20,16,42,0.55)', padding: '4px 30px 10px', borderRadius: 28, display: 'inline-block', WebkitTextStroke: '10px #14102a', paintOrder: 'stroke fill', textShadow: `0 8px 0 ${hl}, 0 0 26px rgba(0,0,0,0.6)`}}>{w.text}</span>
      </div>
    );
  }

  const groups = chunk(words);
  const g = groups.find((c) => t >= c[0].start - 0.05 && t <= c[c.length - 1].end + 0.15);
  if (!g) return null;
  const enter = interpolate(t, [g[0].start - 0.05, g[0].start + 0.08], [0.85, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const boxed = style === 'boxed';
  const paper = style === 'paper';
  const cinema = style === 'cinema';
  return (
    <div
      style={{
        position: 'absolute',
        top: wide ? 890 : 1230,
        left: wide ? 260 : 50,
        right: wide ? 260 : 50,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: boxed ? 14 : 18,
        transform: `scale(${enter})`,
        ...(boxed ? {background: 'rgba(0,0,0,0.62)', padding: '18px 26px', borderRadius: 18, left: 90, right: 90} : {}),
        // paper: cream label strip with an accent underline: sits naturally on the light vox backdrops
        ...(paper ? {background: '#fbf8f0', padding: '14px 28px 18px', borderRadius: 14, borderBottom: `8px solid ${accent}`, boxShadow: '8px 10px 0 rgba(22,18,13,0.14)', ...(wide ? {left: 300, right: 300} : {left: 80, right: 80})} : {}),
        // cinema: no box, calm tracked type: for serious / documentary moments
        ...(cinema ? {gap: 14, ...(wide ? {left: 300, right: 300} : {left: 70, right: 70}), ...(onDark ? {} : {background: 'rgba(251,248,240,0.82)', padding: '8px 24px 12px', borderRadius: 12})} : {}),
      }}
    >
      {g.map((w, i) => {
        const active = t >= w.start && t <= w.end + 0.05;
        const past = t > w.end + 0.05;
        const base: React.CSSProperties = {fontFamily: captionFont, fontWeight: 800, fontSize: wide ? (boxed ? 54 : paper ? 56 : cinema ? 52 : 60) : boxed ? 74 : paper ? 76 : cinema ? 70 : 84, lineHeight: 1.15, padding: '0 10px', borderRadius: 10, display: 'inline-block'};
        const stroke: React.CSSProperties = {WebkitTextStroke: '3px #000', paintOrder: 'stroke fill', textShadow: '0 6px 18px rgba(0,0,0,0.9)'};
        let st: React.CSSProperties;
        switch (style) {
          case 'paper':
            st = {...base, color: '#16120d', borderRadius: 6, background: active ? `${hl}55` : 'transparent', boxShadow: active ? `inset 0 -10px 0 ${hl}88` : undefined};
            break;
          case 'cinema':
            // light scenes (vox paper): ink text with a soft cream halo · dark film scenes: white text
            st = onDark
              ? {...base, fontWeight: 600, letterSpacing: 3, color: active ? '#fff' : past ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.58)', textShadow: '0 3px 14px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9)'}
              : {...base, fontWeight: 800, letterSpacing: 2, color: active ? '#16120d' : past ? 'rgba(22,18,13,0.85)' : 'rgba(22,18,13,0.55)', textShadow: '0 0 14px rgba(255,250,235,0.9), 0 0 4px rgba(255,250,235,0.9)'};
            break;
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
