// npm run new -- brand "Netflix vs Blockbuster" "netflix,blockbuster,streaming"
// Creates public/episodes/<date>-<slug>/storyboard.json from the channel template and claims the topic.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {chDir, epDir, readJSON, writeJSON, slugify, today, die, ok, ROOT} from './lib.mjs';

const [channel, topic, keywords = ''] = process.argv.slice(2);
if (!['brand', 'psych'].includes(channel) || !topic) die('Usage: npm run new -- <brand|psych> "<topic>" "kw1,kw2"');

const id = `${today()}-${slugify(topic)}`;
const dir = epDir(id);
if (fs.existsSync(dir)) die(`Already exists: ${id}`);

execFileSync('node', [path.join(ROOT, 'pipeline/history.mjs'), 'claim', channel, topic, id, keywords], {stdio: 'inherit'});

const cfg = readJSON(path.join(chDir(channel), 'config.json'));
fs.mkdirSync(path.join(dir, 'assets'), {recursive: true});
writeJSON(path.join(dir, 'storyboard.json'), {
  id,
  channel,
  language: cfg.language,
  topic,
  title: '',
  theme: cfg.theme,
  facts: [],
  lines: [],
  assets: [],
  music: {file: '', volume: cfg.music?.volume ?? 0.16},
  voice: {file: 'voice.mp3'},
  upload: {title: '', description: '', hashtags: cfg.hashtags ?? []},
});
ok(`Episode ready: public/episodes/${id}`);
console.log(id);
