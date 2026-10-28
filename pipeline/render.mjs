// npm run render -- <episodeId> [--draft] [--concurrency N]
// Renders the final MP4 + thumbnail + upload.txt into exports/<episodeId>/ (ready to upload by hand).
// Long videos (format "long", composition "Long" 1920x1080) render chapter by chapter into exports/<id>/parts/:
//   npm run render -- <id>               renders every chapter part that is missing (re-run = resume), then joins → long.mp4
//   npm run render -- <id> --chapter 3   renders only chapter 3 (1 = first chapter in storyboard.chapters)
// ~0.8 s per frame on an 8-core laptop → a 10 min video ≈ 4 h: start it in the evening, re-run if it was interrupted.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync, spawnSync} from 'node:child_process';
import {loadEpisode, readJSON, ROOT, ok, info, die} from './lib.mjs';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const draft = args.includes('--draft');
const optArg = (k) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const concurrency = optArg('concurrency') ?? String(Math.max(1, os.cpus().length - 1)); // measured: 7 of 8 cores ≈ 40% faster than Remotion's default
const {dir, sb} = loadEpisode(id);
if (!draft && !fs.existsSync(path.join(dir, 'timing.json'))) die('No timing.json yet — run `npm run voice` (or `npm run timing`) first, or use --draft');

const out = path.join(ROOT, 'exports', id);
fs.mkdirSync(out, {recursive: true});
const props = JSON.stringify({episodeId: id});
// Run the CLI's JS entry with node directly: node_modules/.bin/remotion is a shell script that Windows can't spawn.
const cli = path.join(ROOT, 'node_modules/@remotion/cli/remotion-cli.js');
const long = sb.format === 'long';
const comp = long ? 'Long' : 'Short';
const video = path.join(out, draft ? 'draft.mp4' : long ? 'long.mp4' : 'short.mp4');
const remotion = (a) => execFileSync(process.execPath, [cli, ...a, `--concurrency=${concurrency}`], {cwd: ROOT, stdio: 'inherit'});

if (!long) {
  remotion(['render', 'src/index.ts', comp, video, `--props=${props}`, '--codec=h264', '--crf=18', ...(draft ? ['--scale=0.5'] : [])]);
} else {
  // frame ranges per chapter — same start logic as Short.tsx (timing.json, else the estimate)
  const FPS = 30;
  const tm = readJSON(path.join(dir, 'timing.json'), null);
  const est = () => {
    let t = 0.2;
    return sb.lines.map((l) => {
      const st = t;
      t += l.text.split(/\s+/).filter(Boolean).length * 0.5 + 0.6;
      return {start: st, end: t};
    });
  };
  const lt = tm ? tm.lines : est();
  const total = Math.ceil(((tm ? tm.duration : lt[lt.length - 1].end) + 0.8) * FPS);
  const chapters = sb.chapters ?? [];
  const firstLine = chapters.map((c) => sb.lines.findIndex((l) => l.chapter === c.id));
  const ranges = chapters.map((c, k) => {
    const from = k === 0 ? 0 : Math.round(lt[firstLine[k]].start * FPS);
    const to = k < chapters.length - 1 ? Math.round(lt[firstLine[k + 1]].start * FPS) - 1 : total - 1;
    return {c, k, from, to};
  });
  const partsDir = path.join(out, draft ? 'parts-draft' : 'parts');
  fs.mkdirSync(partsDir, {recursive: true});
  const only = optArg('chapter');
  for (const r of ranges) {
    if (only && Number(only) !== r.k + 1) continue;
    const f = path.join(partsDir, `chapter-${r.k + 1}.mp4`);
    if (fs.existsSync(f) && !only) {
      info(`chapter ${r.k + 1} (${r.c.title}) already rendered — skipping`);
      continue;
    }
    info(`chapter ${r.k + 1}/${ranges.length} "${r.c.title}": frames ${r.from}–${r.to} (${((r.to - r.from + 1) / FPS / 60).toFixed(1)} min)`);
    const tmp = f.replace(/\.mp4$/, '.tmp.mp4');
    remotion(['render', 'src/index.ts', comp, tmp, `--props=${props}`, '--codec=h264', '--crf=18', `--frames=${r.from}-${r.to}`, '--muted', ...(draft ? ['--scale=0.5'] : [])]);
    fs.renameSync(tmp, f); // only complete chapters get their final name → safe to resume
  }
  if (only) {
    ok(`chapter ${only} rendered → ${path.relative(ROOT, partsDir)}`);
    process.exit(0);
  }
  // one continuous audio track (voice + looping music) — audio-only render is fast, and avoids clicks at the joins
  const audio = path.join(partsDir, 'audio.aac');
  remotion(['render', 'src/index.ts', comp, audio, `--props=${props}`, '--codec=aac']);
  const list = path.join(partsDir, 'list.txt');
  fs.writeFileSync(list, ranges.map((r) => `file 'chapter-${r.k + 1}.mp4'`).join('\n') + '\n');
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', video]);
  // YouTube chapters (description timestamps): first must be 0:00, each ≥ 10 s
  const stamp = (fr) => {
    const t = Math.floor(fr / FPS);
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  };
  sb.upload = {...(sb.upload ?? {}), chapters: ranges.map((r) => `${stamp(r.from)} ${r.c.title}`).join('\n')};
  fs.writeFileSync(path.join(dir, 'storyboard.json'), JSON.stringify(sb, null, 2) + '\n');
}

