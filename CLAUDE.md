# Shorts Factory — rules for Claude Code

Two **English-only** YouTube Shorts channels, made with Remotion. Owner: Amin (uploads to YouTube himself — never use the YouTube API or log in to YouTube; opening a public video page in Chrome to study it is fine).

**Language: English only, from now on.** Scripts, captions, on-screen text, titles, descriptions, hashtags, topics and backlog are all English; the voice is an English ElevenLabs voice. (Older Hindi episodes stay as they are.)
**House grammar: `vox`** (docs/vox-style.md) — paper backgrounds, halftone cut-outs with a marker outline, self-drawing charts, typewriter text, counters, progress bar — **art-directed per topic** (backdrop, caption style, entrances, camera, and when a scene should leave vox): see "Art direction" below. We have NO Magnific / Higgsfield: images come from the ChatGPT tab → `rembg` → free ffmpeg upscale (see "Vox assets").

- `brand` — business & brand stories (Netflix vs Blockbuster style)
- `psych` — psychology effects explained with real studies

## The one-click flow (`/short <brand|psych> [auto] [browser] [retry]`)
`retry` = make the SAME topic again as a new version (`npm run new -- <ch> "<topic>" "<kw>" --retry` → id `...-v2`, `npm run history -- check ... --retry`) so Amin can compare old vs new. Everything below still applies; variety rules force a different look than the previous Short.
1. **Sync**: `git pull --rebase`. Never skip — the other laptop may have used a topic.
2. **Pick topic**: read `channels/<ch>/history.json` + `backlog.md`. Take the first backlog idea not in history. Run `npm run history -- check <ch> "<topic>" "<kw>"` (exit 2 = duplicate → next idea). Prefer ideas with a twist + a hard number.
3. **Claim**: `npm run new -- <ch> "<topic>" "<keywords>"` then `git add channels public/episodes/<id>/storyboard.json && git commit -m "claim: <topic>" && git push` (this locks the topic for the other laptop).
4. **Research**: WebSearch/WebFetch. Minimum 3 facts, each with a source URL from a reliable outlet (company filings/press releases, Reuters, BBC, Fortune, Economic Times, Mint, the original study/paper for psych). If sources disagree, use the conservative number or drop it. Never invent quotes, numbers, dates, or study results.
5. **Script** (`lines[].text`, English): follow `channels/<ch>/config.json` → `structure` + `style`. **Length follows the story** — pick a tier from `channels/<ch>/config.json → length.tiers` and set `storyboard.length` (+ `lengthReason` if not quick):
   | Tier | When | Lines | Seconds | Max words | `check` fails over |
   |---|---|---|---|---|---|
   | `quick` (default) | one twist, one hard number | 6–8 | 30–42 | 75 | 48 s |
   | `story` | setup + turn + result, 4+ facts that each matter | 8–10 | 43–58 | 110 | 62 s |
   | `deep` | a real chain of events, 5+ facts, several turns | 10–13 | 58–85 | 160 | 90 s |
   Never pad to reach a tier. Longer tiers must re-hook in the middle third (a line that opens a new question: "But…", "Then…", a `?`) and change the visual every 2–4 s (skill `short-form-video`). Real narration ≈ 0.45 s/word + 1.1 s per line — cut words, never speed the voice up. **Hook = the viewer test below**, ≤ 12 words; write 3 candidates into `storyboard.hookCandidates` and use the best as line 1. Then humanize (see below). Then run **`npm run spoken -- <id>`**: it writes `lines[].voice` with the natural spoken English for every number/symbol (see "Spoken form"); read those voice lines once.
6. **Scene script + motion spec** — for EVERY line fill: `visual` (what we see, layer by layer: background / middle / foreground / logo), `onScreen` (on-screen text), `motionNotes` (frame-by-frame choreography in words), `beats` (frame-exact camera moments), `fx` (atmosphere), `sfx`. See "Motion grammar" below.
   **Scenes** (`lines[].scene`): for the vox look use `vox | typewriter | counter | line` (+ `chart`/`end` if they fit); `collage | kinetic | versus | stack` are the full-bleed "film" scenes (see `src/types.ts`, `src/scenes/Vox.tsx`, and "Art direction": use them only at emotional peaks, not as the default). Follow `sceneMix`. Vary motions (push, pull, pan-left, pan-right, drift) — or let `theme.motion` rotate them.
   **Then run `npm run direct -- <id>`** (art direction from the topic, see below) before assets/frames. Reference storyboards: `public/episodes/2026-10-27-netflix-vs-blockbuster/storyboard.json` (brand) and `docs/examples/psych-zeigarnik.storyboard.json` (psych). Copy their shape, never their wording.
