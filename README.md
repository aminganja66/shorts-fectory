# Shorts Factory: Hindi YouTube Shorts with Claude Code + Remotion

Two channels, one machine:

| Channel | Folder | What it makes |
|---|---|---|
| **Brand stories** | `channels/brand` | "Netflix asked for $50M, Blockbuster laughed" style stories |
| **Psychology effects** | `channels/psych` | Real named effects (Zeigarnik, Spotlight…) with the study behind them |

Every Short goes through the same steps: **topic → research → humanized Hindi script → scene plan → copyright-safe images → plan file (you approve) → ElevenLabs voice → Remotion render → MP4 you upload yourself.**

---

## 1. One-time setup on EACH laptop (about 15 min)

**Easiest way:** run `claude` in this folder and type **"Read SETUP.md and set up everything."** Claude installs and checks everything, asking you only for keys and approvals. The manual steps below are the same thing done by hand.


Install **Node 20+**, **git**, **ffmpeg**, and **Claude Code** (`npm i -g @anthropic-ai/claude-code`).

**Laptop 1 (only once):** unzip, then put it in a new **private** GitHub repo:
```bash
cd shorts-factory
git init && git add . && git commit -m "shorts factory"
git branch -M main
git remote add origin https://github.com/<you>/shorts-factory.git
git push -u origin main
```

**Both laptops:**
```bash
git clone https://github.com/<you>/shorts-factory.git   # laptop 2 only; laptop 1 already has the folder
cd shorts-factory
npm install
npm run setup          # installs the /short /make /topics commands into .claude/, creates .env
```

Open `.env` and paste:
- `ELEVENLABS_API_KEY`: ElevenLabs → Profile → API keys
- `PEXELS_API_KEY` and `PIXABAY_API_KEY`: both free, they make image search much better

In `channels/brand/config.json` and `channels/psych/config.json`, set `voice.voiceId` (ElevenLabs → Voices → pick a Hindi voice → copy the ID). Use a different voice per channel.

Add music once: see `public/music/README.md`.

Optional extras:
- **Skills and agents:** `npm run setup` already installs the 18 skills and 6 agents into `.claude/`. See section 9.
- **Cut-out people/objects:** `pip install "rembg[cli]"`.

## 2. Daily use: one click

```bash
cd shorts-factory
claude
```
Then type:

| You type | What happens |
|---|---|
| `/short brand` | git pull → picks a new topic (never repeats) → research → Hindi script → images → **storyboard.html + draft.mp4** → stops for your OK |
| `approved` (or `/make <id>`) | ElevenLabs voice → final render → `exports/<id>/short.mp4`, `thumbnail.jpg`, `upload.txt` → git push |
| `/short brand auto` | Everything in one go, no stop |
| `/short psych` | Same for the psychology channel |
| `/topics brand` | Refills the backlog with 10 fresh, checked ideas |

Upload `short.mp4` in YouTube Studio and paste `upload.txt`. Then tell Claude the link:
`npm run history -- published <id> https://youtube.com/shorts/...`

## 3. Preview and edit in Remotion Studio

```bash
npm run studio         # opens http://localhost:3000
```
Pick the episode in the right panel (`episodeId`), scrub frame by frame and see every scene. To change something, tell Claude using frame numbers ("frame 120–140 make the zoom faster"). Without a voice, the Studio plays a timed preview so you can judge pacing.

## 4. Two laptops: how it stays in sync

Everything important lives in **one private GitHub repo**:

| Synced through git | Not in git (each laptop keeps its own) |
|---|---|
| code, scene templates, fonts, music library | `.env` (keys) — set up once per laptop |
| `channels/*/history.json` (topics used) | `node_modules/` (`npm install`) |
| `channels/*/backlog.md` | `public/episodes/*/assets/` → re-downloaded automatically from `credits.json` |
| each episode's `storyboard.json`, `credits.json`, `timing.json`, `voice.mp3` | `exports/` (final MP4s), so copy them to Google Drive if you want them on both |

Rules (Claude follows them automatically):
1. **Start with `git pull`** and **end with `git push`.**
2. When a topic is chosen, it's **claimed and pushed immediately**. If you start a Short on laptop 2 the same day, it can't pick the same topic.
3. You can start a Short on laptop 1 and finish it on laptop 2: `git pull`, then `/make <id>`. Images re-download, and the voice is already in git, so no ElevenLabs credits are spent again.

## 5. Folder map

```
CLAUDE.md                  ← the rules Claude follows (workflow, humanizing, copyright)
claude-config/             ← /short /make /topics commands (copied to .claude/ by npm run setup)
channels/brand|psych/      ← config.json (style, voice, colours), backlog.md, history.json
src/                       ← Remotion: Short.tsx, scenes (collage, kinetic, chart, versus, stack, end), film look, captions
pipeline/                  ← new · assets · voice · timing · board · check · render · history
public/episodes/<id>/      ← storyboard.json (the single source of truth), assets/, voice.mp3, timing.json, storyboard.html
public/music, public/sfx   ← your copyright-safe audio library
exports/<id>/              ← short.mp4, thumbnail.jpg, upload.txt  ← what you upload
```

## 6. Manual commands (what Claude runs for you)

```bash
npm run new -- brand "Kodak digital camera" "kodak,camera"
npm run assets -- <id>                 # copyright-safe images + credits.json
npm run check -- <id>                  # quality gate
npm run frames -- <id>                 # key frames of every scene/beat (frame-by-frame check)
npm run board -- <id>                  # plan file storyboard.html
npm run render -- <id> --draft         # quick half-size preview, no voice needed
npm run voice -- <id>                  # ElevenLabs voice + word timings
npm run timing -- <id> voice.m4a       # if you record your OWN voice instead
npm run render -- <id>                 # final MP4
npm run history -- list brand
```

