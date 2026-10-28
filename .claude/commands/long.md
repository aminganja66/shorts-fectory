---
description: Long 16:9 brand documentary (8–12 min) — idea → rise → downfall → comeback → today
argument-hint: brand [auto] [browser] [optional company or topic]
---
Make a LONG video for channel: $ARGUMENTS

English, VOX house look, **16:9 (composition `Long`, 1920×1080), 8–12 minutes**, 5 chapters + cold open. Rules: CLAUDE.md → "Long videos (/long)". Same team and tools as /short; differences below.

1. **Sync**: `git pull --rebase`.
2. **Topic**: a company/brand with a REAL arc — a clear start, a real fall and a comeback (or a fight to survive). If a topic is given, use it. Otherwise topic-scout picks from `channels/brand/backlog.md` (a company we already made a Short about is fine — long videos are their own series). `npm run history -- check brand "<topic>" "<kw>" --long` (exit 2 = duplicate long video → next idea).
3. **Claim**: `npm run new -- brand "<topic>" "<kw>" --long` (id ends in `-long`, chapters pre-filled) → commit `channels` + storyboard → push.
4. **Research** (researcher): 12–20 facts, every fact with a source URL and `chapter` (c0 open … c5 today), at least 2 per chapter, plus a dated timeline of the company. Founders' own words only from interviews/filings with a link. Conservative numbers.
5. **Script** (scriptwriter, skills `youtube-scriptwriting` + `humanizer` + `copywriting`): follow `channels/brand/config.json → long` (chapters, jobs, rules). 80–120 lines, 950–1450 words, each line one sentence or two short ones (6–16 words), `lines[].chapter` set. Cold open = the most dramatic moment + an open question; every chapter opens with a `chapter` scene line and ends on a pull into the next; a re-hook every 60–90 s; the last line loops to the cold open and asks a question. 3 `hookCandidates`. Then `npm run spoken -- <id>`.
6. **Scenes + assets** (art-director, motion-director): scene types `chapter | vox | counter | line | timeline | typewriter`. Scenes are laid out for 16:9 automatically (text left, visuals right, captions bottom ≈ y 880–1010). Reuse cut-outs across chapters when it makes sense (a founder cut-out can appear in 3 chapters), ~25–40 unique assets total. AI images/places in landscape 3:2. Music: one 2–3 min instrumental bed (it loops), volume ≈ 0.12.
7. **Check + frames**: `npm run check -- <id>` (fix every ✖) → `npm run frames -- <id> --chapter N` for each chapter (look at them!) → `npm run board -- <id>`. No silent draft for long videos (too slow) — the frames + board are the plan.
8. **STOP for approval** unless `auto`: topic, chapter titles, length estimate, path of `storyboard.html`.
9. **Voice**: `npm run tts-text -- <id>` writes `tts-text-1.txt … tts-text-N.txt` (≤ 4500 chars each). API key → `npm run voice -- <id>` (all parts + join + timing). Browser → per part: paste in the ElevenLabs tab (Jon, Multilingual v2, speed 1.0, stability 0.5, similarity 0.8, style 0.15), generate, download Generation 1, `npm run import -- <id> voice --part N`. After the last part voice.mp3 is joined → `npm run timing -- <id>` (read the table; ⚠ lines = re-generate that part).
10. **Re-sync beats** (motion-director) to timing.json, `npm run frames -- <id> --chapter N` again for chapters with beats.
11. **Render**: `npm run render -- <id>` — chapter by chapter into `exports/<id>/parts/`, ≈ 0.8 s/frame → a 10 min video ≈ 4 h. Run it in the background; if interrupted, run the same command again (finished chapters are skipped). Output `exports/<id>/long.mp4`, `thumbnail.jpg`, `upload.txt` (with YouTube CHAPTERS timestamps). Check 4–6 stills (`npx remotion still src/index.ts Long … --frame=N`).
12. **Save**: commit `channels` + `public/episodes/<id>/{storyboard.json,timing.json,credits.json,voice.mp3}` → push. Report in 3 lines (paths, length, what to double-check — custom thumbnail recommended for long videos).
Work without asking questions unless something is impossible.