// Final cut: normalise loudness to YouTube's ≈ -14 LUFS (audio only, video stream copied untouched).
if (!draft) {
  const tmp = video.replace(/\.mp4$/, '.norm.mp4');
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', tmp]);
  if (r.status === 0) fs.renameSync(tmp, video);
  else info('Loudness normalisation skipped (ffmpeg loudnorm failed)');
}

// Thumbnail = first frame after the hook text has landed
const thumbFrame = sb.thumbnailFrame ?? 30; // entrance finished, headline settled
execFileSync(process.execPath, [cli, 'still', 'src/index.ts', comp, path.join(out, 'thumbnail.jpg'), `--props=${JSON.stringify({episodeId: id, thumb: true})}`, `--frame=${thumbFrame}`, '--image-format=jpeg'], {
  cwd: ROOT,
  stdio: 'ignore',
});

// Loudness check (YouTube normalises to about -14 LUFS)
{
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', video, '-af', 'ebur128', '-f', 'null', '-'], {encoding: 'utf8'});
  const lufs = [...(r.stderr ?? '').matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop()?.[1];
  if (lufs) info(`Loudness: ${lufs} LUFS (YouTube target ≈ -14; if below -18, raise voice volume)`);
  else info('Loudness check skipped (no audio yet, or ffmpeg missing)');
}

// upload.txt with credits for every asset + music
const credits = readJSON(path.join(dir, 'credits.json'), {});
const music = readJSON(path.join(ROOT, 'public/music/library.json'), []).find((m) => m.file === sb.music?.file);
const lines = Object.entries(credits).map(([file, c]) => `• ${c.author} — ${c.license} (${c.provider}) ${c.page}${/logo/i.test(file) ? ' — trademark of its owner, shown for identification only' : ''}`);
if (music) lines.push(`• Music: ${music.title ?? music.file} — ${music.author ?? ''} ${music.license ?? ''} ${music.url ?? ''}`.trim());
const up = sb.upload ?? {};
const ai = Object.values(credits).some((c) => c.aiGenerated);
if (ai) info('Contains AI-generated images → in YouTube Studio tick "Altered or synthetic content" if any look like real people/events.');
fs.writeFileSync(
  path.join(out, 'upload.txt'),
  `${ai ? 'NOTE: AI-generated images used — check the "Altered or synthetic content" box if they look realistic.\n\n' : ''}TITLE\n${up.title}\n\nDESCRIPTION\n${up.description}\n\n${up.chapters ? `CHAPTERS\n${up.chapters}\n\n` : ''}${(up.hashtags ?? []).join(' ')}\n\nCredits:\n${lines.join('\n')}\n\nSources:\n${(sb.facts ?? [])
    .flatMap((f) => (Array.isArray(f.source) ? f.source : [f.source]))
    .filter((v, i, a) => a.indexOf(v) === i)
    .join('\n')}\n`,
);
ok(`Ready to upload → exports/${id}/ (${path.basename(video)}, thumbnail.jpg, upload.txt)`);
if (!draft) execFileSync('node', [path.join(ROOT, 'pipeline/history.mjs'), 'done', id], {stdio: 'inherit'});
