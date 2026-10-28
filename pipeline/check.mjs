// npm run check -- <episodeId>
// Quality gate before voice/render: structure, length, sources, licenses, missing files.
import fs from 'node:fs';
import path from 'node:path';
import {loadEpisode, readJSON, ROOT, ok} from './lib.mjs';
import {varietyCheck} from './variety.mjs';
import {speak} from './spoken.mjs';

const id = process.argv[2];
const {dir, sb} = loadEpisode(id);
const credits = readJSON(path.join(dir, 'credits.json'), {});
const problems = [];
const warn = [];

if (!sb.title) problems.push('title is empty');
if (!sb.lines?.length) problems.push('no lines');
const chCfg = readJSON(path.join(ROOT, 'channels', sb.channel ?? '', 'config.json'), {});
const long = sb.format === 'long';
const words = sb.lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
// real Hindi narration at natural speed ≈ 0.5 s/word + ~0.8 s between lines (measured on the first Nokia Short: 119 words = 56 s even at 1.2× speed)
const en = sb.language === 'en';
const est = en ? words * 0.45 + sb.lines.length * 1.1 : words * 0.5 + sb.lines.length * 0.8; // measured: Jon (English) 105 words + 8 lines = 57 s
if (long) {
  // LONG (16:9 documentary): chapters open → idea → rise → downfall → recovery → today, 8–12 min (channels/<ch>/config.json → long)
  const L = chCfg.long ?? {};
  const [minS, maxS] = (L.length?.seconds ?? '480-720').split('-').map(Number);
  const maxHard = L.length?.maxSeconds ?? 780;
  if (est > maxHard) problems.push(`estimated length ${(est / 60).toFixed(1)} min — over ${maxHard / 60} min. Cut lines instead of speeding the voice up.`);
  else if (est > maxS) warn.push(`estimated length ${(est / 60).toFixed(1)} min (aim ${minS / 60}–${maxS / 60} min)`);
  else if (est < minS) problems.push(`estimated length ${(est / 60).toFixed(1)} min — under ${minS / 60} min (mid-roll ads need 8+ min). Add story, not padding.`);
  const chapters = sb.chapters ?? [];
  const order = ['open', 'idea', 'rise', 'downfall', 'recovery', 'today'];
  const kinds = chapters.map((c) => c.kind);
  for (const k of order.slice(1)) if (!kinds.includes(k)) problems.push(`chapter "${k}" is missing (arc: ${order.join(' → ')})`);
  if (kinds.join('>') !== order.filter((k) => kinds.includes(k)).join('>')) problems.push(`chapters are out of order: ${kinds.join(' → ')}`);
  sb.lines.forEach((l, i) => !chapters.find((c) => c.id === l.chapter) && problems.push(`line ${i + 1} has no valid "chapter" (one of: ${chapters.map((c) => c.id).join(', ')})`));
  chapters.forEach((c) => {
    const ls = sb.lines.filter((l) => l.chapter === c.id);
    const need = c.kind === 'open' ? 3 : 6;
    if (ls.length < need) problems.push(`chapter "${c.title}" has ${ls.length} lines (min ${need})`);
    if (c.kind !== 'open' && ls[0] && ls[0].scene.type !== 'chapter') warn.push(`chapter "${c.title}" should open with a "chapter" title card scene`);
    if (c.kind !== 'open' && (sb.facts ?? []).filter((f) => f.chapter === c.id).length < 2) problems.push(`chapter "${c.title}" needs at least 2 sourced facts (facts[].chapter = "${c.id}")`);
  });
  const minFacts = L.length?.minFacts ?? 12;
  if ((sb.facts ?? []).length < minFacts) problems.push(`fewer than ${minFacts} facts with sources (long video)`);
  // re-hook at least every ~90 s: a line with a question or a turn word
  const hooks = sb.lines.map((l, i) => (/\?|^(but|then|until|except|and then|so why|yet|still)\b/i.test(l.text.trim()) ? i : -1)).filter((i) => i >= 0);
  const perLine = est / Math.max(1, sb.lines.length);
  let last = 0;
  for (const h of [...hooks, sb.lines.length]) {
    if ((h - last) * perLine > 100) warn.push(`no re-hook between line ${last + 1} and ${h + 1} (~${Math.round((h - last) * perLine)} s) — add a "But…" / question line`);
    last = h;
  }
  const flashes = sb.lines.flatMap((l) => (l.beats ?? []).filter((b) => b.do === 'flash' || b.do === 'shake').map(() => l.chapter));
  chapters.forEach((c) => flashes.filter((x) => x === c.id).length > 1 && problems.push(`chapter "${c.title}" has more than 1 flash/shake (max 1 per chapter)`));
} else {
  // Length tier (channels/<ch>/config.json → length.tiers): quick 30–42 s · story 43–58 s · deep 58–85 s, chosen by the story.
  const chLength = chCfg.length ?? {};
  const tierName = sb.length ?? chLength.default ?? 'quick';
  const tier = chLength.tiers?.[tierName] ?? {lines: '6-8', seconds: '30-42', maxWords: 75, maxSeconds: 48};
  if (!chLength.tiers?.[tierName]) warn.push(`unknown length tier "${tierName}" — using quick limits (tiers: ${Object.keys(chLength.tiers ?? {}).join(', ')})`);
  if (tierName !== 'quick' && !sb.lengthReason) problems.push(`length "${tierName}" needs storyboard.lengthReason (one sentence: why this story can't fit in quick)`);
  const [minLines, maxLines] = tier.lines.split('-').map(Number);
  const [minSec] = tier.seconds.split('-').map(Number);
  if (sb.lines?.length < minLines - 1 || sb.lines?.length > maxLines + 1) warn.push(`${sb.lines?.length} lines (aim for ${tier.lines} in "${tierName}")`);
  if (words > tier.maxWords) problems.push(`${words} words — max ${tier.maxWords} for "${tierName}". Cut words, or pick a longer tier only if the story really needs it.`);
  if (est > tier.maxSeconds) problems.push(`estimated length ${est.toFixed(0)}s — over ${tier.maxSeconds}s for "${tierName}". Cut words instead of speeding the voice up.`);
  else if (est < minSec - 6) warn.push(`estimated length ${est.toFixed(0)}s (aim ${tier.seconds}s for "${tierName}" — or use a shorter tier)`);
  const minFacts = {quick: 3, story: 4, deep: 5}[tierName] ?? 3;
  if ((sb.facts ?? []).length < minFacts) problems.push(`fewer than ${minFacts} facts with sources (needed for "${tierName}")`);
  // Longer Shorts sag in the middle: re-open a loop (question / "But…" / "Then…") somewhere in the middle third.
  if (tierName !== 'quick') {
    const mid = sb.lines.slice(Math.floor(sb.lines.length / 3), Math.ceil((sb.lines.length * 2) / 3));
    if (!mid.some((l) => /\?|^(but|then|until|except|and then|so why)\b/i.test(l.text.trim()))) warn.push('no re-hook in the middle third — add a line that opens a new question ("But…", "Then…", a "?") so retention doesn\'t sag');
  }
}
(sb.facts ?? []).forEach((f, i) => !f.source && problems.push(`fact ${i + 1} has no source`));
const first = sb.lines[0]?.text.split(/\s+/).length ?? 0;
if (first > (long ? 16 : 12)) problems.push(`hook line is ${first} words — max ${long ? 16 : 12} so it lands in ~3s`);
if (!/[?？]/.test(sb.lines[0]?.text ?? '')) problems.push('hook (line 1) must be an open question ending with ? — big stake first, key noun withheld, answered in line 2 (CLAUDE.md → Hook)');
if ((sb.hookCandidates ?? []).length < 3) problems.push('hookCandidates: write 3 different hooks in storyboard.json and pick the best one as line 1 (see scriptwriter agent)');

