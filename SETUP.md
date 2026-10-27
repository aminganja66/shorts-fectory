# SETUP.md: instructions for Claude Code

> **Amin:** open a terminal in this folder, run `claude`, and type:
> **`Read SETUP.md and set up everything.`**
> Claude does the rest and only stops when it needs you: logging in to tabs, voice names, approvals, GitHub.

---

## Claude: your job

Set up this project on this computer until every item in the Ready checklist is ✔ (or knowingly skipped) and a test render works. Work step by step. After each step print one line: `✔ step N – what was done` or `✖ step N – what is blocking + what Amin must do`. **Ask before installing anything system-wide.** Never read or print `.env` contents. Never type passwords. Never touch YouTube.

At the end, print the **Ready checklist** (bottom of this file) with ✔/✖ for every item.

---

### Step 1: Detect the system
- OS (Windows / macOS / Linux) and shell. On Windows prefer PowerShell commands and `winget`, on macOS `brew`, on Linux `apt`.
- Is this the **first laptop** (no `.git` folder or no `origin` remote) or the **second laptop** (a clone)? Remember it for step 9.

### Step 2: Required tools
Check each tool with its version command. For anything missing, show Amin the one install command and **ask once for all of them together**, then install:

| Tool | Check | Install (Windows / macOS / Linux) |
|---|---|---|
| Node.js ≥ 20 | `node -v` | `winget install OpenJS.NodeJS.LTS` / `brew install node` / `sudo apt install nodejs npm` |
| Git | `git --version` | `winget install Git.Git` / `brew install git` / `sudo apt install git` |
| ffmpeg | `ffmpeg -version` | `winget install Gyan.FFmpeg` / `brew install ffmpeg` / `sudo apt install ffmpeg` |
| Python ≥ 3.10 | `python --version` or `python3 --version` | `winget install Python.Python.3.12` / `brew install python` / `sudo apt install python3 python3-pip` |
| rembg (founder cut-outs) | `rembg --help` | `pip install "rembg[cli]"` (if pip complains on Linux/macOS: `pipx install "rembg[cli]"`) |

On Windows a new terminal may be needed after installing. If a command isn't found right after installing, tell Amin to reopen the terminal and type `claude` → "continue SETUP.md from step 2".

### Step 3: Project packages
```
npm install
```
If it fails, show the last 20 lines of the error and fix the cause (wrong Node version, network, permissions). Then:
```
npx tsc -p .
```
It must print nothing (no type errors).

### Step 4: Claude Code commands, skills, agents
```
npm run setup
```
Confirm it reports **18 skills** and **6 agents** (topic-scout, researcher, scriptwriter, art-director, motion-director, qa-editor) and the commands `/short /make /topics`.
Then refresh the skills to the latest versions (non-fatal if offline):
```
npx -y skills update -p -y
```
Tell Amin: "Restart Claude Code once after setup so the new /commands, skills and agents load."

### Step 5: Chrome = the main way of working (no API keys needed)
Amin wants Claude to work **through his Chrome tabs**, not API keys.
1. Check whether Claude in Chrome is available in this session (try listing tabs). If it isn't, tell Amin: install the **Claude in Chrome** extension, sign in with the same Claude account, then restart with `claude --chrome`.
2. Ask Amin to open and **log in himself** to these tabs, then drag them into Claude's tab group:
   - elevenlabs.io (voice, music, sound effects)
   - chatgpt.com (AI images)
   - commons.wikimedia.org (founder photos, logos)
   - pixabay.com (backup music, SFX, photos)
3. Find the downloads folder Chrome uses (normally `~/Downloads`). If it's different, write `DOWNLOADS_DIR=<path>` into `.env` (append that line only, never read the rest).
4. **Test the loop (free):** in the Pixabay tab, download any short sound effect, then run
   `npm run import -- 2026-10-27-netflix-vs-blockbuster sfx:test --license "Pixabay Content License"` → it must print ✔. Then delete `public/sfx/test.mp3` and its line in `public/sfx/library.json`.
5. Ask Amin which ElevenLabs voice **names** to use (one per channel: deeper storyteller for brand, calmer for psych; must sound good in Hindi with Multilingual v2). Write them into `channels/<ch>/config.json → voice.name`.

