# Art direction per topic (backdrop · captions · motion · when to leave vox)

`vox` is the base grammar (paper scenes, cut-outs with a marker outline, typewriter, counters, drawn charts). It is **no longer one fixed look**: every video gets its own direction from its topic, and individual scenes may step out of vox when the picture itself is the message.
Run **`npm run direct -- <id>`** after the scene script (it scores the story's own words, picks a preset, avoids the previous videos' combination, writes `theme` + per-line overrides). Review its printout; override any field by hand (hand-set line fields are never overwritten). Presets: `pipeline/directions.json`.

Episodes without `theme.direction` render exactly as before (nothing here changes them).

## 1. Presets (the topic decides)
| Preset | Story is about | Backdrop | Captions | Entrance | Camera | Accent |
|---|---|---|---|---|---|---|
| `explainer` | neutral business explainer | paper · concrete | highlight · paper | whip · slide | punchy | orange / amber |
| `drama` | collapse, scandal, failure, a decision that backfired | concrete · newsprint | **cinema** · paper | rise · wipe | cinematic | red |
| `comeback` | growth, revival, records, hope | **sunrise** · paper | paper · highlight | slide · whip | punchy | orange / gold |
| `turnaround` (long only) | a full arc: heritage → rise → near-death → recovery | per chapter (below) | paper (cinema in the downfall chapter) | slide · rise | cinematic | burnt orange |
| `tech` | software, hardware, internet | **blueprint** · paper | karaoke · outline | whip · zoom | punchy | blue |
| `heritage` | old companies, history, craft | **newsprint** · paper | cinema · paper | rise · wipe | calm | brown / rust |
| `finance` | money, markets, valuations | concrete · paper | paper · karaoke | slide · whip | punchy | green |
| `mind` (psych) | studies, effects, behaviour | **dots** · paper | pop · karaoke | zoom · slide | calm | purple |
| `calm` | health, nature, gentle explainers | **sage** · paper | paper · cinema | slide · rise | calm | green |
`turnaround` chapter backdrops: open newsprint · idea newsprint · rise paper · downfall **concrete** · recovery **sunrise** · today paper. The mood shifts with the story.
The first listed option is preferred; `direct` takes the second if the first matches the previous video (same backdrop / captions / entrance / accent are avoided across the last 2–3 videos).

## 2. When to use vox, and when NOT to
- **Vox scene** (flat paper, cut-out, headline): explaining, comparing, listing, definitions, a person or object portrait, anything where text + one object carries the idea. This is most scenes.
- **Data scene** (`counter`, `line`, `timeline`): any hard number or sequence of dates. Never put numbers on a film scene.
- **Film scene** (a `collage` / `stack` / `versus` scene over a full-bleed picture; in a directed vox video it automatically gets a documentary grade, vignette and grain, white captions): the emotional peak (closure, collapse, a death, a war), an establishing place or era, the cold-open image, the last "loop" image. Backgrounds = a generic AI place/mood image (ChatGPT tab, no brand names, no real faces) or a licensed Wikimedia/Pexels photo; never news photos.
  Budget: Shorts ≈ 1 film scene (max ~15–30 % of scenes, per preset `filmBudget`); long ≈ at most 1 per chapter, never two in a row, never in the opening hook scene unless that image IS the hook.
- **Strip the decoration** when the picture is the message: a film scene gets a ≤ 3-word headline or none; a typewriter quote that types out the narration gets `captions: "off"` (the tool does this automatically at ≥ 70 % word overlap).
- Don't mix more than two scene "families" in a row; the progress bar and the captions stay constant so the video still feels like one film.

## 3. Captions (decided per topic, overridable per line)
`highlight` (white + yellow active word, the classic) · `paper` (cream strip, ink text, accent underline: best on light vox backdrops) · `cinema` (calm tracked type, ink on light scenes, white on film scenes: serious / historical) · `karaoke` (words fill with the accent: tech, finance) · `outline` · `pop` (one big word at a time, Shorts only) · `boxed`.
Per line: `"captions": "off" | "<style>"`. Use `off` for typewriter quotes and for a 2-second pause where a counter/number carries the line; restyle a whole chapter by setting it on its lines (the `turnaround` preset does this for the downfall chapter). Never hide captions for longer than ~6 s.

## 4. Motion (decided per topic, overridable per scene)
`theme.motion` = `calm` (drift/pull, slide/rise/wipe entrances) · `punchy` (push/pans, whip/zoom/slide) · `cinematic` (slow push + drift, zoom/rise/wipe). Cameras and entrances then rotate automatically across scenes; the hook scene always starts with a hard cut (no entrance). A scene's own `motion`, a line's `enter` and your `beats` always win.
New entrances: `slide` (glide in from the right), `rise` (lift from below), `wipe` (clean left-to-right reveal). Flash/shake rules are unchanged (max 1 per Short, 1 per chapter).

## 5. Per-scene overrides (line fields)
`look: "vox" | "film" | "clean"` · `backdrop: "<name>"` · `captions: "off" | "<style>"` · `enter: "<transition>"`. Backdrops: `paper · blueprint · sunrise · concrete · newsprint · dots · sage` (all light, so ink headlines stay readable).

## 6. Checklist before frames
1. `npm run direct -- <id>` and read the printout (preset, previous combination, film budget).
2. Make sure each film scene has a real `bg` image (assets entry).
3. `npm run check -- <id>` → `npm run frames -- <id>` → look at one frame per backdrop and every film scene (caption readable? headline not on the caption band?).