// Anything the narrator must pronounce differently from how it is written needs a `voice` line (spoken form).
// Digits, %, symbols and abbreviations like Q3 / CEO / 5.44B must be spelled the way an Indian says them in Hinglish.
sb.lines.forEach((l, i) => {
  const raw = l.text;
  if (en) {
    // English: pipeline/spoken.mjs turns every number/symbol into spoken words. The result must be stored in `voice` so it can be reviewed.
    if (speak(raw) !== raw && !l.voice) problems.push(`line ${i + 1} has numbers/symbols but no spoken form yet — run: npm run spoken -- ${id}`);
    return;
  }
  const risky = /\d|%|\$|€|₹|&|\bQ[1-4]\b/.test(raw);
  if (risky && !l.voice) problems.push(`line ${i + 1} has digits/symbols but no \`voice\` (spoken form)`);
});

const used = new Set();
sb.lines.forEach((l) => {
  const s = l.scene;
  [s.bg, s.mid, s.mid2, s.fg, s.fg2, s.logo, s.prop, s.icon, s.left?.image, s.right?.image, ...(s.images ?? [])].filter(Boolean).forEach((f) => used.add(f));
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

// long videos are their own series (house look locked); variety rules compare Shorts with Shorts
const v = long ? {problems: [], warn: [], recent: []} : varietyCheck(sb);
problems.push(...v.problems);
warn.push(...v.warn);
if (v.recent.length) console.log('Recent Shorts (look/captions/transition/hook · scenes):\n  ' + v.recent.join('\n  '));
warn.forEach((w) => console.log(`⚠ ${w}`));
if (problems.length) {
  problems.forEach((p) => console.log(`✖ ${p}`));
  process.exit(4);
}
ok(`Checks passed (${words} words, ~${long ? `${(est / 60).toFixed(1)} min` : `${est.toFixed(0)}s`})`);