7. **Assets** (`storyboard.assets[]`): one entry per file. Kinds (details in `pipeline/fetch-assets.mjs` header):
   - **Brand logos** → `"kind":"logo"` (Wikimedia Commons; most wordmark logos are public-domain text logos). Logos are fine to *show* for identification/commentary; never alter them to look like an ad, never generate a logo with AI.
   - **Real founders / CEOs** → `"kind":"person"` + `"cutout":true` (Wikimedia Commons photos, CC0/PD/CC BY; set `"allowShareAlike":true` to also allow CC BY-SA — attribution goes in the description automatically). If no free photo exists, show a silhouette/back-view stock person or AI "man in suit, back view" instead. **Never AI-generate a real, named person's face.**
   - **Buildings, places, historical moments, moods** → `"generate": "<prompt>"` (OpenAI Images, photoreal documentary style from `imageStyle`). Generic places only ("2000-era video rental superstore"), no brand names/logos in the prompt.
   - **Generic stock** (objects, textures, cities, people) → `"query"` (Pexels, Pixabay, Openverse, Wikimedia).
   - **Something Amin found himself** → `"from": "~/Downloads/file.jpg"` + `license` + `page`.
   - **Vox assets (no paid tools)**: cut-outs are TRANSPARENT PNGs. Generate in the ChatGPT tab with the recipes in docs/vox-style.md (plain white background, no text/logos, flat editorial / halftone style), set `"cutout": true` on the asset entry (file must end in `.png`) and run `npm run import -- <id> assets/<name>.png --ai` → rembg removes the background and images under 1200 px are upscaled 2× with ffmpeg (`--upscale` forces it). The halftone dots and marker outline are added at render time by the `vox` scene (`halftone`, `stroke`), so any clean PNG works. Never AI-generate a real named person's face.
- Run `npm run assets -- <id>`. If missing, simplify the query and re-run with `--only <file>`. Look at the images (Read tool) — if a stock pick is weak, set `"pick": n` from `assets/candidates.json` and `--force --only <file>`.
   - NEVER: Google Images, Getty/AP/Reuters/news photos, movie stills, TV/news footage, other creators' videos.
8. **Music + SFX** (art-director) — **NOTHING is generated; ElevenLabs is for the voice-over only.** Music: `npm run music -- <id> <mood words>` picks a track from `public/music/library.json` not used in the last 5 Shorts (`--list` shows the ranking; new tracks only via `npm run import -- <id> music ...`). SFX: from the local library (`library/`, catalogued in `index/index.json`, raw drop folder `_inbox/`): `npm run sfx -- search "<words>" [--cat whoosh] [--max 3]` → `npm run sfx -- use <id> <libraryId> --line N [--at sec]` (copies to `public/sfx/`, sets `lines[N-1].sfx`). **Animation sounds are automatic** (`src/Short.tsx → autoSfx`, files `public/sfx/anim-type|anim-tick|anim-whoosh.mp3`, from the library): typing clicks on every `typewriter` scene, ticks on every `counter`, a whoosh on each scene change; `storyboard.autoSfx:false` silences them. Add hand-picked accents (reveal sting, impact, cash) with `npm run sfx` on top. Never call the ElevenLabs Music / Sound-effects tabs or APIs.
9. **Check + plan file**: `npm run check -- <id>` (fix every ✖) → `npm run frames -- <id>` (renders key frames of every scene/beat) → **look at the frames yourself** (Read tool on `public/episodes/<id>/frames/*.jpg`) and fix anything ugly: text overlapping captions (captions live at y≈1230–1400), faces cut off, logo on top of headline, empty frames → re-run frames → `npm run board -- <id>` (writes `storyboard.html` with filmstrip + `script.md`) → `npm run render -- <id> --draft` (silent animatic).
10. **STOP for approval** unless the argument was `auto`. Tell Amin: topic, hook line, length, and the path of `storyboard.html` + `exports/<id>/draft.mp4`.
11. **Voice**: key set → `npm run voice -- <id>`. No key → ElevenLabs tab (Browser mode, exact recipe in the table) → `npm run import -- <id> voice` → `npm run timing -- <id>` (now `align.mjs`: finds the real pauses, no Whisper). Read the printed line table: every line must start after a clear pause; ⚠ lines = re-generate or tell Amin. No ElevenLabs at all → `npm run voice:local -- <id>` (Kokoro) or Amin records `voice.m4a` → `npm run timing -- <id> voice.m4a`.
12. **Re-sync beats to the real voice**: read `timing.json`, move each beat onto its key word, then `npm run frames -- <id>` and look again. Then the **Studio preview gate** (below) — wait for Amin's "render".
    **Render**: `npm run render -- <id>` → `exports/<id>/short.mp4`, `thumbnail.jpg`, `upload.txt`. Look at 3–4 stills (`npx remotion still ... --frame=N`) to verify nothing is broken.
