// npm run timing -- <episodeId> [voice-file] [--whisper]
// Word + line timings for captions and scene cuts WITHOUT Whisper (which loops/hallucinates on Hindi voices).
//   1. ffmpeg silencedetect finds the real pauses in voice.mp3
//   2. the N lines are matched to groups of speech segments (length of speech ≈ length of the line's text)
//   3. words are placed inside their line by spoken length, only on speech time (never across a pause)
// Needs a clear pause (>= ~0.4 s) between lines — make the voice with a <break>/blank line between lines (CLAUDE.md → Voice).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {loadEpisode, writeJSON, die, ok, info} from './lib.mjs';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const fileArg = args.filter((a) => !a.startsWith('--'))[1];
if (args.includes('--whisper')) {
  await import('./transcribe.mjs');
  process.exit(0);
}
const {dir, sb} = loadEpisode(id);
const input = path.join(dir, fileArg ?? sb.voice?.file ?? 'voice.mp3');
if (!fs.existsSync(input)) die(`Voice file not found: ${input}`);
if (path.extname(input) !== '.mp3') {
  execFileSync('ffmpeg', ['-y', '-i', input, '-b:a', '192k', path.join(dir, 'voice.mp3')], {stdio: 'ignore'});
  info('Converted recording to voice.mp3');
}

const total = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input]).toString());

// ---- 1. speech segments from silence detection
const detect = (noise, minSil) => {
  const r = spawnSync('ffmpeg', ['-i', input, '-af', `silencedetect=noise=${noise}:d=${minSil}`, '-f', 'null', '-'], {encoding: 'utf8'});
  const sil = [];
  let s = null;
  for (const m of r.stderr.matchAll(/silence_(start|end): ([\d.]+)/g)) {
    if (m[1] === 'start') s = parseFloat(m[2]);
    else if (s !== null) sil.push([s, parseFloat(m[2])]), (s = null);
  }
  if (s !== null) sil.push([s, total]);
  const seg = [];
  let t = 0;
  for (const [a, b] of sil) {
    if (a - t > 0.08) seg.push([t, a]);
    t = b;
  }
  if (total - t > 0.08) seg.push([t, total]);
  return seg;
};

const lines = sb.lines;
const N = lines.length;
// try a few thresholds: need at least N segments so every line can start after a pause
let seg = [];
for (const [noise, d] of [['-32dB', 0.3], ['-35dB', 0.22], ['-38dB', 0.16], ['-40dB', 0.12]]) {
  seg = detect(noise, d);
  if (seg.length >= N) break;
}

const spokenText = (l) => (l.voice ?? l.text).replace(/<[^>]+>/g, ' ');
// (wordWeight is defined below; function hoisting is not available for const, so define it here)
const wordWeight = (w) => {
  const digits = /\d/.test(w);
  let x = digits ? w.length * 2.6 + 3 : w.length + 0.8; // numbers are spoken long ("forty nine point four")
  if (/[.!?।]$/.test(w)) x += 1.5;
  else if (/[,:;]$/.test(w)) x += 0.8;
  return x;
};
const lineW = lines.map((l) => spokenText(l).split(/\s+/).filter(Boolean).reduce((a, w) => a + wordWeight(w), 0));
const sumW = lineW.reduce((a, b) => a + b, 0);