## 7. When ElevenLabs runs out

Record the script on your phone in a quiet room. Save it as `public/episodes/<id>/voice.m4a`, then run `npm run timing -- <id> voice.m4a`. Local Whisper times the captions. Your real voice is also the safest choice for YouTube monetization.

## Notes
- Remotion is free for individuals and companies with up to 3 people.
- YouTube: if a scene shows realistic AI-generated people or events, tick "Altered or synthetic content" when uploading. Stock photos plus narration don't need it.
- **While your ElevenLabs plan is active,** run `/short brand auto` and `/short psych auto` several times to build a stock of finished Shorts. Voices are saved in git, so re-renders cost nothing.
- **Chrome (optional):** start Claude with `claude --chrome` if you want it to open source pages or check images visually in your browser. The pipeline itself doesn't need it, because it uses the image libraries' APIs, which is faster and more reliable.

## 8. Reference-reel look: logos, founders, buildings, smoke, motion blur

| Layer | Where it comes from | storyboard entry |
|---|---|---|
| Brand logo (Netflix, Blockbuster…) | Wikimedia Commons (public-domain text logos) | `"kind":"logo"` |
| Founder / CEO photo, cut out | Wikimedia Commons (free licences) + `rembg` cut-out | `"kind":"person","cutout":true` |
| Buildings, places, historic moments | **AI-generated** with OpenAI Images (needs `OPENAI_API_KEY`) | `"generate":"…prompt…"` |
| Objects, textures, generic people | Pexels / Pixabay / Openverse | `"query":"…"` |
| Smoke, embers, dust, light leak, glitch | Built into Remotion (`src/film/Fx.tsx`) | `"fx":["smoke","embers"]` |
| Motion blur, zoom-through, punch, shake, flash | Built into Remotion (`src/film/Beats.tsx`) | `"beats":[{"at":24,"do":"punch"}]` |

Rules that keep the channel safe:
- Never AI-generate a real person's face.
- Never use Google Images or news-agency photos. Most founder-photo copyright strikes come from Getty and AP photos.
- Install `pip install "rembg[cli]"` so founders become real cut-outs. Without it they show as photo cards.

**ChatGPT for images:** a ChatGPT Plus subscription does **not** include API credits. For one-click generation, add a few dollars of credit at platform.openai.com and paste the key in `.env`. Without a key, generate the image in chatgpt.com yourself, download it, and use `"from": "~/Downloads/…"`.

## 9. Skills + agents (already inside this zip, installed by `npm run setup`)

**18 skills from skills.sh**, copied into `.claude/skills/`. Update them anytime with `npx skills update -p -y`.

| From | Skills | Used for |
|---|---|---|
| `remotion-dev/skills` (official, about 690K installs) | remotion-best-practices, remotion-markup, remotion-captions, remotion-render, remotion-studio, remotion-multimedia | Expert-level Remotion animation, captions, rendering |
| `elevenlabs/skills` (official) | text-to-speech, speech-to-text, music, sound-effects, setup-api-key | Voice, timing, **original background music**, sound effects |
| `coreyhaines31/marketingskills` (about 236K installs) | social, copywriting, copy-editing, content-strategy, marketing-psychology, video | Hooks, Shorts scripts, topic strategy, psychology angles |
| `blader/humanizer` (about 10.7K installs) | humanizer | Removes AI-sounding writing |

Skipped on purpose:
- The "superpowers" image and video skills from unknown publishers. Their install numbers looked inflated, and the pipeline already does images safely.
- HeyGen HyperFrames. It's a different video engine, not Remotion.

**6 agents**, copied into `.claude/agents/`. `/short` runs them in order:
`topic-scout` → `researcher` → `scriptwriter` → `art-director` → `motion-director` → `qa-editor`

## 9b. Every Short looks different

`npm run check` blocks a Short that repeats recent ones:
- **Look:** archive, noir, neon, paper, gold or clean. It can't match the previous Short.
- **Hook type:** can't repeat either of the last 2 Shorts.
- **Caption style and transition:** this pair can't repeat any of the last 3.
- **Opening scene order:** the first 3 scenes can't repeat any of the last 5.
- **Music:** can't be reused within 5 Shorts.

The art-director picks the combination from the story's emotion:
- success → gold
- downfall → noir or archive with smoke and embers
- tech → neon with glitch
- history → paper

With an ElevenLabs key, every Short gets its **own original music track**: `npm run music -- <id> "<prompt>" 45`.

## 10. Chrome tab group (only if you start Claude with `claude --chrome`)

The pipeline works through APIs, so **no tab must be open**. When you run `claude --chrome`, Claude opens its own tab group in Chrome automatically. Drag these into that group if you use them:

| Tab | Why | Needed when |
|---|---|---|
| `http://localhost:3000` (Remotion Studio, `npm run studio`) | Watch any frame, read frame numbers for edits | Reviewing before you approve |
| `public/episodes/<id>/storyboard.html` (drag the file into Chrome) | The plan: script, visuals, filmstrip, licences | Reviewing before you approve |
| chatgpt.com (logged in) | Making images by hand when there's no OpenAI API key | Only without `OPENAI_API_KEY` |
| elevenlabs.io (logged in) | Picking voices / checking credits | Only for setup |
| commons.wikimedia.org | Finding a better founder photo by eye | Optional |

Claude never logs in anywhere and never opens YouTube Studio. You upload yourself.
