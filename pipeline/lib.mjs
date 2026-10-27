import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({path: path.join(ROOT, '.env'), quiet: true});

export const epDir = (id) => path.join(ROOT, 'public', 'episodes', id);
export const chDir = (ch) => path.join(ROOT, 'channels', ch);

export const readJSON = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Cannot read ${path.relative(ROOT, p)}: ${e.message}`);
  }
};
export const writeJSON = (p, data) => {
  fs.mkdirSync(path.dirname(p), {recursive: true});
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
};

export const loadEpisode = (id) => {
  if (!id) die('Usage: needs an episode id, e.g. 2026-10-28-netflix-blockbuster');
  const dir = epDir(id);
  if (!fs.existsSync(dir)) die(`Episode not found: public/episodes/${id}`);
  return {dir, sb: readJSON(path.join(dir, 'storyboard.json'))};
};

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

export const today = () => new Date().toISOString().slice(0, 10);

export const die = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};
export const ok = (msg) => console.log(`✔ ${msg}`);
export const info = (msg) => console.log(`• ${msg}`);