13. **Save**: `git add channels public/episodes/<id>/{storyboard.json,timing.json,credits.json,voice.mp3} && git commit -m "rendered: <topic>" && git push`.
14. Report in 3 lines: file paths, length, anything Amin should double-check.

After Amin uploads: `npm run history -- published <id> <youtube-url>` (keeps stats for choosing future topics).

## Viewer-first rules (Amin's feedback on the first Short: "no hook, not eye-comfortable, robotic, subtitles drift")
**Hook (first 3 seconds decide everything).** After hearing line 1 the viewer must be thinking "क्यों? किसे? क्या हुआ?" and be unable to guess the answer. So line 1 is an OPEN QUESTION (ends with `?`): set up a big stake in 5–6 words, then ask the question with the KEY NOUN WITHHELD (who / what / why). Line 2 gives the answer and immediately opens the next question (tease → answer → deeper why). Plain spoken English, ≤ 12 words. Never state the answer in line 1 ("…and it still said no to Android" gives it away = weak). NOT a bare statistic ("In 2007 Nokia had 49.4% share…"), NOT a date-drop that needs context. Pattern: *stake + withheld question* — "Nokia once sold every second smartphone. So what did it turn down?" (line 2: "Android. …") · "Blockbuster could have bought Netflix for $50 million. What did it say?" · "One phone ended Nokia's reign. Which one?". Don't promise what the video doesn't deliver; the answer must be real and verified. The on-screen headline of scene 1 is the same question, big, with the `?`. Test: would you stop scrolling if a friend said this? Show the strongest image + a 2–4 word headline from frame 0 (no logo-only opening). The payoff of the hook must come before the end.
**Spoken form** (`lines[].voice`, made by `npm run spoken -- <id>` from `pipeline/spoken.mjs`; self-test `npm run spoken:test`): captions keep the written digits, the narrator says what a person would say — and each KIND of number is read differently:
| Kind | Written | Spoken |
|---|---|---|
| year | 1927 · 2007 · 2011 · 2025 | nineteen twenty-seven · two thousand seven · twenty eleven · twenty twenty-five |
| decade | the 1990s · '90s · 2000s | the nineteen nineties · nineties · two thousands |
| year range | 2007–2013 | two thousand seven to twenty thirteen |
| money | $116 · $39 trillion · €5.44B · $5.44 · ₹1,000 crore | one hundred sixteen dollars · thirty-nine trillion dollars · five point four four billion euros · five dollars and forty-four cents · one thousand crore rupees |
| money as adjective | a $50 million offer | a fifty million dollar offer (singular) |
| percent | 49.4% · +4.2% · 40–50% | forty-nine point four percent · plus four point two percent · forty to fifty percent |
| date | February 11, 2011 · 11 Feb | February eleventh, twenty eleven · the eleventh of February |
| time | 3:30 PM · 9am · at 14:05 | three thirty P M · nine A M · at two oh five |
| quarter / fiscal | Q3 2011 · FY24 | Q three of twenty eleven · F Y twenty-four |
| ordinal | 3rd · 21st | third · twenty-first |
| multiplier / suffix | 10x · 5M · 3.2bn | ten times · five million · three point two billion |
| units | 5km · 512GB · 40°C · 100 mph | five kilometers · five hundred twelve gigabytes · forty degrees Celsius · one hundred miles per hour |
| ratio / rank / symbols | 3:1 · #1 · & · vs. · ~ | three to one · number one · and · versus · about |
| plain count | 9,000 stores · 2000 employees · 8.7 million | nine thousand stores · two thousand employees · eight point seven million |
A 4-digit number is read as a YEAR unless a count noun follows ("2000 employees") or a quantity word precedes it ("about 2000", "more than 1500"). If a line sounds wrong, reword it or hand-edit `voice` (the tool never overwrites a hand-written `voice` unless `--force`).
**One idea per line, one sentence per line where possible.** The narrator pauses ≈ 1 s between lines (`<break time="0.8s" />` → real gap ≈ 1.0 s; sentences inside a line get `0.3s`); a line that runs on or merges two thoughts sounds mixed up and breaks caption sync.
**Natural voice.** English storyteller voice (brand: Jon, psych: Ellis — see config), speed 1.0, stability ≈ 0.5, style ≤ 0.2. Intense/dramatic voices and fast speeds sound acted/robotic. If a take sounds robotic, change the voice name in `channels/<ch>/config.json` (alternatives listed) before spending credits again.
**Eye comfort.** Subject bright and readable, soft grain only, no scanlines/flicker stacks, no full-black frames. Flash/shake only on THE one big moment (max 1 per Short), `glitch` transition only for tech stories, never with `noir`. House look is `vox` (bright paper, one accent). Other looks only if Amin asks. Max 1 fx per scene, calm scenes between loud ones, text ≥ 90 px, high contrast.
**Captions in sync.** `npm run timing` aligns to real pauses. After import, read its line table; if any line starts mid-sentence or a ⚠ shows, fix the voice (longer break), not the captions.

