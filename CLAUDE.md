# Shorts Factory — rules for Claude Code

Two Hindi YouTube Shorts channels, made with Remotion. Owner: Amin (uploads to YouTube himself — never use the YouTube API or log in to YouTube).

- `brand` — business & brand stories (Netflix vs Blockbuster style)
- `psych` — psychology effects explained with real studies

## The one-click flow (`/short <brand|psych> [auto] [browser] [retry]`)
`retry` = make the SAME topic again as a new version (`npm run new -- <ch> "<topic>" "<kw>" --retry` → id `...-v2`, `npm run history -- check ... --retry`) so Amin can compare old vs new. Everything below still applies; variety rules force a different look than the previous Short.
1. **Sync**: `git pull --rebase`. Never skip — the other laptop may have used a topic.
2. **Pick topic**: read `channels/<ch>/history.json` + `backlog.md`. Take the first backlog idea not in history. Run `npm run history -- check <ch> "<topic>" "<kw>"` (exit 2 = duplicate → next idea). Prefer ideas with a twist + a hard number.
3. **Claim**: `npm run new -- <ch> "<topic>" "<keywords>"` then `git add channels public/episodes/<id>/storyboard.json && git commit -m "claim: <topic>" && git push` (this locks the topic for the other laptop).
4. **Research**: WebSearch/WebFetch. Minimum 3 facts, each with a source URL from a reliable outlet (company filings/press releases, Reuters, BBC, Fortune, Economic Times, Mint, the original study/paper for psych). If sources disagree, use the conservative number or drop it. Never invent quotes, numbers, dates, or study results.
5. **Script** (`lines[].text`): follow `channels/<ch>/config.json` → `structure` + `style`. 6–8 lines, **30–42 s, max 75 words** (real narration ≈ 0.5 s/word + 0.8 s per line; `npm run check` fails over 48 s — cut words, never speed the voice up). **Hook = the viewer test below**, ≤ 12 words; write 3 candidates into `storyboard.hookCandidates` and use the best as line 1. Then humanize (see below). **`lines[].voice` is REQUIRED for any line with digits, %, $/€, years or abbreviations** — spell it the way Indians say it in Hinglish (see "Spoken form").
6. **Scene script + motion spec** — for EVERY line fill: `visual` (what we see, layer by layer: background / middle / foreground / logo), `onScreen` (on-screen text), `motionNotes` (frame-by-frame choreography in words), `beats` (frame-exact camera moments), `fx` (atmosphere), `sfx`. See "Motion grammar" below.
   **Scenes** (`lines[].scene`): types `collage | kinetic | chart | versus | stack | end` (see `src/types.ts`). Follow `sceneMix`. Vary motions (push, pull, pan-left, pan-right, drift). Reference storyboards: `public/episodes/2026-10-27-netflix-vs-blockbuster/storyboard.json` (brand) and `docs/examples/psych-zeigarnik.storyboard.json` (psych). Copy their shape, never their wording.
7. **Assets** (`storyboard.assets[]`): one entry per file. Kinds (details in `pipeline/fetch-assets.mjs` header):
   - **Brand logos** → `"kind":"logo"` (Wikimedia Commons; most wordmark logos are public-domain text logos). Logos are fine to *show* for identification/commentary; never alter them to look like an ad, never generate a logo with AI.
   - **Real founders / CEOs** → `"kind":"person"` + `"cutout":true` (Wikimedia Commons photos, CC0/PD/CC BY; set `"allowShareAlike":true` to also allow CC BY-SA — attribution goes in the description automatically). If no free photo exists, show a silhouette/back-view stock person or AI "man in suit, back view" instead. **Never AI-generate a real, named person's face.**
   - **Buildings, places, historical moments, moods** → `"generate": "<prompt>"` (OpenAI Images, photoreal documentary style from `imageStyle`). Generic places only ("2000-era video rental superstore"), no brand names/logos in the prompt.
   - **Generic stock** (objects, textures, cities, people) → `"query"` (Pexels, Pixabay, Openverse, Wikimedia).
   - **Something Amin found himself** → `"from": "~/Downloads/file.jpg"` + `license` + `page`.
   - Run `npm run assets -- <id>`. If missing, simplify the query and re-run with `--only <file>`. Look at the images (Read tool) — if a stock pick is weak, set `"pick": n` from `assets/candidates.json` and `--force --only <file>`.
   - NEVER: Google Images, Getty/AP/Reuters/news photos, movie stills, TV/news footage, other creators' videos.
