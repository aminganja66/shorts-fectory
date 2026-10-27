// npm run check -- <episodeId>
// Quality gate before voice/render: structure, length, sources, licenses, missing files.
import fs from 'node:fs';
import path from 'node:path';
import {loadEpisode, readJSON, ROOT, ok} from './lib.mjs';
import {varietyCheck} from './variety.mjs';

const id = process.argv[2];
const {dir, sb} = loadEpisode(id);
const credits = readJSON(path.join(dir, 'credits.json'), {});
const problems = [];
const warn = [];

if (!sb.title) problems.push('title is empty');
if (!sb.lines?.length) problems.push('no lines');
if (sb.lines?.length < 5 || sb.lines?.length > 9) warn.push(`${sb.lines?.length} lines (aim for 6–8)`);
const words = sb.lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
// real Hindi narration at natural speed ≈ 0.5 s/word + ~0.8 s between lines (measured on the first Nokia Short: 119 words = 56 s even at 1.2× speed)
const est = words * 0.5 + sb.lines.length * 0.8;
if (est > 48) problems.push(`estimated length ${est.toFixed(0)}s — over 45s. Cut words (max ~75) instead of speeding the voice up.`);
else if (est < 24) warn.push(`estimated length ${est.toFixed(0)}s (aim 30–42s)`);
if ((sb.facts ?? []).length < 3) problems.push('fewer than 3 facts with sources');
(sb.facts ?? []).forEach((f, i) => !f.source && problems.push(`fact ${i + 1} has no source`));
const first = sb.lines[0]?.text.split(/\s+/).length ?? 0;
if (first > 12) problems.push(`hook line is ${first} words — max 12 so it lands in ~3s`);
if ((sb.hookCandidates ?? []).length < 3) problems.push('hookCandidates: write 3 different hooks in storyboard.json and pick the best one as line 1 (see scriptwriter agent)');

// Anything the narrator must pronounce differently from how it is written needs a `voice` line (spoken form).
// Digits, %, symbols and abbreviations like Q3 / CEO / 5.44B must be spelled the way an Indian says them in Hinglish.
sb.lines.forEach((l, i) => {
  const raw = l.text;
  const risky = /\d|%|\$|€|₹|&|\bQ[1-4]\b/.test(raw);
  if (risky && !l.voice) problems.push(`line ${i + 1} has digits/symbols but no \`voice\` (spoken form), e.g. "2011" → "twenty eleven", "Q3" → "क्यू थ्री", "49.4%" → "forty nine point four percent"`);
});

const used = new Set();
sb.lines.forEach((l) => {
  const s = l.scene;
  [s.bg, s.mid, s.fg, s.fg2, s.logo, s.left?.image, s.right?.image, ...(s.images ?? [])].filter(Boolean).forEach((f) => used.add(f));
  if (l.sfx && !fs.existsSync(path.join(ROOT, 'public/sfx', l.sfx))) problems.push(`sfx missing: public/sfx/${l.sfx}`);
});
used.forEach((f) => {
  if (f.startsWith('/')) return;
  if (!fs.existsSync(path.join(dir, f))) problems.push(`image missing: ${f}`);
  else if (!credits[f] && !(sb.assets ?? []).find((a) => a.file === f && a.manual)) problems.push(`no license record for ${f}`);
});
if (sb.music?.file && !fs.existsSync(path.join(ROOT, 'public/music', sb.music.file))) problems.push(`music missing: public/music/${sb.music.file}`);
const types = sb.lines.map((l) => l.scene.type);
for (let i = 2; i < types.length; i++) if (types[i] === types[i - 1] && types[i] === types[i - 2]) warn.push(`3 "${types[i]}" scenes in a row — vary them`);

const v = varietyCheck(sb);
problems.push(...v.problems);
warn.push(...v.warn);
if (v.recent.length) console.log('Recent Shorts (look/captions/transition/hook · scenes):\n  ' + v.recent.join('\n  '));
warn.forEach((w) => console.log(`⚠ ${w}`));
if (problems.length) {
  problems.forEach((p) => console.log(`✖ ${p}`));
  process.exit(4);
}
ok(`Checks passed (${words} words, ~${est.toFixed(0)}s)`);
