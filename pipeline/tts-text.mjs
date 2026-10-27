// npm run tts-text -- <episodeId>
// Prints (and saves to public/episodes/<id>/tts-text.txt) the EXACT text to paste into the ElevenLabs tab:
// spoken forms (numbers → words), a short break after every sentence, a longer break between lines.
import fs from 'node:fs';
import path from 'node:path';
import {loadEpisode, die, ok} from './lib.mjs';
import {speak} from './spoken.mjs';

const id = process.argv[2];
const {dir, sb} = loadEpisode(id);
const BR = (s) => `<break time="${s}s" />`;
const lines = sb.lines.map((l) => {
  const spoken = (l.voice ?? (sb.language === 'en' ? speak(l.text) : l.text)).trim();
  return spoken.split(/(?<=[.?!।])\s+/).filter(Boolean).join(' ' + BR('0.3') + ' ');
});
const text = lines.join(' ' + BR('0.8') + ' ');
if (text.length > 4800) die(`Text is ${text.length} chars (ElevenLabs limit 5000) — shorten the script.`);
fs.writeFileSync(path.join(dir, 'tts-text.txt'), text + '\n');
console.log(text);
ok(`${text.length} characters → public/episodes/${id}/tts-text.txt (paste this into ElevenLabs, speed 1.0)`);
