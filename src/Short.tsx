import React from 'react';
import {AbsoluteFill, Sequence, Audio, staticFile, useVideoConfig, useCurrentFrame} from 'remotion';
import {ShortProps, Line, Scene, Timing, Storyboard} from './types';
import {EpisodeCtx} from './scenes/common';
import {Collage, Kinetic, Chart, Versus, Stack, End} from './scenes/Scenes';
import {Vox, Typewriter, Counter, LineChart} from './scenes/Vox';
import {FilmOverlay, GateWeave, gradeFilter} from './film/FilmLook';
import {Captions} from './Captions';
import {BeatCamera} from './film/Beats';
import {FxLayer} from './film/Fx';

export const FPS = 30;
export const TAIL = 0.8; // seconds of breathing room after the last word

// If there is no voice yet, estimate timings so the Studio can preview an "animatic".
export const estimateTiming = (sb: Storyboard): Timing => {
  let t = 0.2;
  const words: Timing['words'] = [];
  const lines = sb.lines.map((l) => {
    const ws = l.text.split(/\s+/).filter(Boolean);
    const start = t;
    ws.forEach((w) => {
      words.push({text: w, start: t, end: t + 0.42});
      t += 0.5;
    });
    t += 0.6; // pause between lines
    return {id: l.id, start, end: t};
  });
  return {words, lines, duration: t};
};

const renderScene = (s: Scene, dur: number) => {
  switch (s.type) {
    case 'collage':
      return <Collage s={s} dur={dur} />;
    case 'kinetic':
      return <Kinetic s={s} dur={dur} />;
    case 'chart':
      return <Chart s={s} dur={dur} />;
    case 'versus':
      return <Versus s={s} dur={dur} />;
    case 'stack':
      return <Stack s={s} dur={dur} />;
    case 'end':
      return <End s={s} dur={dur} />;
    case 'vox':
      return <Vox s={s} dur={dur} />;
    case 'typewriter':
      return <Typewriter s={s} dur={dur} />;
    case 'counter':
      return <Counter s={s} dur={dur} />;
    case 'line':
      return <LineChart s={s} dur={dur} />;
  }
};

const Music: React.FC<{file: string; volume: number; timing: Timing; total: number}> = ({file, volume, timing, total}) => {
  const {fps} = useVideoConfig();
  return (
    <Audio
      src={staticFile(`music/${file}`)}
      volume={(f) => {
        const t = f / fps;
        const fade = Math.min(1, t / 0.8, (total / fps - t) / 1.2);
        const speaking = timing.words.some((w) => t >= w.start - 0.1 && t <= w.end + 0.2);
        return Math.max(0, volume * (speaking ? 0.55 : 1) * fade); // duck under the voice
      }}
    />
  );
};

const ProgressBar: React.FC<{color: string}> = ({color}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return <div style={{position: 'absolute', left: 0, bottom: 0, height: 16, width: `${(frame / Math.max(1, durationInFrames - 1)) * 100}%`, background: color}} />;
};

export const Short: React.FC<ShortProps> = ({episodeId, storyboard, timing, thumb}) => {
  const {durationInFrames} = useVideoConfig();
  if (!storyboard) return <AbsoluteFill style={{background: '#000'}} />;
  const tm = timing ?? estimateTiming(storyboard);
  const accent = storyboard.theme?.accent ?? '#E50914';
  const starts = storyboard.lines.map((l: Line, i) => (i === 0 ? 0 : Math.round((tm.lines[i]?.start ?? 0) * FPS)));
  return (
    <EpisodeCtx.Provider value={{id: episodeId, accent, theme: storyboard.theme ?? {}}}>
      <AbsoluteFill style={{background: '#000'}}>
        <GateWeave>
          <AbsoluteFill style={{filter: gradeFilter(storyboard.theme?.grade, storyboard.theme?.look)}}>
            {storyboard.lines.map((l, i) => {
              const from = starts[i];
              const to = i < starts.length - 1 ? starts[i + 1] : durationInFrames;
              const dur = Math.max(1, to - from);
              return (
                <Sequence key={l.id} from={from} durationInFrames={dur} name={`Scene ${l.id} · ${l.scene.type}`}>
                  <BeatCamera beats={l.beats} dur={dur}>
                    {renderScene(l.scene, dur)}
                    <FxLayer fx={l.fx} />
                  </BeatCamera>
                  {l.sfx && (
                    <Sequence from={Math.round((l.sfxAt ?? 0) * FPS)}>
                      <Audio src={staticFile(`sfx/${l.sfx}`)} volume={0.5} />
                    </Sequence>
                  )}
                </Sequence>
              );
            })}
          </AbsoluteFill>
        </GateWeave>
        <FilmOverlay look={storyboard.theme?.look} />
        {(storyboard.theme?.progressBar ?? storyboard.theme?.look === 'vox') && <ProgressBar color={accent} />}
        {!thumb && <Captions words={tm.words} style={storyboard.theme?.captionStyle} />}
        {timing && storyboard.voice?.file && <Audio src={staticFile(`episodes/${episodeId}/${storyboard.voice.file}`)} />}
        {storyboard.music?.file && <Music file={storyboard.music.file} volume={storyboard.music.volume ?? 0.16} timing={tm} total={durationInFrames} />}
      </AbsoluteFill>
    </EpisodeCtx.Provider>
  );
};