// ---- 2. match lines to groups of consecutive segments (DP)
let groups; // groups[i] = [segFrom, segToExclusive]
// If the voice was made with long breaks between lines, the N-1 biggest gaps ARE the line boundaries.
const gaps = seg.slice(1).map((s2, k) => ({k: k + 1, g: s2[0] - seg[k][1]})).sort((a, b) => b.g - a.g);
if (seg.length >= N && N > 1 && gaps[N - 2].g >= 0.9 && (gaps[N - 1]?.g ?? 0) < gaps[N - 2].g * 0.75) {
  const cuts = gaps.slice(0, N - 1).map((x) => x.k).sort((a, b) => a - b);
  groups = [];
  let prev = 0;
  [...cuts, seg.length].forEach((c) => (groups.push([prev, c]), (prev = c)));
  info('Clear pauses between lines — used them as line boundaries.');
} else if (seg.length >= N) {
  const M = seg.length;
  const dur = seg.map(([a, b]) => b - a);
  const speech = dur.reduce((a, b) => a + b, 0);
  const pre = [0];
  dur.forEach((d, i) => pre.push(pre[i] + d));
  const gapBefore = (j) => (j === 0 ? 0 : seg[j][0] - seg[j - 1][1]);
  const INF = 1e9;
  const best = Array.from({length: N + 1}, () => Array(M + 1).fill(INF));
  const from = Array.from({length: N + 1}, () => Array(M + 1).fill(-1));
  best[0][0] = 0;
  for (let i = 1; i <= N; i++) {
    for (let j = i; j <= M; j++) {
      for (let k = i - 1; k < j; k++) {
        if (best[i - 1][k] >= INF) continue;
        const share = (pre[j] - pre[k]) / speech;
        const want = lineW[i - 1] / sumW;
        // length mismatch is costly; starting a line after a long pause is rewarded
        const cost = best[i - 1][k] + ((share - want) ** 2) * 100 - (i > 1 ? 0.6 * Math.min(gapBefore(k), 1.5) : 0);
        if (cost < best[i][j]) {
          best[i][j] = cost;
          from[i][j] = k;
        }
      }
    }
  }
  groups = [];
  let j = M;
  for (let i = N; i >= 1; i--) {
    const k = from[i][j];
    groups.unshift([k, j]);
    j = k;
  }
} else {
  info(`Only ${seg.length} speech segments for ${N} lines — pauses between lines are too short. Cutting by text length instead (less precise).`);
  groups = null;
}

// time on the concatenated "speech only" axis → absolute time
const axisFor = (segs) => {
  const lens = segs.map(([a, b]) => b - a);
  const G = lens.reduce((a, b) => a + b, 0);
  return {
    G,
    at(u, preferEnd = false) {
      let acc = 0;
      for (let i = 0; i < segs.length; i++) {
        if (u < acc + lens[i] - 1e-9 || (preferEnd && u <= acc + lens[i] + 1e-9) || i === segs.length - 1) return segs[i][0] + Math.min(Math.max(u - acc, 0), lens[i]);
        acc += lens[i];
      }
      return segs[0][0];
    },
  };
};


const words = [];
const lineOut = [];
const warnings = [];
const allSegs = seg;
let cum = 0; // for the fallback mode
lines.forEach((l, i) => {
  let segs;
  if (groups) segs = seg.slice(groups[i][0], groups[i][1]);
  else {
    // fallback: slice the whole speech axis by cumulative text weight
    const ax = axisFor(allSegs);
    const u0 = (cum / sumW) * ax.G;
    const u1 = ((cum + lineW[i]) / sumW) * ax.G;
    cum += lineW[i];
    segs = [[ax.at(u0), ax.at(u1, true)]];
  }
  const ax = axisFor(segs);
  const shown = l.text.split(/\s+/).filter(Boolean);
  const ww = shown.map(wordWeight);
  const sw = ww.reduce((a, b) => a + b, 0);
  let c = 0;
  shown.forEach((w, k) => {
    const start = ax.at((c / sw) * ax.G);
    c += ww[k];
    const end = ax.at((c / sw) * ax.G, true);
    words.push({text: w, start: +start.toFixed(3), end: +Math.max(end, start + 0.12).toFixed(3)});
  });
  const ls = segs[0][0];
  const le = segs[segs.length - 1][1];
  lineOut.push({id: l.id, start: +ls.toFixed(3), end: +le.toFixed(3)});
  if (groups) {
    const gotShare = ax.G / allSegs.reduce((a, [x, y]) => a + (y - x), 0);
    const wantShare = lineW[i] / sumW;
    if (Math.abs(gotShare - wantShare) / wantShare > 0.4) warnings.push(`line ${i + 1}: speech length ${(ax.G).toFixed(1)}s vs expected ~${(wantShare * allSegs.reduce((a, [x, y]) => a + (y - x), 0)).toFixed(1)}s — check this line by ear`);
  }
});
const duration = lineOut[lineOut.length - 1].end;
writeJSON(path.join(dir, 'timing.json'), {words, lines: lineOut, duration: +duration.toFixed(3)});
ok(`timing.json (${words.length} words, ${duration.toFixed(1)}s, ${seg.length} speech segments → ${N} lines)`);
lineOut.forEach((l, i) => console.log(`  line ${i + 1}: ${l.start.toFixed(2)}–${l.end.toFixed(2)}s  ${lines[i].text.slice(0, 40)}`));
warnings.forEach((w) => console.log(`⚠ ${w}`));
if (duration > 58) console.log('⚠ Over 58s — shorten the script for Shorts.');
