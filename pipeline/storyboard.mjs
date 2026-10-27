// npm run board -- <episodeId>
// Builds the PLAN FILE (storyboard.html) you approve before the voice + render are made.
import fs from 'node:fs';
import path from 'node:path';
import {loadEpisode, readJSON, ok, ROOT} from './lib.mjs';

const id = process.argv[2];
const {dir, sb} = loadEpisode(id);
const credits = readJSON(path.join(dir, 'credits.json'), {});
const timing = readJSON(path.join(dir, 'timing.json'), null);
const music = readJSON(path.join(ROOT, 'public/music/library.json'), []).find((m) => m.file === sb.music?.file);
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);

const sceneFiles = (s) => [s.bg, s.mid, s.fg, s.fg2, s.logo, s.left?.image, s.right?.image, ...(s.images ?? [])].filter(Boolean);
const estWords = sb.lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
const dur = timing ? timing.duration : estWords * 0.38;

const thumb = (f) => {
  const exists = fs.existsSync(path.join(dir, f));
  const c = credits[f];
  return `<figure>${exists ? `<img src="${esc(f)}">` : `<div class="missing">missing</div>`}<figcaption>${esc(path.basename(f))}${
    c ? `<br><a href="${esc(c.page)}">${esc(c.provider)}</a> · ${esc(c.author)} · <b>${esc(c.license)}</b>` : ''
  }</figcaption></figure>`;
};

const frames = readJSON(path.join(dir, 'frames', 'frames.json'), null);
const beatTxt = (l) =>
  (l.beats ?? []).map((b) => (b.at < 0 ? `last ${-b.at} frames: ${b.do}` : `f${b.at}${b.len ? `–${b.at + b.len}` : ''} ${b.do}`)).join(', ');

const rows = sb.lines
  .map((l, i) => {
    const t = timing?.lines?.[i];
    const s = l.scene;
    const detail = Object.entries(s)
      .filter(([k]) => !['type', 'bg', 'mid', 'fg', 'fg2', 'logo', 'images', 'left', 'right', 'bars'].includes(k))
      .map(([k, v]) => `<code>${esc(k)}</code> ${esc(Array.isArray(v) ? v.join(', ') : v)}`)
      .join('<br>');
    const bars = s.bars ? s.bars.map((b) => `${esc(b.label)}: ${b.value}${esc(s.unit ?? '')}`).join(' · ') : '';
    const strip = (frames?.list ?? []).filter((f) => f.scene === l.id).map((f) => `<figure class="fr"><img src="${esc(f.file)}"><figcaption>f${f.frame} · ${esc(f.label)}</figcaption></figure>`).join('');
    return `<tr>
      <td class="n">${l.id}<div class="t">${t ? `${t.start.toFixed(1)}–${t.end.toFixed(1)}s` : ''}</div></td>
      <td>
        <div class="lbl">VOICE</div><div class="vo">${esc(l.text)}</div>${l.voice ? `<div class="say">spoken as: ${esc(l.voice)}</div>` : ''}
        ${l.visual ? `<div class="lbl">VISUAL</div><div>${esc(l.visual)}</div>` : ''}
        ${l.onScreen ? `<div class="lbl">ON-SCREEN TEXT</div><div>${esc(l.onScreen)}</div>` : ''}
        ${l.motionNotes ? `<div class="lbl">MOTION (frame by frame)</div><div>${esc(l.motionNotes)}</div>` : ''}
      </td>
      <td><span class="tag">${esc(s.type)}</span><div class="d">${detail}${bars ? `<br>${bars}` : ''}
        ${l.beats?.length ? `<br>🎬 ${esc(beatTxt(l))}` : ''}${l.fx?.length ? `<br>✨ ${esc(l.fx.join(', '))}` : ''}${l.sfx ? `<br>🔊 ${esc(l.sfx)}` : ''}</div></td>
      <td class="imgs">${sceneFiles(s).map(thumb).join('')}</td>
    </tr>${strip ? `<tr><td></td><td colspan="3"><div class="strip">${strip}</div></td></tr>` : ''}`;
  })
  .join('');

// Scene-wise script document (easy to read / print / share)
const md = [
  `# ${sb.title || sb.topic}`,
  `Channel: ${sb.channel} · Language: ${sb.language} · Episode: ${sb.id}`,
  sb.angle ? `\n**Angle:** ${sb.angle}` : '',
  '\n## Scene-wise script',
  ...sb.lines.map((l, i) => {
    const t = timing?.lines?.[i];
    return [
      `\n### Scene ${l.id} — ${l.scene.type}${t ? ` (${t.start.toFixed(1)}–${t.end.toFixed(1)}s)` : ''}`,
      `- **Voice:** ${l.text}`,
      l.visual ? `- **Visual:** ${l.visual}` : '',
      l.onScreen ? `- **On-screen text:** ${l.onScreen}` : '',
      l.motionNotes ? `- **Motion:** ${l.motionNotes}` : '',
      l.beats?.length ? `- **Frame beats:** ${beatTxt(l)}` : '',
      l.fx?.length ? `- **Effects:** ${l.fx.join(', ')}` : '',
      l.sfx ? `- **SFX:** ${l.sfx}` : '',
      `- **Assets:** ${sceneFiles(l.scene).map((f) => `${path.basename(f)} (${credits[f]?.license ?? 'pending'})`).join(', ')}`,
    ]
      .filter(Boolean)
      .join('\n');
  }),
  '\n## Facts & sources',
  ...(sb.facts ?? []).map((f) => `- ${f.claim} — ${[].concat(f.source).join(', ')}`),
  '\n## Upload',
  `**Title:** ${sb.upload?.title ?? ''}`,
  '',
  sb.upload?.description ?? '',
  '',
  (sb.upload?.hashtags ?? []).join(' '),
  Object.values(credits).some((c) => c.aiGenerated) ? '\n⚠ Contains AI-generated images — if any look like real events/people, tick "Altered or synthetic content" in YouTube Studio.' : '',
].join('\n');
fs.writeFileSync(path.join(dir, 'script.md'), md + '\n');

