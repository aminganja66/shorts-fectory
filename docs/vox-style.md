# Vox-style explainer look (reference: MoSidd, "I Made Vox-Style Motion Graphics Using Only Claude Code & Remotion")

Analysed from https://www.youtube.com/watch?v=7wuYBfE131U (frames of the finished explainer 0:00–0:50 + the planning/building chapters).
This is the house grammar for every video: `theme.look = "vox"`. Since the art-direction update the background, caption style, entrances and camera are chosen per topic (`npm run direct`, docs/direction-guide.md); the paper-grid described below is the `paper` backdrop, the default.

## What the finished piece looks like
- **One locked background**: warm grey paper with a faint square grid + grain. Never changes between scenes, so ten scenes feel like one film.
- **Cut-out layers with a signature look**:
  - B&W **halftone / newsprint-dot** portraits of people, with a hand-drawn **marker outline** (orange/red) and a flat offset shadow.
  - Flat editorial **vector-style illustrations** (a building facade, an oil barrel, an isometric map) with a clean outline and a soft warm shadow.
  - Objects that fall/slide in: tanker on looping waves, rotating dollar bill, hard hats and tools stacked in the foreground.
- **Layer model per beat**: Background (locked) → Midground (the subject, enters with the marker stroke) → Foreground (occludes the lower part, anchors the shot) → Headline.
- **Type**: one heavy condensed display face for headlines (black, uppercase, with a short accent underline), a **typewriter** mono face for quotes, small sub-lines.
- **Data**: charts that **draw themselves** on a cream card (orange line + grey "previous trend", a white callout bubble with a bold number), **counters** that count up ("$39 TRILLION"), typographic scenes built in code (op-ed page, typewriter punchline).
- **One accent colour** (orange) + black ink + paper. A thin **orange progress bar** runs along the bottom the whole video.
- **Editing**: hard cuts and slide-outs that land ON the word; every beat is a layer-and-prompt sheet (background / midground asset / foreground asset / prompts / cut type).
- Voiceover + one calm synth track; captions are minimal because the picture carries the story.

## How he made it (and how we do it without Magnific / Higgsfield)
| He used | Purpose | We use instead (free) |
|---|---|---|
| Higgsfield connector | generate the cut-out illustrations/portraits | **ChatGPT tab** image generation with the prompt recipes below, then `rembg` (already installed) to get a transparent PNG |
| Magnific connector | upscale / enhance those images | `npm run import … --upscale` (ffmpeg Lanczos 2× + sharpen); optional Real-ESRGAN later |
| Photoshop paper texture | locked background | drawn in code (`VoxBg`) — no file needed |
| Halftone / marker stroke made in an image tool | signature cut-out look | done at render time in code (`Cut`: halftone dots + marker outline) — any transparent PNG works |
| Looping ocean / video clips | motion inside a scene | free stock video (Pexels/Pixabay) or a still with slow push |
| Remotion + Claude Code | everything else | same |

## Asset prompt recipes (ChatGPT tab → `npm run import -- <id> assets/<name>.png --ai` with `"cutout": true` in assets[])
- **Person portrait (halftone)**: "High-contrast black-and-white newsprint portrait of a generic <role>, chest-up, bold halftone dot texture, plain white background, sharp edges, no text". NEVER a real named person's face: use a generic/back-view figure, or a licensed Wikimedia photo (`kind: person`, cutout) when the story is about a real person.
- **Building / place**: "Flat front-on editorial illustration of <generic building type>, clean vector style, warm soft shadow, plain white background, no text, no logos".
- **Object / icon**: "Flat isometric illustration of <object>, marigold and warm black, bold outline, plain white background, no text".
- **Prop for the foreground**: "<hard hat / tools / cash stack / documents> flat illustration, plain white background".
- Always ask for a **plain white background** (rembg removes it cleanly), square or 2:3, no text, no logos. Save as `.png` (cut-outs must be PNG).

## Scene types for this look (src/scenes/Vox.tsx)
`vox` (headline + mid/mid2 cut-outs + fg anchor, `halftone`, marker `stroke`), `typewriter` (typed quote, optional rising prop), `counter` (big number counting up + label + icon), `line` (self-drawing line chart + callout). Existing `chart` (bars) and `end` still work; `end`/`kinetic` get the paper background by omitting `bg` only on non-vox looks — for vox prefer `vox`/`typewriter` as the closing scene.

## Rules that make it look professional
1. Lock the visual system once (paper, one display font, one accent, marker stroke on every cut-out).
2. One idea per beat; the cut lands on the word (beats synced via `timing.json`).
3. Never show a real person's AI-generated face. Logos only as they are (Wikimedia).
4. Max 4–5 words of headline per beat; numbers are big.
