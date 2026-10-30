// Sound effects come from the local library (library/ + index/index.json) — nothing is generated or bought.
//   npm run sfx -- search "<words>" [--cat whoosh] [--max 3] [--limit 8]   → ranked matches (id, length, tags)
//   npm run sfx -- use <episodeId> <libraryId> [--as name] [--line N] [--at sec]
//        copies it to public/sfx/<name>.mp3 (so renders and the other laptop work), logs it in
//        public/sfx/library.json and, with --line N (1-based), sets lines[N-1].sfx (+ sfxAt).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, loadEpisode, readJSON, writeJSON, die, ok} from './lib.mjs';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (k) => {
  const i = args.indexOf(`--${k}`);
  return i > -1 ? args[i + 1] : undefined;
};
const index = readJSON(path.join(ROOT, 'index/index.json'));

if (cmd === 'search') {
  const words = (args[1] ?? '').toLowerCase().split(/\W+/).filter(Boolean);
  if (!words.length) die('Usage: npm run sfx -- search "<words>" [--cat x] [--max sec] [--limit n]');
  const cat = opt('cat');
  const max = Number(opt('max') ?? 6);
  const limit = Number(opt('limit') ?? 8);
  const hits = index
    .filter((x) => (!cat || x.category === cat || x.subcategory === cat) && x.duration_sec && x.duration_sec <= max)
    .map((x) => {
      const hay = `${x.category} ${x.subcategory} ${x.tags.join(' ')} ${x.original_name}`.toLowerCase();
      return {x, s: words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0)};
    })
    .filter((h) => h.s > 0)
    .sort((a, b) => b.s - a.s || a.x.duration_sec - b.x.duration_sec)
    .slice(0, limit);
  if (!hits.length) die('No match — try other words or --cat (whoosh, impact, ui, foley, cinematic, risers, ambience…)');
  for (const {x} of hits) console.log(`${x.id.padEnd(26)} ${String(x.duration_sec).padStart(5)}s  ${x.intensity.padEnd(6)} ${x.original_name} [${x.tags.join(',')}]`);
} else if (cmd === 'use') {
  const {dir, sb} = loadEpisode(args[1]);
  const item = index.find((x) => x.id === args[2]);
  if (!item) die(`Not in index/index.json: ${args[2]} (use "npm run sfx -- search ...")`);
  const src = path.join(ROOT, item.path);
  if (!fs.existsSync(src)) die(`File missing: ${item.path} — is the library/ folder on this laptop?`);
  const name = `${(opt('as') ?? item.id).replace(/[^\w-]+/g, '-')}.mp3`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-codec:a', 'libmp3lame', '-q:a', '3', path.join(ROOT, 'public/sfx', name)]);
  const libPath = path.join(ROOT, 'public/sfx/library.json');
  const lib = readJSON(libPath, []).filter((m) => m.file !== name);
  lib.push({file: name, license: item.license_note, url: '', author: item.source, libraryId: item.id});
  writeJSON(libPath, lib);
  const line = opt('line');
  if (line) {
    const l = sb.lines[Number(line) - 1];
    if (!l) die(`No line ${line} in ${sb.id}`);
    l.sfx = name;
    if (opt('at')) l.sfxAt = Number(opt('at'));
    writeJSON(path.join(dir, 'storyboard.json'), sb);
  }
  ok(`sfx ${item.id} → public/sfx/${name}${line ? ` (line ${line})` : ''}`);
} else {
  die('Usage: npm run sfx -- search "<words>" | use <episodeId> <libraryId> [--as name] [--line N] [--at sec]');
}