## Art direction (every video is directed from its topic; vox is the grammar, not one fixed look)
After the scene script run **`npm run direct -- <id>`** (Shorts and long). It scores the story's words against the presets in `pipeline/directions.json`, picks one (drama · comeback · turnaround · tech · heritage · finance · mind · calm · explainer), avoids the previous videos' backdrop/captions/entrance/accent, and writes `theme.backdrop`, `captionStyle`, `transition`, `motion`, `accent`, `direction` + per-line `backdrop` / `captions` (long `turnaround`: the backdrop changes per chapter). Read its printout and override by hand when your judgement differs (`--preset <name>` forces one). Full playbook: **docs/direction-guide.md**.
- **Vox vs not**: explaining, comparing, portraits and every number stay on vox scenes. Use a *film* scene (`collage` over a full-bleed AI-place/photo background; graded, vignetted, white captions automatically) only for an emotional peak, an establishing place/era, the cold-open image or the loop image — budget per preset (Shorts ≈ 1, long ≤ 1 per chapter, never two in a row, never numbers). Strip decoration when the picture is the message.
- **Per-line overrides**: `look` (`vox|film|clean`), `backdrop`, `captions` (`off` or a style), `enter`. Backdrops are all light so ink headlines stay readable: paper · blueprint · sunrise · concrete · newsprint · dots · sage.
- **Captions** by mood: `paper`/`highlight` default, `cinema` serious/historic, `karaoke` tech/finance, `pop` (Shorts only) psychology. `captions:"off"` only for a typewriter quote that types out the narration (auto) or a short pause, never 3+ lines in a row.
- **Motion** by mood: `calm` · `punchy` · `cinematic` rotate camera moves and entrances (`slide`, `rise`, `wipe`, `whip`, `zoom`) across scenes; the hook scene starts on a hard cut. `npm run check` validates all of it (✖ invalid names, ⚠ film budget / numbers on film scenes / captions off too long). Episodes without `theme.direction` render exactly as before.

## Studio preview gate (every video, before the final render)
First set the `Short` (or `Long`) composition's `defaultProps.episodeId` in `src/Root.tsx` to THIS episode id, otherwise Studio shows an older video. After the voice + beat re-sync and BEFORE `npm run render` (Short: composition `Short`; long: `Long`): run `npm run studio` in the background (http://localhost:3000), tell Amin the episode id + where to look, and STOP until he says "render". He may edit `storyboard.json` or the Studio props panel (hot-reload); apply his change requests, re-run `npm run check -- <id>`, then render. This applies even with `auto`.