API keys in `.env` are **optional speed-ups** (Claude never reads `.env`; Amin fills it if he wants): `ELEVENLABS_API_KEY` (+ `voice.voiceId`), `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `OPENAI_API_KEY`. Without them everything goes through the tabs. Images also work keyless through the Openverse and Wikimedia APIs.

### Step 6: Free offline voice (backup when ElevenLabs credits run out). Ask first, about 500 MB.
- Install espeak-ng: `winget install espeak-ng` / `brew install espeak-ng` / `sudo apt install espeak-ng`
- `pip install "kokoro>=0.9" soundfile`
- Test: `npm run voice:local -- 2026-10-27-netflix-vs-blockbuster`, then `npm run timing -- 2026-10-27-netflix-vs-blockbuster` (the first run downloads the Whisper model, about 1.5 GB; on a slow laptop set `WHISPER_MODEL=small` in `.env`). Let Amin listen to `public/episodes/2026-10-27-netflix-vs-blockbuster/voice.mp3`, then delete `voice.mp3` and `timing.json` there.
- If Amin skips this: fine, ElevenLabs web is the main voice.

### Step 7: Music and sound effects
- `public/sfx/` already has `whoosh.mp3` and `hit.mp3` (original, free).
- Music is made per episode in the ElevenLabs Music tab (or picked from Pixabay) during `/short`. Nothing to prepare.
- Optional: keep 5–10 favourite Pixabay or YouTube Audio Library tracks in `public/music/` as a backup. Add each with `npm run import -- <id> music ...`, or by editing `library.json`.

### Step 8: Free sources rules
Read `docs/free-sources.md` and confirm to Amin in 2 lines where images, logos, music, voice and effects come from, and what's never used (Google Images, news photos, random GitHub asset repos without a licence).

### Step 9: Two-laptop sync (GitHub)
- **First laptop:** ask Amin for the URL of an **empty private** GitHub repo (or offer to create one with `gh repo create shorts-factory --private` if `gh` is installed and logged in). Then:
  ```
  git init
  git add .
  git commit -m "shorts factory setup"
  git branch -M main
  git remote add origin <url>
  git push -u origin main
  ```
  Make sure `.env`, `node_modules/`, `exports/` and episode `assets/` are NOT committed (check `git status` against `.gitignore`).
- **Second laptop:** `git pull` works and `channels/*/history.json` is present.
- Set the commit identity if it's missing: `git config user.name` / `git config user.email` (ask Amin).

### Step 10: Test run (no credits spent)
Use the demo episode `2026-10-27-netflix-vs-blockbuster`:
```
npm run assets -- 2026-10-27-netflix-vs-blockbuster
npm run check  -- 2026-10-27-netflix-vs-blockbuster
npm run frames -- 2026-10-27-netflix-vs-blockbuster
npm run board  -- 2026-10-27-netflix-vs-blockbuster
npm run render -- 2026-10-27-netflix-vs-blockbuster --draft
```
- `assets` downloads real logos, founder photos and stock images. If `OPENAI_API_KEY` is empty, the 3 `generate` images stay missing: tell Amin these will be made in the ChatGPT tab during real runs, and skip ahead (use `--draft` anyway).
- Look at 4–5 images in `public/episodes/<id>/frames/` (Read tool) and confirm they render (Hindi text visible, no black frames).
- Open `exports/2026-10-27-netflix-vs-blockbuster/draft.mp4` for Amin (or tell him the path).
- If Remotion fails to download its browser (corporate network), set `REMOTION_BROWSER` in `.env` to the installed Chrome path.
- Then put the demo back to its starting state: `git checkout -- channels public/episodes` (when git is set up).

### Step 11: Finish
Print the Ready checklist, then tell Amin exactly this:
> Setup done. Restart Claude Code with `claude --chrome`, keep your 4 tabs logged in, then type `/short brand` (or `/short psych`). Add `auto` to skip the approval stop.

---

## Ready checklist
- [ ] Node ≥ 20 · Git · ffmpeg · Python · rembg
- [ ] `npm install` OK · `npx tsc -p .` clean
- [ ] `.claude/` has 3 commands, 18 skills, 6 agents
- [ ] Claude in Chrome connected ☐ · tabs logged in: ElevenLabs ☐ ChatGPT ☐ Wikimedia ☐ Pixabay ☐
- [ ] Download → `npm run import` test ✔ ☐ · DOWNLOADS_DIR correct ☐
- [ ] Voice names set for brand ☐ psych ☐
- [ ] Optional: Kokoro offline voice ☐ · API keys in .env ☐
- [ ] Git remote set and pushed (first laptop) / pull works (second laptop)
- [ ] Test: check ✔ · frames ✔ · draft.mp4 rendered ✔
