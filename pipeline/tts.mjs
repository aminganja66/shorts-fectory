// npm run voice -- <episodeId> [--take 2]
// ElevenLabs text-to-speech WITH timestamps → voice.mp3 + timing.json (word + line timings for captions/scene cuts).
// Whole script in ONE request so intonation flows naturally between lines.
import fs from 'node:fs';
import path from 'node:path';
import {loadEpisode, readJSON, writeJSON, chDir, die, ok} from './lib.mjs';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const take = args.includes('--take') ? args[args.indexOf('--take') + 1] : null;
const {dir, sb} = loadEpisode(id);
const key = process.env.ELEVENLABS_API_KEY;
if (!key) die('ELEVENLABS_API_KEY missing in .env (or record your own voice and run: npm run timing -- <id> voice.m4a)');

const cfg = readJSON(path.join(chDir(sb.channel), 'config.json')).voice;
const voiceId = sb.voice?.voiceId ?? cfg.voiceId;
if (!voiceId) die('No voiceId in channels/<channel>/config.json');

// Optional pronunciation fixes: {"Netflix":"नेटफ्लिक्स"} in config.voice.say
const say = (t) => Object.entries(cfg.say ?? {}).reduce((s, [k, v]) => s.replaceAll(k, v), t);
const spoken = sb.lines.map((l) => say(l.voice ?? l.text));
// A long <break> between lines (longer than a sentence pause) lets pipeline/align.mjs and the viewer hear where each line ends.
const BREAK = '<break time="1.1s" />';
const text = spoken.join(` ${BREAK} `);

const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
  method: 'POST',
  headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
  body: JSON.stringify({
    text,
    model_id: cfg.model ?? 'eleven_multilingual_v2',
    language_code: cfg.languageCode,
    voice_settings: cfg.settings ?? {stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true, speed: 1.0},
  }),
});
if (!res.ok) die(`ElevenLabs ${res.status}: ${await res.text()}`);
const j = await res.json();
const file = take ? `voice-take${take}.mp3` : 'voice.mp3';
fs.writeFileSync(path.join(dir, file), Buffer.from(j.audio_base64, 'base64'));

// characters → words with start/end
const al = j.alignment;
const words = [];
let cur = null;
const isTag = (t) => /^<break|^time=|^\/?>$|^"?\d+(\.\d+)?s"$|^\/>$/.test(t);
al.characters.forEach((ch, i) => {
  if (/\s/.test(ch)) {
    if (cur) words.push(cur);
    cur = null;
    return;
  }
  if (!cur) cur = {text: '', start: al.character_start_times_seconds[i], end: 0, ci: i};
  cur.text += ch;
  cur.end = al.character_end_times_seconds[i];
});
if (cur) words.push(cur);
for (let i = words.length - 1; i >= 0; i--) if (isTag(words[i].text)) words.splice(i, 1);

// Captions show the ORIGINAL script words (correct spelling), timed by the spoken words.
const lines = [];
let wi = 0;
const capWords = [];
sb.lines.forEach((l, li) => {
  const spokenCount = spoken[li].split(/\s+/).filter(Boolean).length;
  const seg = words.slice(wi, wi + spokenCount);
  wi += spokenCount;
  const shown = l.text.split(/\s+/).filter(Boolean);
  shown.forEach((w, k) => {
    const src = seg[Math.min(seg.length - 1, Math.floor((k / shown.length) * seg.length))];
    const nxt = seg[Math.min(seg.length - 1, Math.floor(((k + 1) / shown.length) * seg.length) - 1)] ?? src;
    capWords.push({text: w, start: src.start, end: Math.max(src.end, nxt.end)});
  });
  lines.push({id: l.id, start: seg[0]?.start ?? 0, end: seg[seg.length - 1]?.end ?? 0});
});
const duration = words[words.length - 1].end;
const timingFile = take ? `timing-take${take}.json` : 'timing.json';
writeJSON(path.join(dir, timingFile), {words: capWords, lines, duration});
ok(`${file} (${duration.toFixed(1)}s) + ${timingFile}`);
if (duration > 58) console.log('⚠ Over 58s — shorten the script for Shorts.');
