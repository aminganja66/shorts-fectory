// Variety guard: makes sure no two Shorts in a row feel like the same template.
// Used by `npm run check` and stored in history.json when an episode is rendered.
import fs from 'node:fs';
import path from 'node:path';
import {chDir, epDir, readJSON} from './lib.mjs';

export const signature = (sb) => ({
  look: sb.theme?.look,
  captionStyle: sb.theme?.captionStyle,
  transition: sb.theme?.transition,
  accent: sb.theme?.accent,
  hookType: sb.hookType,
  music: sb.music?.file || null,
  scenes: sb.lines.map((l) => l.scene.type),
  motions: sb.lines.map((l) => l.scene.motion).filter(Boolean),
});

// Previous episodes of the same channel, newest first (excluding this one)
const previous = (sb, n = 6) =>
  readJSON(path.join(chDir(sb.channel), 'history.json'), [])
    .filter((h) => h.episodeId !== sb.id && h.status !== 'dropped')
    .reverse()
    .map((h) => {
      if (h.signature) return {...h.signature, id: h.episodeId};
      const p = path.join(epDir(h.episodeId), 'storyboard.json');
      return fs.existsSync(p) ? {...signature(readJSON(p)), id: h.episodeId} : null;
    })
    .filter((x) => x && x.scenes?.length)
    .slice(0, n);

const lockedLook = (sb) => {
  try {
    return readJSON(path.join(chDir(sb.channel), 'config.json'), {}).variety?.lockLook;
  } catch {
    return undefined;
  }
};

export const varietyCheck = (sb) => {
  const problems = [];
  const warn = [];
  // A language edition of an existing Short (storyboard.variantOf = <episode id>) intentionally reuses its look/music/scenes.
  if (sb.variantOf) return {problems, warn, recent: [`(language edition of ${sb.variantOf}: variety rules skipped)`]};
  const me = signature(sb);
  for (const k of ['look', 'captionStyle', 'transition', 'hookType']) if (!me[k]) problems.push(`variety: set ${k === 'hookType' ? 'hookType' : `theme.${k}`} (pick one different from recent episodes)`);
  const prev = previous(sb);
  const last = prev[0];
  const locked = lockedLook(sb) && lockedLook(sb) === me.look; // house style: same look every time on purpose
  if (last) {
    if (!locked && me.look && me.look === last.look) problems.push(`variety: look "${me.look}" was used in the previous Short (${last.id})`);
    if (me.hookType && prev.slice(0, 2).some((p) => p.hookType === me.hookType)) problems.push(`variety: hookType "${me.hookType}" used in the last 2 Shorts`);
    if (!locked && prev.slice(0, 3).some((p) => p.captionStyle === me.captionStyle && p.transition === me.transition))
      problems.push(`variety: caption style + transition "${me.captionStyle}/${me.transition}" repeats one of the last 3 Shorts`);
    if (me.music && prev.slice(0, 5).some((p) => p.music === me.music)) problems.push(`variety: music "${me.music}" used in the last 5 Shorts`);
    const head = me.scenes.slice(0, 3).join('>');
    const twin = prev.slice(0, 5).find((p) => p.scenes.slice(0, 3).join('>') === head);
    if (twin) problems.push(`variety: opening scene order ${head} is the same as ${twin.id}`);
    if (me.accent && me.accent === last.accent) warn.push('variety: same accent colour as the previous Short');
    if (!locked && prev.slice(0, 3).filter((p) => p.look === me.look).length >= 1) warn.push(`variety: look "${me.look}" appeared in the last 3 Shorts`);
  }
  return {problems, warn, recent: prev.map((p) => `${p.id}: ${p.look}/${p.captionStyle}/${p.transition}/${p.hookType} · ${p.scenes.join('>')}`)};
};
