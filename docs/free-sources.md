# Free, copyright-safe sources (what Claude is allowed to use)

| Type | Source | Licence | Credit needed? | How Claude gets it |
|---|---|---|---|---|
| Logos | Wikimedia Commons | Mostly public-domain text logos (trademark still belongs to the brand) | Recommended | API `kind:"logo"` or Chrome tab |
| Founder/CEO photos | Wikimedia Commons | CC0 / PD / CC BY / CC BY-SA | **Yes** (auto in upload.txt) | API `kind:"person"` or Chrome tab |
| Stock photos | Openverse (CC0/PDM/BY), Pexels, Pixabay, Unsplash | Each site's free licence | Openverse BY: yes · others: no | API (Openverse/Wikimedia need no key) or Chrome tab |
| AI images | ChatGPT (chatgpt.com) or OpenAI API | Output owned by you (OpenAI terms) | No (tick "altered content" on YouTube if realistic) | Chrome tab or API |
| Voice | ElevenLabs (web or API) · Kokoro (free, offline, Apache-2.0) | Paid ElevenLabs plan = commercial use · Kokoro free | No | Chrome tab / API / `npm run voice:local` |
| Music | ElevenLabs Music · YouTube Audio Library · Pixabay Music | ElevenLabs paid plan · "no attribution" filter · Pixabay licence | Pixabay/YT: no | Chrome tab / API / manual download |
| Sound effects | ElevenLabs SFX · Pixabay SFX · `public/sfx/` originals | as above | No | Chrome tab / API |
| Effects (smoke, grain, light leaks, glitch, motion blur) | Built into this project's Remotion code | Yours | No | automatic (`fx`, `beats`, `theme.look`) |

**Not allowed:** Google Images, Getty/AP/Reuters/news photos, movie or TV stills, other YouTubers' clips, songs from Spotify/YouTube, random GitHub "free assets" repos without a clear licence file, AI images of real people's faces.

**GitHub tools this project uses (all open source):** Remotion (video engine), rembg (cut-outs), whisper.cpp via @remotion/install-whisper-cpp (caption timing), Kokoro (free Hindi voice), skills from remotion-dev / elevenlabs / coreyhaines31 / blader.
