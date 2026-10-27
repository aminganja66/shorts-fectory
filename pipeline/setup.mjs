// npm run setup  — run once on EACH laptop after cloning
// Installs the Claude Code commands (/short, /make, /topics) and checks your tools.
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';
import {ROOT, ok, info} from './lib.mjs';

const src = path.join(ROOT, 'claude-config');
const dst = path.join(ROOT, '.claude');
fs.mkdirSync(path.join(dst, 'commands'), {recursive: true});
for (const f of fs.readdirSync(path.join(src, 'commands'))) fs.copyFileSync(path.join(src, 'commands', f), path.join(dst, 'commands', f));
if (!fs.existsSync(path.join(dst, 'settings.json'))) fs.copyFileSync(path.join(src, 'settings.json'), path.join(dst, 'settings.json'));
const copyDir = (from, to) => fs.cpSync(from, to, {recursive: true, force: true});
copyDir(path.join(src, 'skills'), path.join(dst, 'skills'));
copyDir(path.join(src, 'agents'), path.join(dst, 'agents'));
if (fs.existsSync(path.join(src, 'skills-lock.json'))) fs.copyFileSync(path.join(src, 'skills-lock.json'), path.join(ROOT, 'skills-lock.json'));
ok('Claude Code commands installed: /short  /make  /topics');
ok(`Skills installed: ${fs.readdirSync(path.join(dst, 'skills')).length} (remotion, elevenlabs, marketing, humanizer)`);
ok(`Agents installed: ${fs.readdirSync(path.join(dst, 'agents')).map((f) => f.replace('.md', '')).join(', ')}`);

if (!fs.existsSync(path.join(ROOT, '.env'))) {
  fs.copyFileSync(path.join(ROOT, '.env.example'), path.join(ROOT, '.env'));
  info('Created .env — open it and paste your keys');
}
const has = (cmd) => {
  try {
    execSync(cmd, {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
};
console.log(has('ffmpeg -version') ? '✔ ffmpeg' : '✖ ffmpeg missing → install it (winget install ffmpeg / brew install ffmpeg)');
console.log(has('git --version') ? '✔ git' : '✖ git missing');
console.log(has('claude --version') ? '✔ Claude Code' : '✖ Claude Code missing → npm i -g @anthropic-ai/claude-code');
console.log(has('rembg --help') ? '✔ rembg (cut-outs)' : '• optional: pip install "rembg[cli]" for cut-out people/objects');
const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/music/library.json'), 'utf8'));
console.log(lib.length ? `✔ music library: ${lib.length} tracks` : '• add music tracks — see public/music/README.md');

console.log(`
Update skills later with:  npx skills update -p -y`);
