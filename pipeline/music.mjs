// Music is NOT generated any more — beds come from public/music/library.json (tracks we already own).
//   npm run music -- <episodeId> [mood words]   → picks the best-fitting track not used in the last 5 Shorts
//        and sets storyboard.music.file (add --file <name.mp3> to force one, --list to just print the ranking).
// New tracks: drop them in via `npm run import -- <id> music --title .. --mood .. --license ..`.
// Sound effects: `npm run sfx` (library/ + index/). Only the voice-over still uses ElevenLabs.
import fs from 'node:fs';
import path from 'node:path';
import {loadEpisode, readJSON, writeJSON, ROOT, die, ok} from './lib.mjs';
import {previous} from './variety.mjs';

const args = process.argv.slice(2);
const {dir, sb} = loadEpisode(args[0]);
const flag = (k) => args.indexOf(`--${k}`);
const forced = flag('file') > -1 ? args[flag('file') + 1] : null;
const words = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !all[i - 1]?.startsWith('--file')).join(' ').toLowerCase().split(/\W+/).filter(Boolean);

const lib = readJSON(path.join(ROOT, 'public/music/library.json'), []).filter((m) => fs.existsSync(path.join(ROOT, 'public/music', m.file)));
if (!lib.length) die('public/music/library.json has no usable tracks — import one with `npm run import -- <id> music ...`');
const recent = new Set(previous(sb, 5).map((p) => p.music).filter(Boolean));
const rank = lib
  .map((m) => ({m, used: recent.has(m.file), s: words.reduce((n, w) => n + (`${m.title} ${m.mood}`.toLowerCase().includes(w) ? 1 : 0), 0)}))
  .sort((a, b) => a.used - b.used || b.s - a.s);

if (flag('list') > -1) {
  for (const r of rank) console.log(`${r.used ? '✖ used ' : '✔ free '} ${r.s}  ${r.m.file.padEnd(28)} ${r.m.mood}`);
  process.exit(0);
}
const pick = forced ? rank.find((r) => r.m.file === forced) : rank[0];
if (!pick) die(`Track not found: ${forced}`);
if (pick.used) console.log(`⚠ every fitting track was used in the last 5 Shorts — "${pick.m.file}" repeats; import a new one if you can.`);
sb.music = {...(sb.music ?? {}), file: pick.m.file};
writeJSON(path.join(dir, 'storyboard.json'), sb);
ok(`Music → ${pick.m.file} (${pick.m.mood}) set in storyboard`);
