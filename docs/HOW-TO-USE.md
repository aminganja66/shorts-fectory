# How to use Shorts Factory (simple guide)

This project makes YouTube videos for two English channels:

- **brand**: business and brand stories (Netflix vs Blockbuster, Jio, Kodak…)
- **psych**: psychology effects explained with real studies

Claude does the research, script, pictures, animation, voice and render. **You only approve and upload.**
Claude never uploads to YouTube and never logs in to YouTube.

---

## 1. Start Claude

Open a terminal in the project folder and type:

```
claude --chrome
```

`--chrome` lets Claude use your Chrome tabs (ElevenLabs, ChatGPT, Pixabay). Keep those sites logged in.

---

## 2. Make a Short (30–85 seconds, vertical 9:16)

| You type | What happens |
|---|---|
| `/short brand` | Claude picks a new topic, researches it, writes the script, makes the pictures and music, and builds a plan. Then it **stops and waits for you**. |
| `/short brand Jio` | Same, but with the topic you chose. |
| `/short brand auto` | Does everything without stopping, up to the finished video. |
| `/short brand retry` | Makes the last topic again as a new version (`-v2`) so you can compare. |

**Length:** Claude picks the length from the story:

- quick: 30–42 s (one twist, one number)
- story: 43–58 s
- deep: 58–85 s (a long chain of events)

---

## 3. Make a long video (8–12 minutes, horizontal 16:9)

| You type | What happens |
|---|---|
| `/long brand` | Claude picks a company with a real story and plans a long video. Then it **stops and waits for you**. |
| `/long brand Jio` | Same, with your topic. |

Every long video has the same story shape:

1. **Cold open**: the most dramatic moment first, ending on a question
2. **The idea**: how it started
3. **The rise**: how it won
4. **The downfall**: what went wrong
5. **The comeback**: how it recovered (or tried to)
6. **Today**: where it is now, plus a question for the comments

Only the **brand** channel has long videos for now.

---

## 4. Check the plan, then approve

When Claude stops, open this file in your browser:

```
public/episodes/<episode-id>/storyboard.html
```

It shows the script, every scene, the pictures, small frames of the animation and the sources.
For a Short there is also a silent preview video: `exports/<episode-id>/draft.mp4`.

- Happy? Type **`approved`**, or **`/make <episode-id>`**.
- Want changes? Just say them, for example "make the hook stronger" or "change the picture in scene 3". Then approve.

`/make` makes the voice, puts the animation on the right words, renders the final video, and saves everything to GitHub.

---

## 5. Upload (you do this)

Everything is in `exports/<episode-id>/`:

| File | What it is |
|---|---|
| `short.mp4` or `long.mp4` | the video |
| `thumbnail.jpg` | the thumbnail |
| `upload.txt` | title, description, hashtags, credits, sources (and chapter times for long videos) |

When uploading:

- Copy title and description from `upload.txt`.
- If `upload.txt` says AI images were used, tick **"Altered or synthetic content"** in YouTube Studio.
- Keep the credits in the description (some photos need them).

After it's live, tell Claude the link, or type:

```
npm run history -- published <episode-id> <youtube-link>
```

This helps Claude pick better topics later.

---

## 6. Pause and resume

**Pause:** press **Esc**, or type "stop". Every finished step is already saved in the episode folder.

**Resume in the same conversation:**

```
claude --continue      (opens the last conversation)
claude --resume        (lets you pick an older one)
```

**Resume in a new conversation:** just type

```
continue episode <episode-id>
```

Claude looks at the episode folder, sees what's done and goes on from there.
If it was already approved, type `/make <episode-id>`.

**Switching laptops:** before you leave, tell Claude **"commit progress"**. Otherwise the other laptop won't see unfinished work. (Claude saves to GitHub by itself only when a topic is claimed and when a video is finished.)

---

## 7. See how far a video is

Look in `public/episodes/<episode-id>/`:

