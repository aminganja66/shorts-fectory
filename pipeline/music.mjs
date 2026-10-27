// npm run music -- <episodeId> "<prompt>" [seconds]
// Generates an ORIGINAL instrumental track for this episode with ElevenLabs Music (no copyright claims),
// saves it to public/music/<episodeId>.mp3, registers it in library.json and sets storyboard.music.file.
//   e.g. npm run music -- <id> "dark documentary underscore, low strings, ticking clock, slow build, tension, no vocals" 45
// Also: npm run music -- <id> --sfx "<prompt>" <name> [seconds]  → public/sfx/<name>.mp3 (sound effect)
import fs from 'node:fs';
import path from 'node:path';
import {loadEpisode, readJSON, writeJSON, ROOT, die, ok} from './lib.mjs';

const args = process.argv.slice(2);
const id = args[0];
const {dir, sb} = loadEpisode(id);
const key = process.env.ELEVENLABS_API_KEY;
if (!key) die('ELEVENLABS_API_KEY missing — use Browser mode (Pixabay Music) or the YouTube Audio Library instead.');

if (args[1] === '--sfx') {
  const [, , prompt, name, secs] = args;
  const r = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
    body: JSON.stringify({text: prompt, duration_seconds: secs ? Number(secs) : null, prompt_influence: 0.6}),
  });
  if (!r.ok) die(`ElevenLabs SFX ${r.status}: ${await r.text()}`);
  const out = path.join(ROOT, 'public/sfx', `${name}.mp3`);
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  ok(`SFX → public/sfx/${name}.mp3`);
  process.exit(0);
}

const prompt = args[1];
if (!prompt) die('Give a music prompt: mood, instruments, tempo, energy curve, "no vocals"');
const seconds = Number(args[2] ?? 45);
const r = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
  method: 'POST',
  headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
  body: JSON.stringify({prompt, music_length_ms: Math.round(seconds * 1000), model_id: process.env.ELEVENLABS_MUSIC_MODEL ?? 'music_v2_5', force_instrumental: true}),
});
if (!r.ok) die(`ElevenLabs Music ${r.status}: ${await r.text()}`);
const file = `${id}.mp3`;
fs.writeFileSync(path.join(ROOT, 'public/music', file), Buffer.from(await r.arrayBuffer()));

const libPath = path.join(ROOT, 'public/music/library.json');
const lib = readJSON(libPath, []).filter((m) => m.file !== file);
lib.push({file, title: `Original score · ${sb.topic}`, author: 'ElevenLabs Music (generated)', mood: prompt.slice(0, 80), license: 'Generated with ElevenLabs Music on a paid plan (commercial use per ElevenLabs terms)', url: '', generated: true});
writeJSON(libPath, lib);
sb.music = {...(sb.music ?? {}), file};
writeJSON(path.join(dir, 'storyboard.json'), sb);
ok(`Music → public/music/${file} (${seconds}s) and set in storyboard`);