8. **Music + SFX** (art-director): original track per episode — key → `npm run music`, no key → ElevenLabs Music tab + `npm run import -- <id> music`; otherwise a fitting unused track from `public/music/library.json` or Pixabay tab. SFX the same way (`sfx:<name>`).
9. **Check + plan file**: `npm run check -- <id>` (fix every ✖) → `npm run frames -- <id>` (renders key frames of every scene/beat) → **look at the frames yourself** (Read tool on `public/episodes/<id>/frames/*.jpg`) and fix anything ugly: text overlapping captions (captions live at y≈1230–1400), faces cut off, logo on top of headline, empty frames → re-run frames → `npm run board -- <id>` (writes `storyboard.html` with filmstrip + `script.md`) → `npm run render -- <id> --draft` (silent animatic).
10. **STOP for approval** unless the argument was `auto`. Tell Amin: topic, hook line, length, and the path of `storyboard.html` + `exports/<id>/draft.mp4`.
11. **Voice**: key set → `npm run voice -- <id>`. No key → ElevenLabs tab (Browser mode, exact recipe in the table) → `npm run import -- <id> voice` → `npm run timing -- <id>` (now `align.mjs`: finds the real pauses, no Whisper). Read the printed line table: every line must start after a clear pause; ⚠ lines = re-generate or tell Amin. No ElevenLabs at all → `npm run voice:local -- <id>` (Kokoro) or Amin records `voice.m4a` → `npm run timing -- <id> voice.m4a`.
12. **Re-sync beats to the real voice**: read `timing.json`, move each beat onto its key word, then `npm run frames -- <id>` and look again.
    **Render**: `npm run render -- <id>` → `exports/<id>/short.mp4`, `thumbnail.jpg`, `upload.txt`. Look at 3–4 stills (`npx remotion still ... --frame=N`) to verify nothing is broken.
13. **Save**: `git add channels public/episodes/<id>/{storyboard.json,timing.json,credits.json,voice.mp3} && git commit -m "rendered: <topic>" && git push`.
14. Report in 3 lines: file paths, length, anything Amin should double-check.

After Amin uploads: `npm run history -- published <id> <youtube-url>` (keeps stats for choosing future topics).

