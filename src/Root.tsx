import React from 'react';
import {Composition, staticFile, CalculateMetadataFunction} from 'remotion';
import {Short, FPS, TAIL, estimateTiming} from './Short';
import {ShortProps, Storyboard, Timing} from './types';

// Loads storyboard.json (+ timing.json once the voice exists) for the chosen episode.
const calc: CalculateMetadataFunction<ShortProps> = async ({props}) => {
  const base = `episodes/${props.episodeId}`;
  const storyboard: Storyboard = await fetch(staticFile(`${base}/storyboard.json`)).then((r) => r.json());
  let timing: Timing | undefined;
  try {
    const r = await fetch(staticFile(`${base}/timing.json`));
    if (r.ok) timing = await r.json();
  } catch {
    timing = undefined;
  }
  const tm = timing ?? estimateTiming(storyboard);
  return {
    durationInFrames: Math.ceil((tm.duration + TAIL) * FPS),
    props: {...props, storyboard, timing},
  };
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="Short"
      component={Short}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={900}
      defaultProps={{episodeId: '2026-10-30-zomato-started-as-menu-card-scanning'} as ShortProps}
      calculateMetadata={calc}
    />
    {/* Long videos (storyboard.format = "long"): same scenes in 16:9 layouts (useWide in scenes/Vox.tsx) */}
    <Composition
      id="Long"
      component={Short}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={900}
      defaultProps={{episodeId: 'demo-netflix'} as ShortProps}
      calculateMetadata={calc}
    />
  </>
);
