---
description: After approval → ElevenLabs voice, final render, history + git sync
argument-hint: <episode-id> [changes to apply first]
---
Episode: $ARGUMENTS

1. If changes were requested, apply them to public/episodes/<id>/storyboard.json, re-run `npm run assets` (if images changed), `npm run check`, `npm run board`.
2. If ELEVENLABS_API_KEY is missing, make the voice in the elevenlabs.io tab (Browser mode in CLAUDE.md).
3. Run steps 11–14 (motion-director re-syncs beats to the voice, qa-editor gates the render) of the one-click flow in CLAUDE.md (voice → render → verify stills → git commit + push → 3-line report).
