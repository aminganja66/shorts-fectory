import React from 'react';
import {AbsoluteFill, Sequence, Audio, staticFile, useVideoConfig, useCurrentFrame} from 'remotion';
import {ShortProps, Line, Scene, Timing, Storyboard, Motion} from './types';
import {EpisodeCtx} from './scenes/common';
import {Collage, Kinetic, Chart, Versus, Stack, End} from './scenes/Scenes';
import {Vox, Typewriter, Counter, LineChart, ChapterCard, Timeline} from './scenes/Vox';
import {headlineFont} from './fonts';
import {FilmOverlay, GateWeave, gradeFilter, FilmFinish, FILM_GRADE} from './film/FilmLook';
import {SceneCtx} from './scenes/Backdrop';
import {autoEnter, autoMotion, isFilm} from './film/direction';
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

const renderScene = (scene: Scene, dur: number, motion?: Motion) => {
  // theme.motion hands collage/vox scenes a varied camera move unless the scene sets its own
  const s = motion && (scene.type === 'vox' || scene.type === 'collage') && !scene.motion ? {...scene, motion} : scene;
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
    case 'chapter':
      return <ChapterCard s={s} dur={dur} />;
    case 'timeline':
      return <Timeline s={s} dur={dur} />;
  }
};

const Music: React.FC<{file: string; volume: number; timing: Timing; total: number}> = ({file, volume, timing, total}) => {
  const {fps} = useVideoConfig();
  return (
    <Audio
      loop // long videos run far past one track; a Short is shorter than its track, so nothing changes there
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

const ProgressBar: React.FC<{color: string; ticks?: number[]}> = ({color, ticks = []}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, width, height} = useVideoConfig();
  const h = width > height ? 10 : 16;
  return (
    <>
      <div style={{position: 'absolute', left: 0, bottom: 0, height: h, width: `${(frame / Math.max(1, durationInFrames - 1)) * 100}%`, background: color}} />
      {ticks.map((t) => (
        <div key={t} style={{position: 'absolute', bottom: 0, height: h + 8, width: 4, left: `${(t / Math.max(1, durationInFrames - 1)) * 100}%`, background: '#16120d', opacity: 0.55}} />
      ))}
    </>
  );
};

// Long videos: small "3 · THE DOWNFALL" tag top-left, so viewers who skip around know where they are.
const ChapterTag: React.FC<{label?: string; color: string}> = ({label, color}) =>
  label ? (
    <div style={{position: 'absolute', top: 36, left: 44, padding: '6px 18px', background: 'rgba(250,246,234,0.92)', borderLeft: `8px solid ${color}`, fontFamily: headlineFont, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: '#16120d', textTransform: 'uppercase'}}>{label}</div>
  ) : null;

export const Short: React.FC<ShortProps> = ({episodeId, storyboard, timing, thumb}) => {
  const {durationInFrames} = useVideoConfig();
  const frame = useCurrentFrame();
  if (!storyboard) return <AbsoluteFill style={{background: '#000'}} />;
  const tm = timing ?? estimateTiming(storyboard);
  const accent = storyboard.theme?.accent ?? '#E50914';
  const starts = storyboard.lines.map((l: Line, i) => (i === 0 ? 0 : Math.round((tm.lines[i]?.start ?? 0) * FPS)));
  // chapters (long videos): tick marks where each chapter starts + a tag for the chapter on screen now
  const chapters = storyboard.chapters ?? [];
  const chapterStarts = chapters.map((c) => starts[storyboard.lines.findIndex((l) => l.chapter === c.id)]).filter((f) => f !== undefined && f > 0);
  const cur = storyboard.lines[Math.max(0, starts.filter((st) => st <= frame).length - 1)];
  const ci = chapters.findIndex((c) => c.id === cur?.chapter);
  const chapterLabel = ci >= 0 && chapters[ci].kind !== 'open' && cur.scene.type !== 'chapter' ? `${chapters.filter((c, k) => k <= ci && c.kind !== 'open').length} · ${chapters[ci].title}` : undefined;
  return (
    <EpisodeCtx.Provider value={{id: episodeId, accent, theme: storyboard.theme ?? {}}}>
      <AbsoluteFill style={{background: '#000'}}>
        <GateWeave>
          <AbsoluteFill style={{filter: gradeFilter(storyboard.theme?.grade, storyboard.theme?.look)}}>
            {storyboard.lines.map((l, i) => {
              const from = starts[i];
              const to = i < starts.length - 1 ? starts[i + 1] : durationInFrames;
              const dur = Math.max(1, to - from);
              const theme = storyboard.theme ?? {};
              // Directed videos (theme.direction set): photo/AI-place scenes get a film finish, vox scenes stay flat paper
              const film = isFilm(l, storyboard.theme ?? {});
              return (
                <Sequence key={l.id} from={from} durationInFrames={dur} name={`Scene ${l.id} · ${l.scene.type}${film ? ' · film' : ''}`}>
                  <SceneCtx.Provider value={{backdrop: l.backdrop ?? theme.backdrop ?? 'paper'}}>
                    <BeatCamera beats={l.beats} dur={dur} enter={autoEnter(l, i, theme)}>
                      <AbsoluteFill style={film ? {filter: FILM_GRADE} : undefined}>{renderScene(l.scene, dur, autoMotion(theme.motion, i))}</AbsoluteFill>
                      {film && <FilmFinish />}
                      <FxLayer fx={l.fx} />
                    </BeatCamera>
                  </SceneCtx.Provider>
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
        {(storyboard.theme?.progressBar ?? storyboard.theme?.look === 'vox') && <ProgressBar color={accent} ticks={chapterStarts} />}
        {!thumb && <ChapterTag label={chapterLabel} color={accent} />}
        {!thumb && cur?.captions !== 'off' && <Captions words={tm.words} style={cur?.captions ?? storyboard.theme?.captionStyle} onDark={isFilm(cur, storyboard.theme ?? {})} />}
        {timing && storyboard.voice?.file && <Audio src={staticFile(`episodes/${episodeId}/${storyboard.voice.file}`)} />}
        {storyboard.music?.file && <Music file={storyboard.music.file} volume={storyboard.music.volume ?? 0.16} timing={tm} total={durationInFrames} />}
      </AbsoluteFill>
    </EpisodeCtx.Provider>
  );
};
