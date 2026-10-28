// npm run direct -- <episodeId> [--preset <name>] [--dry] [--keep-accent]
// Art direction per topic: picks a preset (backdrop, caption style, entrance, camera style, accent) from the story's own words,
// avoids repeating the previous videos' combination, and sets per-chapter / per-line overrides. Never overwrites fields you set by hand on a line.
// Presets live in pipeline/directions.json; the playbook is docs/direction-guide.md. Run it after the scene script, before `npm run frames`.
import fs from 'node:fs';
import path from 'node:path';
import {loadEpisode, readJSON, writeJSON, ROOT, ok, info, die} from './lib.mjs';
import {previous} from './variety.mjs';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const opt = (k) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : undefined);
const dry = args.includes('--dry');
const {dir, sb} = loadEpisode(id);
const {presets} = readJSON(path.join(ROOT, 'pipeline/directions.json'));
const long = sb.format === 'long';

// ---- 1. score every preset against the story
const text = [sb.title, ...sb.lines.map((l) => l.text), ...(sb.facts ?? []).map((f) => f.text ?? f.fact ?? '')].join(' ').toLowerCase();
const words = text.match(/[a-z0-9']+/g) ?? [];
const count = new Set(words);
const freq = (kw) => kw.reduce((n, k) => n + words.filter((w) => w === k).length, 0);
const per100 = (preset) => (freq(preset.keywords) / Math.max(1, words.length)) * 100;
const kinds = (sb.chapters ?? []).map((c) => c.kind);
const scores = {};
for (const [name, p] of Object.entries(presets)) scores[name] = per100(p);
scores.explainer = Math.max(scores.explainer, 0.8); // baseline: wins when nothing else clearly applies
if (sb.channel === 'psych') scores.mind += 3;
if (long) {
  const both = Math.min(scores.drama, scores.comeback);
  scores.turnaround = both * 2 + (kinds.includes('downfall') && kinds.includes('recovery') ? 3 : 0) + scores.heritage * 0.5;
} else scores.turnaround = 0;
const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
const forced = opt('preset');
if (forced && !presets[forced]) die(`unknown preset "${forced}" (one of: ${Object.keys(presets).join(', ')})`);
const name = forced ?? ranked[0][0];
const P = presets[name];

// ---- 2. avoid repeating the last videos' look (backdrop / captions / entrance / accent)
const prev = previous(sb, 3);
const lastOf = (k) => prev.map((p) => p[k]).filter(Boolean);
const fresh = (list, k) => list.find((x) => !lastOf(k).slice(0, 2).includes(x)) ?? list.find((x) => x !== lastOf(k)[0]) ?? list[0];
const theme = {...(sb.theme ?? {})};
theme.look = theme.look ?? 'vox';
theme.backdrop = fresh(P.backdrops, 'backdrop');
theme.captionStyle = fresh(P.captions, 'captionStyle');
theme.transition = fresh(P.transitions, 'transition');
theme.motion = P.motion;
theme.direction = name;
if (!args.includes('--keep-accent') || !theme.accent) theme.accent = fresh(P.accents, 'accent');

// ---- 3. per-chapter / per-line decisions (only where the line has no hand-set value)
const norm = (t) => (t.toLowerCase().match(/[a-z0-9']+/g) ?? []);
const changes = {backdrop: 0, captions: 0};
const chapterKind = Object.fromEntries((sb.chapters ?? []).map((c) => [c.id, c.kind]));
const lines = sb.lines.map((l) => {
  const o = {...l};
  const kind = chapterKind[l.chapter];
  const cb = P.chapterBackdrops?.[kind];
  if (cb && !l.backdrop && cb !== theme.backdrop) (o.backdrop = cb), changes.backdrop++;
  const cc = P.chapterCaptions?.[kind];
  if (cc && !l.captions && cc !== theme.captionStyle) (o.captions = cc), changes.captions++;
  // a typewriter scene that types out the narration itself doesn't need captions on top
  if (l.scene.type === 'typewriter' && !l.captions) {
    const a = norm(l.scene.text ?? ''), b = new Set(norm(l.text));
    if (a.length && a.filter((w) => b.has(w)).length / a.length >= 0.7) (o.captions = 'off'), changes.captions++;
  }
  return o;
});
const VOX = new Set(['vox', 'typewriter', 'counter', 'line', 'chapter', 'timeline']);
const film = lines.filter((l) => l.look === 'film' || (!l.look && !VOX.has(l.scene.type))).length;
const budget = Math.max(long ? sb.chapters?.length ?? 1 : 1, Math.round(lines.length * P.filmBudget));

console.log(`\nArt direction for ${sb.id}`);
console.log('  scores: ' + ranked.slice(0, 4).map(([n, v]) => `${n} ${v.toFixed(1)}`).join(' · '));
console.log(`  → preset "${name}": ${P.mood}`);
console.log(`  backdrop ${theme.backdrop} · captions ${theme.captionStyle} · entrance ${theme.transition} · camera ${theme.motion} · accent ${theme.accent}`);
if (prev.length) console.log('  previous: ' + prev.map((p) => `${p.backdrop ?? 'paper'}/${p.captionStyle}`).join(' , '));
if (P.chapterBackdrops) console.log('  per chapter: ' + Object.entries(P.chapterBackdrops).map(([k, v]) => `${k}=${v}`).join(' '));
console.log(`  line overrides: ${changes.backdrop} backdrops, ${changes.captions} caption changes`);
console.log(`  film (photo/place) scenes: ${film} of ${lines.length} (budget ≈ ${budget})${film > budget ? '  ⚠ over budget: use fewer, only at emotional peaks' : ''}`);

if (dry) info('dry run: nothing written');
else {
  writeJSON(path.join(dir, 'storyboard.json'), {...sb, theme, lines, directionReason: `${name}: ${P.mood}`});
  ok('theme + line overrides written to storyboard.json. Run: npm run check -- ' + id + ' && npm run frames -- ' + id);
}
