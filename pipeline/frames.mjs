// npm run frames -- <episodeId>
// Frame-by-frame visual check: renders key frames of every scene (entrance, each beat, middle, end)
// into public/episodes/<id>/frames/ — shown as a filmstrip in storyboard.html.
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';
import {loadEpisode, readJSON, writeJSON, ROOT, ok, info} from './lib.mjs';

const id = process.argv[2];
const {dir, sb} = loadEpisode(id);
const out = path.join(dir, 'frames');
fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(out, {recursive: true});

info('Bundling Remotion project…');
const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src/index.ts')});
const inputProps = {episodeId: id};
const browserExecutable = process.env.REMOTION_BROWSER || null;
const comp = await selectComposition({serveUrl, id: 'Short', inputProps, browserExecutable});
const fps = comp.fps;

// Same scene start logic as Short.tsx
const timing = readJSON(path.join(dir, 'timing.json'), null);
const est = () => {
  let t = 0.2;
  return sb.lines.map((l) => {
    const s = t;
    t += l.text.split(/\s+/).filter(Boolean).length * 0.38 + 0.35;
    return s;
  });
};
const starts = (timing ? timing.lines.map((l) => l.start) : est()).map((s, i) => (i === 0 ? 0 : Math.round(s * fps)));
const ends = starts.map((s, i) => (i < starts.length - 1 ? starts[i + 1] : comp.durationInFrames) - 1);

const list = [];
sb.lines.forEach((l, i) => {
  const s = starts[i];
  const e = ends[i];
  const add = (f, label) => f >= s && f <= e && list.push({frame: f, scene: l.id, label});
  add(s + 3, 'entrance');
  (l.beats ?? []).forEach((b) => {
    const at = b.at < 0 ? e + 1 - s + b.at : b.at;
    add(s + at + Math.round((b.len ?? 8) / 2), `${b.do} @${b.at}`);
  });
  add(Math.round((s + e) / 2), 'middle');
  add(e - 2, 'end');
});

for (const f of list) {
  const file = `f${String(f.frame).padStart(4, '0')}.jpg`;
  await renderStill({composition: comp, serveUrl, inputProps, frame: f.frame, output: path.join(out, file), imageFormat: 'jpeg', jpegQuality: 70, scale: 0.3, browserExecutable});
  f.file = `frames/${file}`;
  process.stdout.write('.');
}
writeJSON(path.join(out, 'frames.json'), {fps, starts, list});
console.log('');
ok(`${list.length} key frames → public/episodes/${id}/frames/ (open storyboard.html after npm run board)`);
