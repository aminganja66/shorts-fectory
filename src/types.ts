// Single source of truth for one Short. Lives at public/episodes/<id>/storyboard.json
export type Motion = 'push' | 'pull' | 'pan-left' | 'pan-right' | 'drift';

export type CollageScene = {
  type: 'collage';
  bg: string; // background image (relative to episode folder)
  mid?: string; // middle layer (building, product, place)
  fg?: string; // foreground: person/object. PNG cut-out or photo (shown as a card)
  fgStyle?: 'cutout' | 'card';
  fg2?: string; // optional second cut-out (e.g. two founders facing each other)
  logo?: string; // brand logo (PNG/SVG render) popping in
  logoPos?: 'top' | 'center' | 'bottom';
  headline?: string; // optional big text
  motion?: Motion;
  goldFrame?: boolean; // frame "welded" to the photo that detaches on push-in
};
export type KineticScene = {
  type: 'kinetic';
  bg?: string;
  text: string; // big words, use | to force a line break
  highlight?: string[]; // words to colour with accent
};
export type ChartScene = {
  type: 'chart';
  bg?: string;
  title: string;
  unit?: string; // e.g. "$B" or "करोड़"
  bars: {label: string; value: number; color?: string}[];
};
export type VersusScene = {
  type: 'versus';
  left: {image: string; label: string};
  right: {image: string; label: string};
  winner?: 'left' | 'right';
};
export type StackScene = {
  type: 'stack';
  bg?: string;
  images: string[]; // 2-4 photos that drop in like polaroids
  caption?: string;
};
export type EndScene = {
  type: 'end';
  bg?: string;
  text: string;
  sub?: string;
};

export type Scene = CollageScene | KineticScene | ChartScene | VersusScene | StackScene | EndScene;

// Frame-exact moments inside a scene (frame 0 = scene start)
export type Beat = {
  at: number; // frame inside the scene; negative = counted from the scene end (-12 = last 12 frames)
  do: 'zoom-through' | 'punch' | 'shake' | 'flash' | 'whip-out' | 'blur-in' | 'zoom-in' | 'glitch-in';
  len?: number; // frames (default depends on effect)
};
export type Fx = 'smoke' | 'dust' | 'lightleak' | 'embers' | 'glitch';

export type Line = {
  id: number;
  text: string; // narration (what the voice says, shown as captions)
  voice?: string; // optional pronunciation version for ElevenLabs
  scene: Scene;
  sfx?: string; // file in public/sfx, played at scene start
  fx?: Fx[]; // atmosphere layers
  beats?: Beat[]; // frame-wise camera moments
  // Scene script (documentation shown in the plan file)
  visual?: string; // what the viewer sees
  onScreen?: string; // on-screen text
  motionNotes?: string; // how the motion graphics play, frame by frame
};

export type Storyboard = {
  id: string;
  channel: 'brand' | 'psych';
  language: string;
  title: string;
  theme?: Theme;
  hookType?: HookType;
  lines: Line[];
  music?: {file: string; volume?: number}; // file relative to public/music
  voice?: {file: string}; // relative to episode folder
};

// ---- Variety system: every episode gets its own combination (checked by `npm run check`) ----
export type Look = 'archive' | 'noir' | 'neon' | 'paper' | 'gold' | 'clean';
export type CaptionStyle = 'highlight' | 'outline' | 'pop' | 'boxed' | 'karaoke';
export type Transition = 'whip' | 'flash' | 'zoom' | 'glitch' | 'cut';
export type HookType = 'date-drop' | 'shock-number' | 'question' | 'contradiction' | 'quote' | 'what-if' | 'myth-bust' | 'cold-open';
export type Theme = {
  accent?: string;
  grade?: 'warm' | 'cold' | 'mono';
  look?: Look;
  captionStyle?: CaptionStyle;
  transition?: Transition;
};

export type Word = {text: string; start: number; end: number};
export type Timing = {words: Word[]; lines: {id: number; start: number; end: number}[]; duration: number};

export type ShortProps = {
  episodeId: string;
  storyboard?: Storyboard;
  timing?: Timing;
};
