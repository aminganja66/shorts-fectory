// npm run timing -- <episodeId> [voice-file]
// Use when the voice is YOUR OWN recording (or any audio without timestamps).
// Runs whisper.cpp locally (free, first run downloads ~1.5GB model) to get word timings → timing.json.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {installWhisperCpp, downloadWhisperModel, transcribe, toCaptions} from '@remotion/install-whisper-cpp';
import {loadEpisode, writeJSON, ROOT, die, ok, info} from './lib.mjs';

const [id, fileArg] = process.argv.slice(2);
const {dir, sb} = loadEpisode(id);
const input = path.join(dir, fileArg ?? sb.voice?.file ?? 'voice.mp3');
if (!fs.existsSync(input)) die(`Voice file not found: ${input}`);

const W = path.join(ROOT, '.whisper');
const VERSION = '1.7.4';
const MODEL = process.env.WHISPER_MODEL ?? 'medium'; // medium handles Hindi well; use "small" on slow laptops
await installWhisperCpp({to: W, version: VERSION});
await downloadWhisperModel({model: MODEL, folder: W});

// whisper needs 16kHz mono wav; also normalise the voice to a standard file
const wav = path.join(dir, 'voice-16k.wav');
execFileSync('ffmpeg', ['-y', '-i', input, '-ar', '16000', '-ac', '1', wav], {stdio: 'ignore'});
if (path.extname(input) !== '.mp3') {
  execFileSync('ffmpeg', ['-y', '-i', input, '-b:a', '192k', path.join(dir, 'voice.mp3')], {stdio: 'ignore'});
  info('Converted recording to voice.mp3');
}

const out = await transcribe({
  inputPath: wav,
  whisperPath: W,
  whisperCppVersion: VERSION,
  model: MODEL,
  tokenLevelTimestamps: true,
  language: sb.language === 'hi' ? 'hi' : 'en',
  splitOnWord: true,
});
const {captions} = toCaptions({whisperCppOutput: out});
const heard = captions.map((c) => ({text: c.text.trim(), start: c.startMs / 1000, end: c.endMs / 1000})).filter((w) => w.text);
if (!heard.length) die('Whisper heard nothing.');

// Map script words onto heard words proportionally (captions keep correct script spelling).
const script = sb.lines.map((l) => l.text.split(/\s+/).filter(Boolean));
const total = script.flat().length;
const words = [];
const lines = [];
let k = 0;
script.forEach((ws, li) => {
  const startK = k;
  ws.forEach((w) => {
    const a = heard[Math.min(heard.length - 1, Math.floor((k / total) * heard.length))];
    const b = heard[Math.min(heard.length - 1, Math.floor(((k + 1) / total) * heard.length) - 1)] ?? a;
    words.push({text: w, start: a.start, end: Math.max(a.end, b.end)});
    k++;
  });
  lines.push({id: sb.lines[li].id, start: words[startK].start, end: words[k - 1].end});
});
writeJSON(path.join(dir, 'timing.json'), {words, lines, duration: heard[heard.length - 1].end});
fs.rmSync(wav);
ok(`timing.json from your recording (${heard.length} words heard)`);
