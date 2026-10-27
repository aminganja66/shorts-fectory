// npm run assets -- <episodeId> [--force] [--only s2-bg]
// Fills every storyboard.assets entry and records source + author + license in credits.json.
//
// Asset entry types:
//   stock photo   {"file":"assets/s1-bg.jpg","query":"old video rental store aisle","orientation":"portrait"}
//   brand logo    {"file":"assets/logo-netflix.png","query":"Netflix 2015 logo","kind":"logo"}          → Wikimedia Commons (public-domain text logos)
//   real person   {"file":"assets/reed.png","query":"Reed Hastings","kind":"person","cutout":true}   → Wikimedia Commons (CC0/PD/CC BY; add "allowShareAlike":true for CC BY-SA)
//   AI image      {"file":"assets/s3-hq.jpg","generate":"1990s American video rental store at night, neon sign, rain","orientation":"portrait"}  → OpenAI Images
//   your own file {"file":"assets/x.jpg","from":"~/Downloads/x.jpg","license":"...","page":"..."}
//   cut-out       add "cutout": true  (needs `pip install "rembg[cli]"`)
//   better pick   look at assets/candidates.json, set "pick": n, then run with --force --only <file>
//
// Never: Google Images, news-agency photos (Getty/AP/Reuters), movie stills, TV footage,
//        AI images that imitate a real, named person.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {loadEpisode, writeJSON, readJSON, die, ok, info} from './lib.mjs';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const force = args.includes('--force');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const {dir, sb} = loadEpisode(id);
const UA = {'User-Agent': 'shorts-factory/1.0 (personal YouTube project)'};

const providers = {
  async pexels(q, o) {
    const key = process.env.PEXELS_API_KEY;
    if (!key) return [];
    const u = `https://api.pexels.com/v1/search?per_page=8&query=${encodeURIComponent(q)}${o ? `&orientation=${o}` : ''}`;
    const r = await fetch(u, {headers: {Authorization: key}});
    if (!r.ok) return [];
    const j = await r.json();
    return j.photos.map((p) => ({
      url: p.src.large2x,
      thumb: p.src.medium,
      page: p.url,
      author: p.photographer,
      license: 'Pexels License',
      provider: 'pexels',
      w: p.width,
      h: p.height,
    }));
  },
  async pixabay(q, o) {
    const key = process.env.PIXABAY_API_KEY;
    if (!key) return [];
    const u = `https://pixabay.com/api/?key=${key}&per_page=8&safesearch=true&image_type=photo&q=${encodeURIComponent(q)}${o === 'portrait' ? '&orientation=vertical' : ''}`;
    const r = await fetch(u);
    if (!r.ok) return [];
    const j = await r.json();
    return j.hits.map((p) => ({
      url: p.largeImageURL,
      thumb: p.webformatURL,
      page: p.pageURL,
      author: p.user,
      license: 'Pixabay Content License',
      provider: 'pixabay',
      w: p.imageWidth,
      h: p.imageHeight,
    }));
  },
  async openverse(q) {
    const u = `https://api.openverse.org/v1/images/?page_size=12&license=cc0,pdm,by&q=${encodeURIComponent(q)}`;
    const r = await fetch(u, {headers: UA});
    if (!r.ok) return [];
    const j = await r.json();
    return j.results
      .filter((p) => ['cc0', 'pdm', 'by'].includes(p.license) && (p.width ?? 1200) >= 900)
      .map((p) => ({
        url: p.url,
        thumb: p.thumbnail,
        page: p.foreign_landing_url,
        author: p.creator || 'Unknown',
        license: `${p.license.toUpperCase()} ${p.license_version ?? ''}`.trim(),
        provider: `openverse/${p.source}`,
        w: p.width,
        h: p.height,
      }));
  },
  async wikimedia(q, o, a = {}) {
    // a.kind: 'logo' → vector drawings (rendered to PNG), 'person' → photos of real people (optionally CC BY-SA)
    const type = a.kind === 'logo' ? 'filetype:drawing' : 'filetype:bitmap';
    const u =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=15' +
      `&gsrsearch=${encodeURIComponent(q + ' ' + type)}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=${a.kind === 'logo' ? 1200 : 1600}`;
    const r = await fetch(u, {headers: UA});
    if (!r.ok) return [];
    const j = await r.json();
    const allowSA = a.kind === 'person' && a.allowShareAlike;
    return Object.values(j.query?.pages ?? {})
      .sort((x, y) => (x.index ?? 0) - (y.index ?? 0))
      .map((p) => {
        const ii = p.imageinfo?.[0];
        const m = ii?.extmetadata ?? {};
        const lic = (m.LicenseShortName?.value ?? '').trim();
        return {
          url: ii?.thumburl ?? ii?.url,
          thumb: ii?.thumburl,
          page: ii?.descriptionurl,
          author: (m.Artist?.value ?? 'Unknown').replace(/<[^>]+>/g, '').trim(),
          license: lic,
          provider: 'wikimedia',
          trademark: a.kind === 'logo' ? 'Logo is a trademark of its owner; used for identification/commentary only' : undefined,
          w: ii?.width,
          h: ii?.height,
        };
      })
      .filter((p) => {
        if (!p.url) return false;
        const okLic = /^(CC0|Public domain|PD|CC BY \d|CC BY-SA \d)/i.test(p.license) && !/NC|ND/.test(p.license) && (allowSA || !/SA/.test(p.license));
        return okLic && (a.kind === 'logo' || (p.w ?? 0) >= 700);
      });
  },
  // AI image (OpenAI Images API — needs OPENAI_API_KEY; ChatGPT Plus alone does not include API credits)
  async openai(prompt, o) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY missing in .env');
    const model = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2';
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({model, prompt, n: 1, size: o === 'landscape' ? '1536x1024' : o === 'square' ? '1024x1024' : '1024x1536', quality: process.env.OPENAI_IMAGE_QUALITY ?? 'medium'}),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const j = await r.json();
    return {b64: j.data[0].b64_json, model};
  },
};

