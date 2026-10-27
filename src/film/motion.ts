import {interpolate, random, Easing} from 'remotion';

// "Boil": tiny jitter that only changes every `step` frames (posterized time),
// the hand-made stop-motion feel from collage reels.
export const boil = (frame: number, seed: string, amount = 1.5, step = 3) => {
  const f = Math.floor(frame / step);
  return {
    x: (random(`${seed}-x-${f}`) - 0.5) * amount * 2,
    y: (random(`${seed}-y-${f}`) - 0.5) * amount * 2,
    r: (random(`${seed}-r-${f}`) - 0.5) * amount * 0.4,
  };
};

// Slow continuous drift for parallax layers.
export const drift = (frame: number, dur: number, from: number, to: number) =>
  interpolate(frame, [0, dur], [from, to], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});

// Ping-pong / overshoot entrance (0 -> 1 with a little bounce).
export const pop = (frame: number, start: number, len = 10) =>
  interpolate(frame, [start, start + len * 0.6, start + len], [0, 1.08, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

export const fadeIn = (frame: number, start: number, len = 8) =>
  interpolate(frame, [start, start + len], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const camera = (motion: string | undefined, frame: number, dur: number) => {
  const t = (a: number, b: number) => drift(frame, dur, a, b);
  switch (motion) {
    case 'pull':
      return {scale: t(1.25, 1.05), x: 0, y: 0};
    case 'pan-left':
      return {scale: 1.18, x: t(40, -40), y: 0};
    case 'pan-right':
      return {scale: 1.18, x: t(-40, 40), y: 0};
    case 'drift':
      return {scale: t(1.1, 1.16), x: t(-12, 12), y: t(8, -8)};
    case 'push':
    default:
      return {scale: t(1.05, 1.28), x: 0, y: 0};
  }
};
