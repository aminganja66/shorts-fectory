// npm run tts-text -- <episodeId>
// Prints (and saves to public/episodes/<id>/tts-text.txt) the EXACT text to paste into the ElevenLabs tab:
// spoken forms (numbers → words), a short break after every sentence, a longer break between lines.
// Long videos (format "long"): ElevenLabs takes max 5000 chars per generation, so the script is split at chapter
// (then line) boundaries into tts-text-1.txt, tts-text-2.txt … + tts-parts.json. Import each take with
// `npm run import -- <id> voice --part N`; when every part is in, they are joined into voice.mp3.
import fs from 'node:fs';
import path from 'node:path';
import {loadEpisode, writeJSON, die, ok, info} from './lib.mjs';
import {speak} from './spoken.mjs';

const MAX = 4500; // headroom under the 5000-char limit
const id = process.argv[2];
const {dir, sb} = loadEpisode(id);
const BR = (s) => `<break time="${s}s" />`;
const lines = sb.lines.map((l) => {
  const spoken = (l.voice ?? (sb.language === 'en' ? speak(l.text) : l.text)).trim();
  return spoken.split(/(?<=[.?!।])\s+/).filter(Boolean).join(' ' + BR('0.3') + ' ');
});
const join = (ls) => ls.join(' ' + BR('0.8') + ' ');

if (sb.format !== 'long') {
  const text = join(lines);
  if (text.length > 4800) die(`Text is ${text.length} chars (ElevenLabs limit 5000) — shorten the script.`);
  fs.writeFileSync(path.join(dir, 'tts-text.txt'), text + '\n');
  console.log(text);
  ok(`${text.length} characters → public/episodes/${id}/tts-text.txt (paste this into ElevenLabs, speed 1.0)`);
} else {
  // pack whole chapters into parts; a chapter longer than MAX is cut at a line boundary
  const parts = [];
  let cur = [];
  const len = (ids) => join(ids.map((i) => lines[i])).length;
  const flush = () => cur.length && (parts.push(cur), (cur = []));
  const groups = [];
  sb.lines.forEach((l, i) => (i && l.chapter === sb.lines[i - 1].chapter ? groups[groups.length - 1].push(i) : groups.push([i])));
  for (const g of groups) {
    if (len([...cur, ...g]) <= MAX) {
      cur.push(...g);
      continue;
    }
    flush();
    for (const i of g) {
      if (len([...cur, i]) > MAX) flush();
      cur.push(i);
    }
  }
  flush();
  parts.forEach((p, k) => {
    const text = join(p.map((i) => lines[i]));
    fs.writeFileSync(path.join(dir, `tts-text-${k + 1}.txt`), text + '\n');
    info(`part ${k + 1}: lines ${p[0] + 1}–${p[p.length - 1] + 1}, ${text.length} chars → public/episodes/${id}/tts-text-${k + 1}.txt`);
  });
  writeJSON(path.join(dir, 'tts-parts.json'), {parts: parts.map((p) => ({from: sb.lines[p[0]].id, to: sb.lines[p[p.length - 1]].id}))});
  ok(`${parts.length} parts. In ElevenLabs paste each part, generate, download, then: npm run import -- ${id} voice --part N`);
}
