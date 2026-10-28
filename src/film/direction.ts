import type {Line, Motion, MotionStyle, Theme, Transition} from '../types';

// Automatic camera + entrance variety for a whole video, chosen by theme.motion (calm | punchy | cinematic).
// Only used when the storyboard sets theme.motion; a scene's own `motion` / line's own `enter` always win.
const MOTIONS: Record<MotionStyle, Motion[]> = {
  calm: ['drift', 'pull', 'drift', 'push'],
  punchy: ['push', 'pan-left', 'pull', 'pan-right'],
  cinematic: ['push', 'drift', 'push', 'pull'],
};
const ENTRANCES: Record<MotionStyle, Transition[]> = {
  calm: ['slide', 'rise', 'slide', 'wipe'],
  punchy: ['whip', 'zoom', 'slide', 'whip'],
  cinematic: ['zoom', 'rise', 'wipe', 'zoom'],
};

export const autoMotion = (style: MotionStyle | undefined, i: number): Motion | undefined => (style ? MOTIONS[style][i % 4] : undefined);

export const autoEnter = (l: Line, i: number, theme: Theme): Transition | undefined => {
  if (l.enter) return l.enter;
  if (!theme.motion) return undefined; // legacy: theme.transition for every scene
  if (i === 0) return 'cut'; // the hook is on screen from frame 0
  if (l.scene.type === 'chapter') return theme.motion === 'punchy' ? 'zoom' : 'wipe';
  return ENTRANCES[theme.motion][i % 4];
};

// Scenes drawn on the flat paper backdrop; everything else (photo / AI-place backgrounds) is a "film" scene in a directed vox video.
export const VOX_TYPES = new Set(['vox', 'typewriter', 'counter', 'line', 'chapter', 'timeline']);

// Is this scene drawn as a dark "film" scene (photo / AI-place background with grade + vignette)? Used for the finish and for caption colours.
export const isFilm = (l: Line | undefined, theme: Theme): boolean => {
  if (!l) return false;
  const look = l.look ?? (theme.direction && theme.look === 'vox' && !VOX_TYPES.has(l.scene.type) ? 'film' : 'vox');
  return look === 'film' && (theme.look === 'vox' || !!l.look);
};