const facts = (sb.facts ?? [])
  .map((f) => `<li>${esc(f.claim)} — ${(Array.isArray(f.source) ? f.source : [f.source]).map((u) => `<a href="${esc(u)}">${esc(new URL(u).hostname)}</a>`).join(', ')}</li>`)
  .join('');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Storyboard · ${esc(sb.title || sb.topic)}</title>
<style>
:root{--bg:#f6f4ef;--card:#fff;--ink:#1b1a17;--mute:#6b665c;--line:#e3ded3;--acc:${sb.theme?.accent ?? '#E50914'}}
@media (prefers-color-scheme:dark){:root{--bg:#141310;--card:#1d1b17;--ink:#eee9df;--mute:#a39d90;--line:#2f2c26}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,"Noto Sans Devanagari",sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px 80px}
h1{font-size:28px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 10px;border-bottom:2px solid var(--acc);display:inline-block}
.meta{color:var(--mute)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.box{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px}
table{width:100%;border-collapse:collapse;background:var(--card);border-radius:10px;overflow:hidden}
td{border-top:1px solid var(--line);padding:12px;vertical-align:top}.n{font-weight:700;font-size:20px;width:60px}.lbl{font-size:10.5px;letter-spacing:.08em;color:var(--mute);margin-top:8px}.strip{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px}.fr{width:96px;flex:none}.fr img{width:96px;height:170px;object-fit:cover;border-radius:4px;display:block}
.t{font-size:12px;color:var(--mute);font-weight:400}.vo{font-size:19px;font-weight:600}.say{font-size:12px;color:var(--mute)}
.tag{background:var(--acc);color:#fff;border-radius:4px;padding:1px 8px;font-size:12px;text-transform:uppercase}
.d{font-size:13px;color:var(--mute);margin-top:6px}.imgs{display:flex;gap:8px;flex-wrap:wrap;width:360px}
figure{margin:0;width:110px}figure img,.missing{width:110px;height:150px;object-fit:cover;border-radius:6px;display:block;background:#0003}
.missing{display:grid;place-items:center;color:#c33;font-size:12px}figcaption{font-size:10.5px;color:var(--mute);word-break:break-word}
a{color:var(--acc)}pre{white-space:pre-wrap;background:var(--card);border:1px solid var(--line);padding:12px;border-radius:8px}
@media (max-width:760px){table,tbody,tr,td{display:block}.imgs{width:auto}}
</style></head><body><main>
<p class="meta">${esc(sb.channel)} · ${esc(sb.language)} · ${esc(sb.id)}</p>
<h1>${esc(sb.title || sb.topic)}</h1>
<div class="grid" style="margin-top:14px">
<div class="box"><b>Length</b><br>${dur.toFixed(1)}s ${timing ? '(from voice)' : '(estimate)'}</div>
<div class="box"><b>Scenes</b><br>${sb.lines.length}</div>
<div class="box"><b>Music</b><br>${music ? `${esc(music.title ?? music.file)} — ${esc(music.license ?? '')}` : esc(sb.music?.file || 'none')}</div>
<div class="box"><b>Voice</b><br>${fs.existsSync(path.join(dir, 'voice.mp3')) ? '<audio controls src="voice.mp3" style="width:100%"></audio>' : 'not generated yet'}</div>
</div>
${sb.angle ? `<h2>Angle</h2><p>${esc(sb.angle)}</p>` : ''}
<h2>Facts & sources</h2><ul>${facts || '<li>⚠ no facts listed</li>'}</ul>
<h2>Script & scenes</h2><table>${rows}</table>
<h2>Upload text</h2><pre>${esc(sb.upload?.title)}\n\n${esc(sb.upload?.description)}\n\n${esc((sb.upload?.hashtags ?? []).join(' '))}</pre>
<h2>Approve</h2><p>Reply <b>approved</b> to make the voice + render, or say what to change (line number, image, music).</p>
</main></body></html>`;

fs.writeFileSync(path.join(dir, 'storyboard.html'), html);
ok(`Plan file: public/episodes/${id}/storyboard.html  +  script.md (scene-wise script)`);
