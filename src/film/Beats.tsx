import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, random, Easing} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Beat} from '../types';
import {useEpisode} from '../scenes/common';

const c = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Default entrance used by every scene (frames 0-8): whip in with motion blur + flash.
const ENTRANCES: Record<string, Beat[]> = {
  whip: [{at: 0, do: 'blur-in', len: 8}],
  flash: [{at: 0, do: 'flash', len: 6}, {at: 0, do: 'punch', len: 8}],
  zoom: [{at: 0, do: 'zoom-in', len: 12}],
  glitch: [{at: 0, do: 'glitch-in', len: 7}],
  cut: [],
};

const DEFAULT_LEN: Record<Beat['do'], number> = {'zoom-through': 12, punch: 6, shake: 8, flash: 5, 'whip-out': 7, 'blur-in': 8, 'zoom-in': 10, 'glitch-in': 7};

const camFor = (beats: Beat[], frame: number) => {
  let scale = 1;
  let x = 0;
  let y = 0;
  let blurPx = 0;
  let flash = 0;
  for (const b of beats) {
    const len = b.len ?? DEFAULT_LEN[b.do];
    const t = frame - b.at;
    if (t < 0) continue;
    switch (b.do) {
      case 'blur-in':
        scale *= interpolate(t, [0, len], [1.14, 1], c);
        blurPx += interpolate(t, [0, len * 0.9], [16, 0], c);
        flash += interpolate(t, [0, 5], [0.45, 0], c);
        break;
      case 'zoom-through': // push hard into the image (gold frame "detach" moment)
        scale *= interpolate(t, [0, len], [1, 1.9], {...c, easing: Easing.in(Easing.cubic)});
        blurPx += t < len ? interpolate(t, [0, len * 0.7, len], [0, 10, 0], c) : 0;
        break;
      case 'zoom-in': // starts close and pulls back into place
        scale *= interpolate(t, [0, len], [1.35, 1], {...c, easing: Easing.out(Easing.cubic)});
        blurPx += interpolate(t, [0, len * 0.6], [8, 0], c);
        break;
      case 'glitch-in':
        if (t < len) {
          x += (random(`gx${b.at}-${t}`) - 0.5) * 70 * (1 - t / len);
          blurPx += t % 2 ? 4 : 0;
          flash += t === 0 ? 0.35 : 0;
        }
        break;
      case 'punch':
        scale *= interpolate(t, [0, len * 0.4, len], [1, 1.12, 1.05], c);
        break;
      case 'shake':
        if (t < len) {
          const a = interpolate(t, [0, len], [18, 0], c);
          x += (random(`sx${b.at}-${t}`) - 0.5) * a * 2;
          y += (random(`sy${b.at}-${t}`) - 0.5) * a * 2;
        }
        break;
      case 'flash':
        flash += interpolate(t, [0, len], [0.7, 0], c);
        break;
      case 'whip-out':
        x += interpolate(t, [0, len], [0, -1400], {...c, easing: Easing.in(Easing.quad)});
        blurPx += interpolate(t, [0, len], [0, 14], c);
        break;
    }
  }
  return {scale, x, y, blurPx, flash};
};

// True motion blur only while something fast is happening (it's expensive to render).
const inFastWindow = (beats: Beat[], frame: number) =>
  beats.some((b) => ['blur-in', 'zoom-through', 'whip-out', 'zoom-in'].includes(b.do) && frame >= b.at && frame < b.at + (b.len ?? DEFAULT_LEN[b.do]));

export const BeatCamera: React.FC<{beats?: Beat[]; dur: number; children: React.ReactNode}> = ({beats = [], dur, children}) => {
  const frame = useCurrentFrame();
  // negative "at" counts back from the scene end: {at: -12, do: 'zoom-through'} = dive into the next scene
  const {theme} = useEpisode();
  const all = [...(ENTRANCES[theme.transition ?? 'whip'] ?? ENTRANCES.whip), ...beats.map((b) => (b.at < 0 ? {...b, at: Math.max(0, dur + b.at)} : b))];
  const k = camFor(all, frame);
  const content = (
    <AbsoluteFill style={{transform: `translate(${k.x}px, ${k.y}px) scale(${k.scale})`, filter: k.blurPx > 0.3 ? `blur(${k.blurPx}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {inFastWindow(all, frame) ? (
        <CameraMotionBlur shutterAngle={180} samples={5}>
          {content}
        </CameraMotionBlur>
      ) : (
        content
      )}
      {k.flash > 0.01 && <AbsoluteFill style={{background: '#fff', opacity: Math.min(1, k.flash)}} />}
    </AbsoluteFill>
  );
};
