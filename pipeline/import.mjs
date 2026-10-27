// npm run import -- <episodeId> <target> [--license "..."] [--page URL] [--author "..."] [--mood "..."] [--file name.ext] [--ai]
// Picks the NEWEST file you (or Claude in Chrome) just downloaded and puts it in the right place:
//   target = assets/s3-hq.jpg   → episode image (+ credits.json)
//   target = voice              → episode voice.mp3 (then run: npm run timing -- <id>)
//   target = music              → public/music/<name>.mp3 (+ library.json, + storyboard.music.file)
//   target = sfx:<name>         → public/sfx/<name>.mp3
// Looks in DOWNLOADS_DIR (default ~/Downloads) for files modified in the last 20 minutes.
// --file picks a specific file name in Downloads instead of the newest one.
// --upscale  2× Lanczos + light sharpen (free replacement for Magnific); also happens automatically when the image is smaller than 1200 px on its long side.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadEpisode, readJSON, writeJSON, ROOT, die, ok, info, slugify} from './lib.mjs';

const args = process.argv.slice(2);
const opt = (k) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const [id, target] = args;
if (!id || !target) die('Usage: npm run import -- <episodeId> <assets/xx.jpg | voice | music | sfx:name> [--license ..] [--page ..]');
const {dir, sb} = loadEpisode(id);

const dl = process.env.DOWNLOADS_DIR || path.join(os.homedir(), 'Downloads');
if (!fs.existsSync(dl)) die(`Downloads folder not found: ${dl} (set DOWNLOADS_DIR in .env)`);
const want = opt('file');
const files = fs
  .readdirSync(dl)
  .filter((f) => !f.startsWith('.') && !/\.(crdownload|part|tmp)$/i.test(f))
  .map((f) => ({f, p: path.join(dl, f), t: fs.statSync(path.join(dl, f)).mtimeMs}))
  .filter((x) => fs.statSync(x.p).isFile())
  .filter((x) => (want ? x.f === want : Date.now() - x.t < 20 * 60 * 1000))
  .sort((a, b) => b.t - a.t);
if (!files.length) die(want ? `${want} not found in ${dl}` : `No file downloaded in the last 20 min in ${dl} (still downloading?)`);
const src = files[0];
const ext = path.extname(src.f).toLowerCase();
info(`Using ${src.f}`);

const toMp3 = (from, to) => {
  if (ext === '.mp3') return fs.copyFileSync(from, to);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', from, '-b:a', '192k', to]);
};

if (target === 'voice') {
  toMp3(src.p, path.join(dir, 'voice.mp3'));
  sb.voice = {...(sb.voice ?? {}), file: 'voice.mp3', source: 'elevenlabs-web'};
  writeJSON(path.join(dir, 'storyboard.json'), sb);
  ok('voice.mp3 imported → now run: npm run timing -- ' + id);
} else if (target === 'music') {
  const name = `${slugify(opt('title') ?? path.basename(src.f, ext))}.mp3`;
  toMp3(src.p, path.join(ROOT, 'public/music', name));
  const libPath = path.join(ROOT, 'public/music/library.json');
  const lib = readJSON(libPath, []).filter((m) => m.file !== name);
  lib.push({file: name, title: opt('title') ?? path.basename(src.f, ext), author: opt('author') ?? '', mood: opt('mood') ?? '', license: opt('license') ?? 'CHECK', url: opt('page') ?? ''});
  writeJSON(libPath, lib);
  sb.music = {...(sb.music ?? {}), file: name};
  writeJSON(path.join(dir, 'storyboard.json'), sb);
  ok(`music → public/music/${name} (set in storyboard + library.json)`);
} else if (target.startsWith('sfx:')) {
  const name = `${slugify(target.slice(4))}.mp3`;
  toMp3(src.p, path.join(ROOT, 'public/sfx', name));
  const libPath = path.join(ROOT, 'public/sfx/library.json');
  const lib = readJSON(libPath, []).filter((m) => m.file !== name);
  lib.push({file: name, license: opt('license') ?? 'CHECK', url: opt('page') ?? '', author: opt('author') ?? ''});
  writeJSON(libPath, lib);
  ok(`sfx → public/sfx/${name}`);
} else {
  // image asset
  const dest = path.join(dir, target);
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  const entry = (sb.assets ?? []).find((a) => a.file === target);
  if (entry?.cutout) {
    const raw = dest.replace(/\.\w+$/, `.src${ext}`);
    fs.copyFileSync(src.p, raw);
    try {
      execFileSync('rembg', ['i', raw, dest], {stdio: 'ignore'});
    } catch {
      fs.copyFileSync(raw, dest);
      info('rembg not installed — kept as photo');
    }
  } else if (ext !== path.extname(dest).toLowerCase() && !(ext === '.jpeg' && /\.jpg$/i.test(dest))) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src.p, dest]);
  } else fs.copyFileSync(src.p, dest);
  // free upscale (keeps PNG transparency)
  try {
    const dim = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', dest]).toString().trim().split(',').map(Number);
    if (args.includes('--upscale') || Math.max(...dim) < 1200) {
      const tmp = dest.replace(/(\.\w+)$/, '.up$1');
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', dest, '-vf', 'scale=iw*2:ih*2:flags=lanczos,unsharp=5:5:0.7:5:5:0.0', tmp]);
      fs.renameSync(tmp, dest);
      info(`upscaled ${dim.join('×')} → ${dim[0] * 2}×${dim[1] * 2}`);
    }
  } catch {}
  const credits = readJSON(path.join(dir, 'credits.json'), {});
  const ai = args.includes('--ai');
  credits[target] = {
    provider: opt('provider') ?? (ai ? 'chatgpt-web' : 'manual'),
    author: opt('author') ?? (ai ? 'AI-generated' : 'unknown'),
    license: opt('license') ?? (ai ? 'AI-generated (ChatGPT) — owned by user per OpenAI terms' : 'CHECK'),
    page: opt('page') ?? '',
    url: '',
    aiGenerated: ai || undefined,
    importedFrom: src.f,
  };
  writeJSON(path.join(dir, 'credits.json'), credits);
  if (credits[target].license === 'CHECK') info('⚠ add --license and --page so the credit is correct');
  ok(`${target} imported`);
}