## Viewer-first rules (Amin's feedback on the first Short: "no hook, not eye-comfortable, robotic, subtitles drift")
**Hook (first 3 seconds decide everything).** After hearing line 1 the viewer must be thinking "क्यों? किसे? क्या हुआ?" and be unable to guess the answer. So line 1 is an OPEN QUESTION (ends with `?`): set up a big stake in 5–6 words, then ask the question with the KEY NOUN WITHHELD (who / what / why). Line 2 gives the answer and immediately opens the next question (tease → answer → deeper why). Plain spoken Hinglish, ≤ 12 words. Never state the answer in line 1 ("…फिर भी Android को ना बोला" gives it away = weak). NOT a bare statistic ("2007 में 49.4% share…"), NOT a date-drop that needs context. Pattern: *stake + withheld question* — "कभी आधा market Nokia का था। फिर उसने किसे 'ना' कह दिया?" (line 2: "Android को। …") · "Blockbuster के पास Netflix खरीदने का मौका था। जवाब क्या मिला?" · "एक phone ने Nokia का राज खत्म किया — कौन सा?". Don't promise what the video doesn't deliver; the answer must be real and verified. The on-screen headline of scene 1 is the same question, big, with the `?`. Test: would you stop scrolling if a friend said this? Show the strongest image + a 2–4 word headline from frame 0 (no logo-only opening). The payoff of the hook must come before the end.
**Spoken form** (`lines[].voice`): captions may show digits, the narrator must say them like a Hinglish speaker: years → English words ("2011" → "twenty eleven", "2007" → "two thousand seven"), numbers/percent → English ("49.4%" → "forty nine point four percent", "5.44 billion euro" → "five point four four billion euro"), abbreviations letter by letter in Devanagari ("Q3" → "क्यू थ्री", "CEO" → "सी ई ओ" or keep CEO). Prefer rewriting to avoid awkward ones ("तीसरी तिमाही" is pure Hindi — don't). Never leave a number for the TTS to guess. Keep the English words in Latin script in `voice` too when the voice reads them fine.
**One idea per line, one sentence per line where possible.** The narrator pauses 1.1 s between lines; a line that runs on or merges two thoughts sounds mixed up and breaks caption sync.
**Natural voice.** Conversational narrator voice, speed 1.0, stability ≈ 0.5, style ≤ 0.2 (config). Intense/dramatic "documentary" voices and fast speeds sound acted/robotic. If a take sounds robotic, change the voice name in `channels/<ch>/config.json` (alternatives listed) before spending credits again.
**Eye comfort.** Subject bright and readable, soft grain only, no scanlines/flicker stacks, no full-black frames. Flash/shake only on THE one big moment (max 1 per Short), `glitch` transition only for tech stories, never with `noir`. Prefer `clean`, `gold`, `paper` looks; `noir` only for failure/ending stories and then lifted (it keeps some colour). Max 1 fx per scene, calm scenes between loud ones, text ≥ 90 px, high contrast.
**Captions in sync.** `npm run timing` aligns to real pauses. After import, read its line table; if any line starts mid-sentence or a ⚠ shows, fix the voice (longer break), not the captions.

## Humanize (every script, before assets)
Use the installed `humanizer` skill if present (it is English-focused), AND these Hindi rules:
- Write how a friend tells a story in Hindi, not news-reader Hindi. "उन्होंने मना कर दिया" not "उनके द्वारा अस्वीकार कर दिया गया".
- Keep English words Indians actually say in English: company, CEO, deal, startup, revenue, billion, subscribers.
- Mix sentence lengths. Some 3-word punches. One rhetorical question max.
- Ban list: "आज हम बात करेंगे", "दोस्तों", "क्या आप जानते हैं" (as opener), "अद्भुत", "रोचक तथ्य", "यह कहानी हमें सिखाती है", "in conclusion", em-dash chains, three-adjective lists.
- Specific > vague: a year, a number, a place, a name in every 1–2 lines.
- End on a line that loops to the hook or provokes a comment — not a moral lecture.
- Read it aloud in your head at 1.05× speed. If a line can't be said in one breath, split it.

## Don't
- Don't repeat a topic or the same company within 30 days (history check).
- Don't use the same scene type 3 times in a row, or the same music twice in a row.
- No medical/diagnostic claims (psych), no investment advice (brand), no defamation — say "रिपोर्ट्स के मुताबिक" when a claim is reported, not proven.
- Don't commit `.env`, `exports/`, `public/episodes/*/assets/` (re-downloadable from credits.json).

## Motion grammar (frame-wise animation — 30 fps, frame 0 = start of the scene)
- Every scene already has a soft entrance (frames 0–8, gentle push + light blur, barely any flash). Don't add another.
- `beats`: `{"at": 24, "do": "punch"}` · `do` = `zoom-through` (dive into the image, motion-blurred; use `"at": -12` = last 12 frames to dive into the next scene) · `punch` (quick 12% push on a key word) · `shake` (impact, 8–10 frames) · `flash` (white hit) · `whip-out` (fast exit left) · `blur-in`.
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
| 5 script | `scriptwriter` | social, copywriting, copy-editing, humanizer, marketing-psychology (psych) |
| 6–8 look, assets, music, sfx | `art-director` | remotion-best-practices, music, sound-effects |
| 6, 9, 12 scenes, beats, frames | `motion-director` | remotion-best-practices, remotion-markup, remotion-captions, remotion-render, remotion-studio |
| 9, 12 final gate | `qa-editor` | — |
| 11 voice | you (main) | text-to-speech, speech-to-text (ElevenLabs) |
Run the agents in this order and pass each one the episode id. The main session only orchestrates, syncs git and talks to Amin.
ElevenLabs skills: use our scripts (`npm run voice`, `npm run music`) — do NOT install the ElevenLabs CLI or Python SDK.

## Variety (so the channel never looks templated)
Every Short gets a NEW combination — enforced by `npm run check` (✖ = must change):
- `theme.look` (archive · noir · neon · paper · gold · clean) ≠ previous Short
- `hookType` not used in the last 2 Shorts
- `theme.captionStyle` + `theme.transition` combo not in the last 3
- first 3 scene types not identical to any of the last 5
- music track not reused within 5 Shorts (prefer an original `npm run music` track)
Choose by the story's emotion, not at random (see `channels/<ch>/config.json → variety.rule`).

## Browser mode = DEFAULT when a key is missing (Claude Code started with `claude --chrome`)
Amin keeps these tabs logged in inside Claude's Chrome tab group. You operate them, download the result, then run `npm run import` — it grabs the newest file from ~/Downloads and puts it in the right place with its licence.
Before each generation/download say in one line what you're doing. Never type passwords, never change account settings or plans, never buy anything, never open YouTube Studio. Max 2 generations per item (credits).

| Need | Tab | What to do | Then |
|---|---|---|---|
| **Voiceover** | elevenlabs.io/app/speech-synthesis | Dismiss the promo popup first (it shifts the layout), pick the channel voice (Voice → search the name from config `voice.name` → *Use*), model "Eleven Multilingual v2", Speed 1.0 (never faster), Stability ≈ 0.5, Similarity 0.8, Style ≈ 0.15. Paste `lines[].voice ?? text` for every line, **separated by `<break time="1.1s" />`** (type it on its own between lines). Generate (one click = 2 takes; the player shows the length — must be ≤ 44 s, else shorten the script) → Download. Amin picks by ear if he wants; otherwise take Generation 1. | `npm run import -- <id> voice` → `npm run timing -- <id>` |
| **Original music** | elevenlabs.io/app/music | Prompt = genre, instruments, tempo, energy curve, "instrumental, no vocals", length ≈ script length + 5 s. Generate → Download. | `npm run import -- <id> music --title "<name>" --mood "<mood>" --license "ElevenLabs Music (paid plan)"` |
| **Sound effect** | elevenlabs.io/app/sound-effects | Short prompt ("deep cinematic whoosh", "cash register ding", "typewriter clack"), 1–3 s. | `npm run import -- <id> sfx:<name> --license "ElevenLabs SFX"` |
| **AI image** (building, place, era) | chatgpt.com | "Create a vertical 2:3 photorealistic image: <asset.generate> — <imageStyle>". No real people's faces, no logos. Download. | `npm run import -- <id> assets/<file> --ai` |
| **Founder photo / logo** (API found nothing) | commons.wikimedia.org | Search, open the File: page, check licence (CC0 / Public domain / CC BY / CC BY-SA only), "Download" → largest size. | `npm run import -- <id> assets/<file> --license "<licence>" --author "<author>" --page "<file page url>"` |
| **Stock music / SFX** (no ElevenLabs plan) | pixabay.com/music · pixabay.com/sound-effects | Filter mood, instrumental, no vocals; download. | `npm run import -- <id> music --license "Pixabay Content License" --page <url>` |
| **Stock photo** (API weak) | pexels.com · pixabay.com · unsplash.com | Portrait orientation, download original. | `npm run import -- <id> assets/<file> --license "Pexels License" --page <url>` |

Free fallbacks without any tab: images via Openverse + Wikimedia APIs (no key needed, `npm run assets`), voice via Kokoro (`npm run voice:local -- <id>` then `npm run timing`), SFX from `public/sfx/`.
GitHub is used for TOOLS (Remotion, rembg, Whisper, Kokoro, skills) — not as an asset source: random GitHub "free music/SFX" repos usually have unclear licences → don't use them. See `docs/free-sources.md`.