## Long videos (`/long brand [auto] [browser] [topic]`)
16:9 documentaries, **8–12 min**, brand channel only (`channels/brand/config.json → long`). Full flow: `.claude/commands/long.md`.
- **Arc** (`storyboard.chapters`, every line has `chapter`): `open` cold open (the most dramatic moment + an open question, 20–35 s) → `idea` how it started / the spark → `rise` how it won → `downfall` what broke → `recovery` the comeback (or the fight to survive — be honest) → `today` latest verified numbers, loop to the cold open, one question. No lessons/morals.
- **Size**: 80–120 lines, 950–1450 words, 12+ sourced facts (`facts[].chapter`, ≥ 2 per chapter). `npm run check` fails under 8 min or over 13 min estimated.
- **Retention**: each chapter opens with a `chapter` title-card scene and ends on a pull into the next; a re-hook ("But…", a question) every 60–90 s; one line = one scene (visual change every 4–8 s); max 1 flash/shake per chapter.
- **Scenes**: `chapter` (CHAPTER N pill + title + sub + optional icon), `timeline` (`events:[{year,label}]`, `highlight`), plus `vox | counter | line | typewriter` — all auto-laid-out for 16:9 (headline column left, visuals right, captions in the lower third y ≈ 880–1010, chapter tag top-left, chapter ticks on the progress bar).
- **Voice**: `npm run tts-text` splits into parts ≤ 4500 chars (ElevenLabs limit) → `npm run import -- <id> voice --part N` per take → joined into voice.mp3 → `npm run timing`. With a key: `npm run voice` does all parts.
- **Render**: chapter by chapter, resumable (`npm run render -- <id>`, or `--chapter N`), ≈ 0.8 s/frame → ~4 h for 10 min. upload.txt gets YouTube CHAPTERS timestamps. History: long videos are their own series (`--long`), so a long video about a company we made a Short on is not a duplicate.

## Humanize (every script, before assets)
Use the installed `humanizer` skill (English) plus these rules:
- Write how a smart friend tells a story, not a news anchor or a textbook. Contractions are good ("didn't", "it's").
- Mix sentence lengths. Some 3–4 word punches. One rhetorical question max after the hook.
- Ban list: "Today we're going to talk about", "Did you know" (as opener), "fascinating", "game-changer", "in conclusion", "let's dive in", "it's not X, it's Y" reveals, em-dash chains, three-adjective lists, moral lectures.
- Specific > vague: a year, a number, a place, a name in every 1–2 lines.
- End on a line that loops to the hook or provokes a comment — not a lesson.
- Read it aloud at 1.05×. If a line can't be said in one breath, split it.

## Don't
- Don't repeat a topic or the same company within 30 days (history check).
- Don't use the same scene type 3 times in a row, or the same music twice in a row.
- No medical/diagnostic claims (psych), no investment advice (brand), no defamation — say "reportedly" / "according to …" when a claim is reported, not proven.
- Don't commit `.env`, `exports/`, `public/episodes/*/assets/` (re-downloadable from credits.json).

## Motion grammar (frame-wise animation — 30 fps, frame 0 = start of the scene)
- Every scene already has a soft entrance (frames 0–8, gentle push + light blur, barely any flash). Don't add another.
- `beats`: `{"at": 24, "do": "punch"}` · `do` = `zoom-through` (dive into the image, motion-blurred; use `"at": -12` = last 12 frames to dive into the next scene) · `punch` (quick 12% push on a key word) · `shake` (impact, 8–10 frames) · `flash` (white hit) · `whip-out` (fast exit left) · `blur-in`.
- `sfxAt` (line field, seconds after scene start, default 0): delays the `sfx` so it lands on the key word (= word.start − line.start), e.g. the hit on "bankruptcy".
- Put beats ON the word that matters: find the word's time in `timing.json` (after the voice exists) → frame = (word.start − scene.start) × 30. Before the voice exists, estimate 0.38 s per word.
- `fx`: `smoke` (rising haze — failures, mystery, endings), `embers` (destruction, bankruptcy, fights), `dust` (old times, history), `lightleak` (success, money, nostalgia), `glitch` (internet, tech, digital).
- Max 2 beats + 1–2 fx per scene (comfort: 1 is better). `flash`/`shake` at most ONCE per Short on the biggest reveal. Calm scenes make loud scenes hit harder.
- Layering like the reference reel: background (place) → middle (building/object) → foreground cut-out (person) → logo → headline. Each layer drifts at its own speed; cut-outs "boil" (stop-motion jitter) automatically.
- Editing a scene precisely: open Remotion Studio (`npm run studio`), read the frame number in the timeline, and change `beats`/scene values in storyboard.json — the Studio hot-reloads.

