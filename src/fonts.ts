import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fonts ship inside the repo (public/fonts) → identical look on both laptops, works offline.
// Teko = condensed documentary headlines, Mukta = clean captions. Both cover Hindi + English.
const DEVA = 'U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF';
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2190-2199, U+2212';

export const headlineFont = 'TekoLocal';
export const captionFont = 'MuktaLocal';

const load = (family: string, file: string, weight: string, unicodeRange: string) =>
  loadFont({family, url: staticFile(`fonts/${file}`), weight, unicodeRange});

load(headlineFont, 'teko-devanagari-700-normal.woff2', '700', DEVA);
load(headlineFont, 'teko-latin-700-normal.woff2', '700', LATIN);
load(captionFont, 'mukta-devanagari-800-normal.woff2', '800', DEVA);
load(captionFont, 'mukta-latin-800-normal.woff2', '800', LATIN);
