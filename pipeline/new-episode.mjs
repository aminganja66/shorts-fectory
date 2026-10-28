// npm run new -- brand "Netflix vs Blockbuster" "netflix,blockbuster,streaming" [--retry] [--long]
// --long = 16:9 chapter documentary (8–12 min): id ends in -long, chapters from config.long, duplicates checked only against other long videos.
// Creates public/episodes/<date>-<slug>/storyboard.json from the channel template and claims the topic.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {chDir, epDir, readJSON, writeJSON, slugify, today, die, ok, ROOT} from './lib.mjs';

const argv = process.argv.slice(2);
const retry = argv.includes('--retry'); // same topic again (new version to compare with the old one)
const long = argv.includes('--long');
const [channel, topic, keywords = ''] = argv.filter((a) => !a.startsWith('--'));
if (!['brand', 'psych'].includes(channel) || !topic) die('Usage: npm run new -- <brand|psych> "<topic>" "kw1,kw2"');

let id = `${today()}-${slugify(topic)}${long ? '-long' : ''}`;
if (retry) {
  let v = 2;
  while (fs.existsSync(epDir(`${id}-v${v}`))) v++;
  id = `${id}-v${v}`;
}
const dir = epDir(id);
if (fs.existsSync(dir)) die(`Already exists: ${id}`);

if (long && !readJSON(path.join(chDir(channel), 'config.json')).long) die(`channels/${channel}/config.json has no "long" block — long videos are set up for: brand`);
execFileSync('node', [path.join(ROOT, 'pipeline/history.mjs'), 'claim', channel, topic, id, keywords, ...(retry ? ['--retry'] : []), ...(long ? ['--long'] : [])], {stdio: 'inherit'});

const cfg = readJSON(path.join(chDir(channel), 'config.json'));
fs.mkdirSync(path.join(dir, 'assets'), {recursive: true});
writeJSON(path.join(dir, 'storyboard.json'), {
  id,
  channel,
  language: cfg.language,
  topic,
  title: '',
  ...(long ? {format: 'long', chapters: cfg.long.chapters.map((c, i) => ({id: `c${i}`, kind: c.kind, title: c.title}))} : {}),
  theme: long ? cfg.long.theme : cfg.theme,
  facts: [],
  lines: [],
  assets: [],
  music: {file: '', volume: cfg.music?.volume ?? 0.16},
  voice: {file: 'voice.mp3'},
  upload: {title: '', description: '', hashtags: (long ? cfg.long.hashtags : cfg.hashtags) ?? [], ...(long ? {chapters: ''} : {})},
});
ok(`Episode ready: public/episodes/${id}`);
console.log(id);