| If this exists… | …then this step is done |
|---|---|
| `research.md` | research |
| `storyboard.json` with lines | script |
| `assets/` folder with pictures | pictures |
| `frames/` and `storyboard.html` | plan (ready for your approval) |
| `voice.mp3` | voice (long videos: `voice-part-1.mp3`, `-2`… until all parts are joined) |
| `timing.json` | captions are synced to the voice |

And in `exports/<episode-id>/`:

| If this exists… | …then |
|---|---|
| `draft.mp4` | silent preview (Shorts only) |
| `parts/chapter-1.mp4`, `-2`… | long video: these chapters are rendered |
| `short.mp4` / `long.mp4` | finished |

---

## 8. Watch the video while it's being made (Remotion Studio)

```
npm run studio
```

1. Open **http://localhost:3000** in your browser.
2. On the left, pick **Short** (vertical) or **Long** (horizontal).
3. On the right under **Props**, change `episodeId` to your episode id.
4. Press play or drag the timeline.

- Before the voice exists, it plays a silent preview with guessed timing.
- When the storyboard changes, the preview updates by itself.
- If a picture isn't downloaded yet, that scene shows an error. That's normal for an unfinished episode.

---

## 9. How long things take

| Step | Time |
|---|---|
| Plan for a Short (research → plan file) | about 30–60 min |
| Final render, Short (40 s) | about 15–25 min |
| Final render, long video (10 min) | **about 4 hours**, so start it in the evening |

**Long-video render:** it renders one chapter at a time. If it stops (laptop sleeps, you close Claude), run the same command again and it continues where it stopped:

```
npm run render -- <episode-id>
```

You can run this yourself in any terminal. Claude doesn't need to be open.

---

## 10. Where pictures, music and sounds come from

**Allowed (free and safe for YouTube):**

- Logos and founder photos: Wikimedia Commons (with credit)
- Drawings and cut-outs: your ChatGPT tab (no real faces, no logos)
- Stock photos and video clips: Pexels, Pixabay, Openverse
- Music: ElevenLabs Music, Pixabay Music, YouTube Audio Library (you download that one yourself)
- Sound effects: ElevenLabs, Pixabay, Freesound (CC0 only), our own files in `public/sfx/`
- Voice: ElevenLabs (Jon for brand, Ellis for psych)

**Not allowed:** Google Images, Pinterest, news photos (Getty, Reuters, AP), movie or TV stills, other YouTubers' videos, songs from Spotify or YouTube, and anything marked "non-commercial".
Pinterest is fine for **ideas**: show Claude a style you like and it rebuilds it in code.

---

## 11. Other useful commands

| You type | What it does |
|---|---|
| `/topics brand` | Finds 15 fresh topic ideas and adds them to the backlog |
| `npm run check -- <id>` | Checks the episode for problems (✖ = must fix, ⚠ = should look) |
| `npm run frames -- <id>` | Renders small key frames of every scene |
| `npm run board -- <id>` | Rebuilds `storyboard.html` |
| `npm run history -- list brand` | Lists all topics already made for the channel |

---

## 12. If something goes wrong

| Problem | What to do |
|---|---|
| Claude asks about something it can't decide | Answer it. It only asks when it's really stuck. |
| The voice sounds robotic | Ask Claude to make it again (max 2 tries per video), or to try another voice from the channel config. |
| Captions are out of sync | Tell Claude. It fixes the voice pauses, not the captions. |
| A render stopped halfway | Run `npm run render -- <id>` again. |
| ElevenLabs credits are used up | Claude can use Pixabay music and sounds, or the free offline voice (`npm run voice:local`). |
| The other laptop doesn't have the newest work | On the laptop that has it: "commit progress". On the other one: Claude pulls at the start of every `/short` and `/long`. |

The full rules Claude follows are in `CLAUDE.md`. You don't need to read them, but you can.
