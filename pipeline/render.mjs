// npm run render -- <episodeId> [--draft]
// Renders the final MP4 + thumbnail + upload.txt into exports/<episodeId>/ (ready to upload by hand).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {loadEpisode, readJSON, ROOT, ok, info, die} from './lib.mjs';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const draft = args.includes('--draft');
const {dir, sb} = loadEpisode(id);
if (!draft && !fs.existsSync(path.join(dir, 'timing.json'))) die('No timing.json yet — run `npm run voice` (or `npm run timing`) first, or use --draft');

const out = path.join(ROOT, 'exports', id);
fs.mkdirSync(out, {recursive: true});
const props = JSON.stringify({episodeId: id});
const bin = path.join(ROOT, 'node_modules/.bin/remotion');
const video = path.join(out, draft ? 'draft.mp4' : 'short.mp4');

execFileSync(bin, ['render', 'src/index.ts', 'Short', video, `--props=${props}`, '--codec=h264', '--crf=18', ...(draft ? ['--scale=0.5'] : [])], {
  cwd: ROOT,
  stdio: 'inherit',
});

// Final cut: normalise loudness to YouTube's ≈ -14 LUFS (audio only, video stream copied untouched).
if (!draft) {
  const tmp = video.replace(/\.mp4$/, '.norm.mp4');
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', tmp]);
  if (r.status === 0) fs.renameSync(tmp, video);
  else info('Loudness normalisation skipped (ffmpeg loudnorm failed)');
}

// Thumbnail = first frame after the hook text has landed
const thumbFrame = sb.thumbnailFrame ?? 20;
execFileSync(bin, ['still', 'src/index.ts', 'Short', path.join(out, 'thumbnail.jpg'), `--props=${props}`, `--frame=${thumbFrame}`, '--image-format=jpeg'], {
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
const lines = Object.values(credits).map((c) => `• ${c.author} — ${c.license} (${c.provider}) ${c.page}`);
if (music) lines.push(`• Music: ${music.title ?? music.file} — ${music.author ?? ''} ${music.license ?? ''} ${music.url ?? ''}`.trim());
const up = sb.upload ?? {};
const ai = Object.values(credits).some((c) => c.aiGenerated);
if (ai) info('Contains AI-generated images → in YouTube Studio tick "Altered or synthetic content" if any look like real people/events.');
fs.writeFileSync(
  path.join(out, 'upload.txt'),
  `${ai ? 'NOTE: AI-generated images used — check the "Altered or synthetic content" box if they look realistic.\n\n' : ''}TITLE\n${up.title}\n\nDESCRIPTION\n${up.description}\n\n${(up.hashtags ?? []).join(' ')}\n\nCredits:\n${lines.join('\n')}\n\nSources:\n${(sb.facts ?? [])
    .flatMap((f) => (Array.isArray(f.source) ? f.source : [f.source]))
    .filter((v, i, a) => a.indexOf(v) === i)
    .join('\n')}\n`,
);
ok(`Ready to upload → exports/${id}/ (${path.basename(video)}, thumbnail.jpg, upload.txt)`);
if (!draft) execFileSync('node', [path.join(ROOT, 'pipeline/history.mjs'), 'done', id], {stdio: 'inherit'});
