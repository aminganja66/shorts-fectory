// Topic memory shared by both laptops (committed to git).
//   npm run history -- list brand
//   npm run history -- check brand "Netflix vs Blockbuster"
//   npm run history -- claim brand "Netflix vs Blockbuster" <episodeId> "netflix,blockbuster,streaming"
//   npm run history -- done <episodeId> [youtubeUrl]
//   npm run history -- drop <episodeId>
import path from 'node:path';
import fs from 'node:fs';
import {chDir, epDir, readJSON, writeJSON, die, ok, info, today} from './lib.mjs';
import {signature} from './variety.mjs';

const RETRY = process.argv.includes('--retry');
// --long: long videos are their own series — a long documentary on a company we already made a Short about is NOT a duplicate
const LONG = process.argv.includes('--long');
const [cmd, a, b, c, d] = process.argv.slice(2).filter((x) => !x.startsWith('--'));
const file = (ch) => path.join(chDir(ch), 'history.json');
const load = (ch) => readJSON(file(ch), []);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9ऀ-ॿ ]/g, ' ').split(/\s+/).filter((w) => w.length > 2);

const similar = (ch, topic, keywords = []) => {
  const want = new Set([...norm(topic), ...keywords.map((k) => k.toLowerCase())]);
  return load(ch)
    .filter((h) => h.status !== 'dropped')
    .filter((h) => (h.format === 'long') === LONG)
    .map((h) => {
      const have = new Set([...norm(h.topic), ...(h.keywords || [])]);
      const overlap = [...want].filter((w) => have.has(w)).length;
      return {...h, score: overlap / Math.max(1, Math.min(want.size, have.size))};
    })
    .filter((h) => h.score >= 0.5)
    .sort((x, y) => y.score - x.score);
};

const findEp = (id) => {
  for (const ch of ['brand', 'psych']) {
    const h = load(ch);
    const i = h.findIndex((x) => x.episodeId === id);
    if (i >= 0) return {ch, h, i};
  }
  die(`Episode ${id} not in any history.json`);
};

switch (cmd) {
  case 'list': {
    const h = load(a);
    if (!h.length) info(`No ${a} topics yet.`);
    h.forEach((x) => console.log(`${x.date}  [${x.status}]  ${x.topic}  (${x.episodeId})`));
    break;
  }
  case 'check': {
    const m = similar(a, b, (c || '').split(',').filter(Boolean));
    if (m.length) {
      console.log(`DUPLICATE RISK for "${b}":`);
      m.forEach((x) => console.log(`  ${Math.round(x.score * 100)}%  ${x.topic} (${x.date}, ${x.status})`));
      if (RETRY) {
        console.log('--retry given: making a new version of the same topic on purpose.');
        break;
      }
      process.exit(2);
    }
    ok(`"${b}" is new for ${a}`);
    break;
  }
  case 'claim': {
    if (!a || !b || !c) die('claim <channel> "<topic>" <episodeId> "kw1,kw2"');
    const kws = (d || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const m = similar(a, b, kws);
    if (m.length && !RETRY) die(`Topic too close to: ${m[0].topic} (${m[0].episodeId})`);
    const h = load(a);
    h.push({topic: b, episodeId: c, keywords: kws, status: 'in-progress', date: today(), ...(LONG ? {format: 'long'} : {}), ...(RETRY && m.length ? {retryOf: m[0].episodeId} : {})});
    writeJSON(file(a), h);
    ok(`Claimed "${b}" → ${c}`);
    break;
  }
  case 'done':
  case 'drop': {
    const {ch, h, i} = findEp(a);
    h[i].status = cmd === 'done' ? 'rendered' : 'dropped';
    const sbp = path.join(epDir(a), 'storyboard.json');
    if (cmd === 'done' && fs.existsSync(sbp)) h[i].signature = signature(readJSON(sbp));
    if (b) h[i].youtube = b;
    h[i].updated = today();
    writeJSON(file(ch), h);
    ok(`${a} → ${h[i].status}`);
    break;
  }
  case 'published': {
    const {ch, h, i} = findEp(a);
    h[i].status = 'published';
    if (b) h[i].youtube = b;
    h[i].updated = today();
    writeJSON(file(ch), h);
    ok(`${a} → published`);
    break;
  }
  default:
    console.log('Commands: list | check | claim | done | drop | published');
}