## Team: agents + skills (installed by `npm run setup` into .claude/)
| Step | Agent (`.claude/agents/`) | Skills it loads (`.claude/skills/`) |
|---|---|---|
| 1–3 topic | `topic-scout` | content-strategy, marketing-psychology (psych) |
| 4 research | `researcher` | — |
| 5 script | `scriptwriter` | social, short-form-video, copywriting, copy-editing, humanizer, marketing-psychology (psych); long videos: youtube-scriptwriting |
| 6–8 look + direction, assets, music, sfx | `art-director` (runs `npm run direct`) | remotion-best-practices, music, sound-effects |
| 6, 9, 12 scenes, beats, frames | `motion-director` | remotion-best-practices, remotion-markup, remotion-captions, remotion-render, remotion-studio |
| 9, 12 final gate | `qa-editor` | — |
| 11 voice | you (main) | text-to-speech, speech-to-text (ElevenLabs) |
Run the agents in this order and pass each one the episode id. The main session only orchestrates, syncs git and talks to Amin.
ElevenLabs skills: use our scripts (`npm run voice`, `npm run music`) — do NOT install the ElevenLabs CLI or Python SDK.

## Variety (so the channel never looks templated)
The `vox` look is LOCKED on purpose (`variety.lockLook` in the channel config): look, caption style and transition may repeat. Everything else still varies — enforced by `npm run check` (✖ = must change):
- (other looks only) `theme.look` (archive · noir · neon · paper · gold · clean) ≠ previous Short
- `hookType` not used in the last 2 Shorts
- `theme.captionStyle` + `theme.transition` combo not in the last 3
- first 3 scene types not identical to any of the last 5
- music track not reused within 5 Shorts (`npm run music` already skips recent ones)
Choose by the story's emotion, not at random (see `channels/<ch>/config.json → variety.rule`).

## Browser mode = DEFAULT when a key is missing (Claude Code started with `claude --chrome`)
Amin keeps these tabs logged in (voice-over is the only ElevenLabs use; music + SFX come from the local library, see step 8) inside Claude's Chrome tab group. You operate them, download the result, then run `npm run import` — it grabs the newest file from ~/Downloads and puts it in the right place with its licence.
Before each generation/download say in one line what you're doing. Never type passwords, never change account settings or plans, never buy anything, never open YouTube Studio. Max 2 generations per item (credits).

| Need | Tab | What to do | Then |
|---|---|---|---|
| **Voiceover** | elevenlabs.io/app/speech-synthesis | Dismiss the promo popup first (it shifts the layout), pick the channel voice (Voice → search the name from config `voice.name` → *Use*), model "Eleven Multilingual v2", Speed 1.0 (never faster), Stability ≈ 0.5, Similarity 0.8, Style ≈ 0.15 (the voice's own defaults load when you pick it — fix the sliders after). Paste the output of **`npm run tts-text -- <id>`** (spoken forms + `<break time="0.3s" />` after each sentence and `<break time="0.8s" />` between lines; also saved to `public/episodes/<id>/tts-text.txt`). Generate (one click = 2 takes; the player shows the length — must be ≤ the tier's `maxVoice` (quick 44 s · story 60 s · deep 88 s), else shorten the script) → Download. Amin picks by ear if he wants; otherwise take Generation 1. | `npm run import -- <id> voice` → `npm run timing -- <id>` |
| **AI image** (building, place, era) | chatgpt.com | "Create a vertical 2:3 photorealistic image: <asset.generate> — <imageStyle>". No real people's faces, no logos. Download. | `npm run import -- <id> assets/<file> --ai` |
| **Founder photo / logo** (API found nothing) | commons.wikimedia.org | Search, open the File: page, check licence (CC0 / Public domain / CC BY / CC BY-SA only), "Download" → largest size. | `npm run import -- <id> assets/<file> --license "<licence>" --author "<author>" --page "<file page url>"` |
| **Stock music / SFX** (no ElevenLabs plan) | pixabay.com/music · pixabay.com/sound-effects | Filter mood, instrumental, no vocals; download. | `npm run import -- <id> music --license "Pixabay Content License" --page <url>` |
| **Stock photo** (API weak) | pexels.com · pixabay.com · unsplash.com | Portrait orientation, download original. | `npm run import -- <id> assets/<file> --license "Pexels License" --page <url>` |

Free fallbacks without any tab: images via Openverse + Wikimedia APIs (no key needed, `npm run assets`), voice via Kokoro (`npm run voice:local -- <id>` then `npm run timing`), SFX from `public/sfx/`.
GitHub is used for TOOLS (Remotion, rembg, Whisper, Kokoro, skills) — not as an asset source: random GitHub "free music/SFX" repos usually have unclear licences → don't use them. See `docs/free-sources.md`.
