---
description: One click → research, script, assets, plan file (and voice + render with "auto")
argument-hint: brand | psych [auto] [browser] [retry] [optional topic]
---
Make today's Short for channel: $ARGUMENTS

Everything is ENGLISH and in the VOX house look (CLAUDE.md, docs/vox-style.md). No Magnific/Higgsfield — cut-outs come from the ChatGPT tab + rembg.

Follow the "one-click flow" in CLAUDE.md exactly, steps 1–14, delegating to the agents listed under "Team: agents + skills" (topic-scout → researcher → scriptwriter → art-director → motion-director → qa-editor).
- First word of the arguments = channel (brand or psych). If a topic is given after it, use that topic (still run the history check).
- Art direction (CLAUDE.md → "Art direction"): after the scene script run `npm run direct -- <id>`; the backdrop, caption style, entrances and camera follow the topic and differ from the previous Short. Use at most ONE full-bleed film scene, only at the emotional peak; everything else stays vox. With `retry`, `direct` is forced to avoid the old version's combination.
- If the arguments contain `retry` (with a topic, or the most recent episode's topic when none is given): make the SAME topic again as a new version using `npm run new -- <ch> "<topic>" "<kw>" --retry` and `npm run history -- check ... --retry`; reuse `research.md`/facts from the earlier episode (copy them, re-verify nothing new needed) but write a NEW script, look, scenes, music and voice following the "Viewer-first rules" in CLAUDE.md, so Amin can compare both videos.
- If the arguments contain `auto`, do NOT stop at step 10 — continue with voice, then the **Studio preview gate** (CLAUDE.md), then render.
- Music and SFX are NEVER generated — music via `npm run music`, SFX via `npm run sfx` (local library, CLAUDE.md step 8). Chrome tabs are the default for voice and AI images whenever the matching API key is missing (CLAUDE.md → "Browser mode"); bring every download in with `npm run import`. `browser` forces tab mode even when keys exist.
- Otherwise stop after the plan file and wait for "approved" (then run /make with the episode id).
Work without asking questions unless something is impossible (no safe images, no ElevenLabs key and no recording, git conflict).