const download = async (url, dest) => {
  const r = await fetch(url, {headers: UA});
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
};

// Optional: background removal for cut-out foregrounds (needs `pip install rembg[cli]`)
const cutout = (src, dest) => {
  try {
    execFileSync('rembg', ['i', src, dest], {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
};

const creditsPath = path.join(dir, 'credits.json');
const candPath = path.join(dir, 'assets', 'candidates.json');
const credits = readJSON(creditsPath, {});
const candidates = readJSON(candPath, {});
const order = (sb.assetProviders ?? ['pexels', 'pixabay', 'openverse', 'wikimedia']);

let missing = 0;
for (const a of sb.assets ?? []) {
  if (only && !a.file.includes(only)) continue;
  const dest = path.join(dir, a.file);
  if (a.manual) {
    if (!fs.existsSync(dest)) {
      info(`MANUAL asset needed: ${a.file} — ${a.note ?? a.query}`);
      missing++;
    }
    continue;
  }
  if (fs.existsSync(dest) && !force) continue;
  // Local file you saved yourself (e.g. downloaded in Chrome): {"from": "~/Downloads/reed-hastings.png"}
  if (a.from) {
    const src = a.from.replace(/^~/, os.homedir());
    if (!fs.existsSync(src)) {
      info(`Local file not found for ${a.file}: ${a.from}`);
      missing++;
      continue;
    }
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.copyFileSync(src, dest);
    credits[a.file] = {provider: 'local', author: a.author ?? 'see note', license: a.license ?? 'CHECK — added by hand', page: a.page ?? '', query: a.query ?? ''};
    ok(`${a.file}  ←  ${a.from}`);
    continue;
  }
  // AI-generated image: {"generate": "cinematic photo of ...", "orientation": "portrait"}
  if (a.generate && !credits[a.file]) {
    try {
      const g = await providers.openai(`${a.generate}. ${sb.imageStyle ?? 'Photorealistic, cinematic documentary lighting, 35mm film look, no text, no logos, no watermark'}`, a.orientation);
      const raw = a.cutout ? dest.replace(/\.\w+$/, '.src.png') : dest;
      fs.mkdirSync(path.dirname(dest), {recursive: true});
      fs.writeFileSync(raw, Buffer.from(g.b64, 'base64'));
      if (a.cutout && !cutout(raw, dest)) fs.copyFileSync(raw, dest);
      credits[a.file] = {provider: `openai/${g.model}`, author: 'AI-generated', license: 'AI-generated (OpenAI terms: output owned by you)', aiGenerated: true, prompt: a.generate, page: '', url: ''};
      ok(`${a.file}  ←  generated (${g.model})`);
    } catch (e) {
      info(`Generate failed for ${a.file}: ${e.message}`);
      missing++;
    }
    continue;
  }
  // Other laptop already chose this image → restore the exact same file (assets are not stored in git)
  if (credits[a.file]?.url && !force) {
    try {
      const raw = a.cutout ? dest.replace(/\.\w+$/, '.src.jpg') : dest;
      await download(credits[a.file].url, raw);
      if (a.cutout && !cutout(raw, dest)) fs.copyFileSync(raw, dest);
      ok(`${a.file}  restored from credits.json`);
      continue;
    } catch (e) {
      info(`Restore failed for ${a.file} (${e.message}) — searching again`);
    }
  }
  let results = [];
  for (const p of a.providers ?? (a.kind === 'logo' || a.kind === 'person' ? ['wikimedia'] : order)) {
    try {
      results = results.concat(await providers[p](a.query, a.orientation, a));
    } catch (e) {
      info(`${p} failed for "${a.query}": ${e.message}`);
    }
  }
  candidates[a.file] = results.slice(0, 10);
  const pick = results[a.pick ?? 0];
  if (!pick) {
    info(`No safe result for "${a.query}" (${a.file}) — try a simpler query`);
    missing++;
    continue;
  }
  try {
    const raw = a.cutout ? dest.replace(/\.\w+$/, '.src.jpg') : dest;
    await download(pick.url, raw);
    if (a.cutout) {
      if (!cutout(raw, dest)) {
        fs.copyFileSync(raw, dest);
        info(`rembg not installed — ${a.file} kept as photo (use fgStyle "card")`);
      }
    }
    credits[a.file] = {query: a.query, ...pick};
    ok(`${a.file}  ←  ${pick.provider} · ${pick.author} · ${pick.license}`);
  } catch (e) {
    info(`Download failed for ${a.file}: ${e.message}`);
    missing++;
  }
}
writeJSON(creditsPath, credits);
writeJSON(candPath, candidates);
if (missing) {
  console.log(`\n${missing} asset(s) still missing.`);
  process.exit(3);
}
ok('All assets ready');
