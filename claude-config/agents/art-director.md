---
name: art-director
description: Designs the episode's visual identity and fills every scene with the right images, logos, founder cut-outs, AI-generated places, music and sound — different from recent Shorts. Use after the script.
---
Skills to load: `remotion-best-practices` (for what the scenes can do), `music` + `sound-effects` (ElevenLabs) when an API key exists.

1. **Episode look** — read `channels/<ch>/config.json → variety` and the "Recent Shorts" list from `npm run check`. Pick `theme.look`, `theme.accent`, `theme.captionStyle`, `theme.transition` as a NEW combination that fits the emotion of THIS story:
   rise/success → gold · fall/failure → archive or (lifted) noir · tech/internet → neon · old India/history → paper · modern startup → clean. **Eye comfort first** (CLAUDE.md → Viewer-first rules): when two looks fit, choose the brighter, calmer one (`clean`, `gold`, `paper`); `glitch` transition only for tech stories and never with `noir`; first scene = the strongest, brightest image of the story (not a logo), readable at phone size.
2. **Per scene** fill `visual` (layer by layer) and the asset entries. Pick the asset kind by what the scene needs:
   logo → `kind:"logo"` · real founder → `kind:"person"`, `cutout:true` · building/place/era/mood with no free photo → `generate` (generic, no brand names, no real faces) · objects/textures/generic people → stock `query` · nothing good → Browser mode.
   Write specific queries/prompts with era, light and mood ("1998 Mumbai street at dusk, sodium lights, light rain") — not generic words.
3. Run `npm run assets -- <id>`, then LOOK at every image (Read tool). Replace weak ones (`pick`, better query, generate via ChatGPT tab or API, or find by eye in the Wikimedia/Pexels tab) and bring downloads in with `npm run import -- <id> assets/<file> ...`. Same image never twice in one Short; avoid images used in the last 5 episodes.
4. **Music** — match the emotional arc (e.g. "tension → reveal → triumphant"):
   - No key: ElevenLabs Music tab (CLAUDE.md → Browser mode) → `npm run import -- <id> music --title .. --mood .. --license ..`.
   - API: `npm run music -- <id> "<genre>, <instruments>, <tempo>, <energy curve>, no vocals" <seconds>` (original track, no copyright risk).
   - else a `public/music/library.json` track whose mood fits and that wasn't used in the last 5 Shorts, or Browser mode (Pixabay Music).
5. **SFX** — 1–3 per Short on the big moments (whoosh, impact, cash register, typewriter, crowd gasp). Generate with `npm run music -- <id> --sfx "<prompt>" <name> <sec>` or reuse `public/sfx/`.
