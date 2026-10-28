---
description: Faster LONG 16:9 brand documentary (8–12 min) — same result as /long, shorter workflow
argument-hint: brand [auto|step] [browser] [optional company or topic]
---
Make an OPTIMIZED LONG video for channel: $ARGUMENTS

Same product as `/long` (read `.claude/commands/long.md` and CLAUDE.md → "Long videos"): English, vox look, 16:9 `Long`, 8–12 min, 5 chapters + cold open, all checks and the Studio preview gate stay. `/long` itself is unchanged — Amin uses both separately. Follow `/long` step by step, with ONLY these changes:

**Modes (pick from the arguments)**
- *(default)*: runs without asking until the storyboard approval stop, then the Studio gate (see `/long`).
- `auto`: no storyboard approval stop. The Studio preview gate still applies.
- `step`: STOP after EVERY step (topic picked · claimed · research · script · scene script · each asset batch · music/SFX · check+frames · board · voice part · timing · beat re-sync · Studio · render). After each one, report in 2–3 lines what was done and the file paths, then ask "Continue to <next step>? (yes / change X)" and WAIT. Apply any change Amin asks for before moving on. `step` overrides `auto`; the Studio gate and the storyboard approval stop still apply.

**Before the render (parallel + leaner)**
1. **Research in parallel**: spawn `researcher` agents per chapter pair (open+idea · rise+downfall · recovery+today) at the same time; merge facts (≥ 2 per chapter, 12+ total, all sourced, conservative numbers), drop duplicates, then ONE pass to check sources.
2. **Fewer assets**: aim for ~20–25 unique assets (not 25–40). Reuse cut-outs/logos across chapters. Prefer logos, stock, Commons and free scene types (`timeline`, `counter`, `line`, `typewriter`) over new ChatGPT cut-outs. Max ~10 ChatGPT cut-outs.
3. **Voice early**: as soon as the script + `npm run spoken` are final, start the voice parts (API: `npm run voice`; browser: part by part) while assets/scenes are being built. If the script changes later, re-voice only the affected part.
4. **Frame checks sampled**: `npm run frames -- <id> --chapter N`, but look at ONE frame per scene TYPE per chapter plus every beat/flash scene, not every frame. Studio preview catches the rest.
5. If an ElevenLabs/OpenAI key exists, use the API scripts (`npm run voice`, `npm run music`, `npm run assets` generate) instead of browser tabs.

**Art direction stays**: run `npm run direct -- <id>` after the scenes (as `/long` step 6b); it is one command and costs no extra assets. Keep film scenes to the budget it prints (≈ 1 per chapter, ≤ ~10 % of scenes in this lean mode).

**Render (still gated by Studio)**
6. After the Studio preview gate (mandatory, even with `auto`) render with **`npm run render -- <id> --crf 23`** (smaller/faster, no visible change after YouTube re-encode). Run in the background; re-run to resume. After Studio edits only the changed chapter files need deleting from `exports/<id>/parts/` — keep the others.
7. Everything else (check ✖ must be fixed, qa-editor gate, stills check, save, 3-line report) is identical to `/long`. In the report say "optimized workflow" and list what was skipped or reduced.

**Never trade away**: facts + sources, hook/re-hook rules, licences, the Studio gate, caption sync (read the timing table), eye-comfort rules.
Work without asking questions unless something is impossible.
